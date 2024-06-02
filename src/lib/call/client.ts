import callApi from "../api/call";
import { wsEndpoint } from "../config";
import { CallEndReason } from "../model/call";
import { getLoginUserId } from "../shared/login-user";
import { CallSession } from "./session";
import {
  SignalingClient,
  signalingPayload,
  updateUserStatePayload,
  updateUserStatesPayload,
} from "./signaling";
import {
  CallMember,
  MediaConfig,
  Signaling,
  SignalingMessage,
  SignalingMessageType,
  SignalingType,
  UserState,
  UserStateType,
  VideoSource,
} from "./types";

enum State {
  IDLE,
  CALLING,
  ACTIVE,
  CLOSED,
}

class CallClient {
  private callId: number;
  private sig: SignalingClient | null = null;
  private state = State.IDLE;
  private myUserId: number;
  private userStates: Record<number, UserState> = {};
  private userSessions: Record<number, CallSession> = {};
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private mediaStream: MediaStream = new MediaStream();
  private userMediaStream: MediaStream = new MediaStream();
  private displayMediaStream: MediaStream = new MediaStream();
  private mediaConfig: MediaConfig;

  onError: (error: Error) => void = () => {};
  onMembersChanged: (members: CallMember[]) => void = () => {};
  onCallStart: () => void = () => {};
  onCallEnd: (reason: CallEndReason) => void = () => {};
  onCallEndError: () => void = () => {};

  constructor(callId: number) {
    this.myUserId = getLoginUserId()!;
    this.callId = callId;
    this.mediaConfig = {
      video: VideoSource.None,
      audio: false,
    };
  }

  updateMediaConfig(c: MediaConfig) {
    if (
      this.mediaConfig.video == c.video &&
      this.mediaConfig.audio == c.audio
    ) {
      return;
    }
    this.mediaConfig = c;
    this.updateMediaStream();
  }

  private stopMediaStream() {
    const stop = (s: MediaStream) => {
      for (const track of s.getTracks()) {
        track.stop();
        s.removeTrack(track);
      }
    };
    stop(this.mediaStream);
    stop(this.userMediaStream);
    stop(this.displayMediaStream);
  }

  private updateSessionMediaStream() {
    const stream = this.mediaStream;
    for (const userId in this.userSessions) {
      this.userSessions[userId].setMyMediaStream(stream);
    }
    this.updateMembers();
  }

  // 按需修改track，避免视频黑屏
  private applyStream(s: MediaStream) {
    const oldTracks = this.mediaStream.getTracks();
    const oldTrackIds = new Set(oldTracks.map((t) => t.id));
    const newTrackIds = new Set(s.getTracks().map((t) => t.id));
    for (const newTrack of s.getTracks()) {
      if (!oldTrackIds.has(newTrack.id)) {
        // 规定：本地修改track无法触发listener
        this.mediaStream.addTrack(newTrack);
      }
    }
    for (const oldTrack of oldTracks) {
      if (!newTrackIds.has(oldTrack.id)) {
        this.mediaStream.removeTrack(oldTrack);
      }
    }
  }

  private updateMediaStream() {
    if (this.state != State.ACTIVE) {
      return;
    }
    this.getMediaStream()
      .then((stream) => {
        this.applyStream(stream);
        this.updateSessionMediaStream();
      })
      .catch((e) => {
        console.error(e);
      });
  }

  private removeTracks(s: MediaStream, tracks: MediaStreamTrack[]) {
    for (const track of tracks) {
      s.removeTrack(track);
      track.stop();
      console.log("stop track", track.label);
    }
  }

  private addTracks(s: MediaStream, tracks: MediaStreamTrack[]) {
    for (const track of tracks) {
      s.addTrack(track);
    }
  }

  private async getMediaStream() {
    const screen = this.mediaConfig.video == VideoSource.Screen;
    const camera = this.mediaConfig.video == VideoSource.Camera;
    const audio = this.mediaConfig.audio;
    const stream = new MediaStream();
    const hasCamera = this.userMediaStream.getVideoTracks().length != 0;
    const hasAudio = this.userMediaStream.getAudioTracks().length != 0;
    const needCamera = camera && !hasCamera;
    const needAudio = audio && !hasAudio;
    if (camera != hasCamera && !camera) {
      this.removeTracks(
        this.userMediaStream,
        this.userMediaStream.getVideoTracks()
      );
    }
    if (audio != hasAudio && !audio) {
      this.removeTracks(
        this.userMediaStream,
        this.userMediaStream.getAudioTracks()
      );
    }
    if (needCamera || needAudio) {
      const s = await navigator.mediaDevices.getUserMedia({
        video: needCamera,
        audio: needAudio,
      });
      this.addTracks(this.userMediaStream, s.getTracks());
    }
    this.addTracks(stream, this.userMediaStream.getTracks());
    if (screen) {
      if (this.displayMediaStream.getTracks().length == 0) {
        const s = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
        this.addTracks(this.displayMediaStream, s.getTracks());
      }
      this.addTracks(stream, this.displayMediaStream.getTracks());
    } else {
      this.removeTracks(
        this.displayMediaStream,
        this.displayMediaStream.getTracks()
      );
    }
    return stream;
  }

  private async getToken() {
    return callApi.joinCall(this.callId);
  }

  private updateState(s: State) {
    if (s == this.state) {
      return;
    }
    this.state = s;
  }

  private endpoint() {
    return wsEndpoint("call");
  }

  private updateUserStates(states: UserState[]) {
    console.log("update user states", states);
    const newStates: typeof this.userStates = {};
    for (const s of states) {
      newStates[s.userId] = s;
    }
    for (const userId in this.userStates) {
      this.onUserStateChanged(this.userStates[userId], newStates[userId]);
    }
    for (const userId in newStates) {
      if (!this.userStates[userId]) {
        this.onUserStateChanged(undefined, newStates[userId]);
      }
    }
    this.userStates = newStates;
    this.updateMembers();
  }

  private updateUserState(state: UserState) {
    console.log("update user state", state);
    const oldState = this.userStates[state.userId];
    this.onUserStateChanged(oldState, state);
    this.userStates[state.userId] = state;
    this.updateMembers();
  }

  private onUserStateChanged(oldState?: UserState, newState?: UserState) {
    if (oldState && newState) {
      if (oldState!.state == newState!.state) {
        return;
      }
    }
    if ((oldState?.userId || newState?.userId) == this.myUserId) {
      return;
    }
    if (!oldState) {
      console.assert(newState);
      const session = new CallSession(
        this.myUserId,
        newState!.userId,
        this.sig!
      );
      session.onPeerMediaStreamChange = () => {
        this.updateMembers();
      };
      this.userSessions[newState!.userId] = session;
      this.syncSession(newState!);
    } else if (!newState) {
      console.assert(oldState);
      this.userSessions[oldState.userId].close();
      delete this.userSessions[oldState.userId];
    } else {
      this.syncSession(newState);
    }
  }

  private syncSession(state: UserState) {
    if (state.userId == this.myUserId) {
      return;
    }
    const session = this.userSessions[state.userId];
    if (!session) {
      return;
    }
    if (state.state == UserStateType.Online) {
      session.connect();
    } else {
      session.close();
    }
  }

  private updateMembers() {
    const members: CallMember[] = [];
    const states = this.userStates;
    for (const userId in states) {
      const state = states[userId];
      if (
        state.state == UserStateType.Dead ||
        state.state == UserStateType.Rejected
      ) {
        continue;
      }
      const stream =
        this.myUserId == state.userId
          ? this.mediaStream
          : this.userSessions[userId]?.getPeerMediaStream();
      members.push({
        userId: parseInt(userId),
        state: state.state,
        stream: stream,
        streamVersion: new Date().getTime(), // 本地媒体音频轨道修改无法触发事件，通过version标识
      });
    }
    this.onMembersChanged(members);
  }

  private handleSignaling(fromUserId: number, m: Signaling) {
    // console.log("handle signaling", fromUserId, m.type);
    const session = this.userSessions[fromUserId];
    if (!session) {
      console.log("session not found", fromUserId);
      return;
    }
    switch (m.type) {
      case SignalingType.Offer:
        session.createAnswer(m.payload);
        break;
      case SignalingType.Answer:
        session.setAnswer(m.payload);
        break;
      case SignalingType.IceCandidate:
        session.addIceCandidate(m.payload);
        break;
      default:
        console.error("unknown signaling", m);
        break;
    }
  }

  private handleMessage(m: SignalingMessage) {
    // console.log("handle message", m.type);
    switch (m.type) {
      case SignalingMessageType.UpdateUserStates:
        this.updateUserStates(updateUserStatesPayload(m));
        break;
      case SignalingMessageType.UpdateUserState:
        this.updateUserState(updateUserStatePayload(m));
        break;
      case SignalingMessageType.Unauthorized:
        // todo
        this.close();
        break;
      case SignalingMessageType.Error:
        // todo
        console.log("error", m.payload);
        break;
      case SignalingMessageType.CallStart:
        this.onCallStart();
        break;
      case SignalingMessageType.CallEnd:
        this.onCallEnd(parseInt(m.payload));
        this.close();
        break;
      case SignalingMessageType.Signaling:
        {
          const p = signalingPayload(m);
          this.handleSignaling(p.fromUserId, p.message);
        }
        break;
      default:
        console.error("unknow message", m);
        break;
    }
  }

  private heartbeatLoop() {
    this.heartbeatInterval = setInterval(() => {
      this.sig?.sendHeartbeat();
    }, 10000);
  }

  call() {
    if (this.state == State.CALLING || this.state == State.ACTIVE) {
      console.log("invalid state", this.state);
      return;
    }
    console.log("calling");
    this.updateState(State.CALLING);
    this.getToken()
      .then((token) => {
        this.sig = new SignalingClient(this.endpoint(), token, (m) =>
          this.handleMessage(m)
        );
        this.sig.connect();
      })
      .then(() => {
        this.updateState(State.ACTIVE);
        this.heartbeatLoop();
        this.updateMediaStream();
        console.log("active");
      })
      .catch((e) => {
        console.error(e);
        this.onError(e);
        this.close();
        this.onCallEndError();
      });
  }

  private clearSessions() {
    for (const userId in this.userSessions) {
      this.userSessions[userId].close();
    }
    this.userSessions = {};
    this.userStates = {};
  }

  close() {
    if (this.sig) {
      this.sig.close();
    }
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    this.stopMediaStream();
    this.clearSessions();
    this.updateState(State.CLOSED);
    console.log("closed");
  }
}

export { CallClient };
