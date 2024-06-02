import { SignalingClient } from "./signaling";
import { SignalingType } from "./types";

enum State {
  IDLE,
  CONNECTING,
  CONNECTED,
  CLOSED,
}

enum NegoRole {
  OFFER,
  ANSWER,
}

enum OfferState {
  Idle,
  CreateOffer,
  SendOffer,
  SetAnswer,
  Done,
}

enum AnswerState {
  Idle,
  SetOffer,
  CreateAnswer,
  SendAnswer,
  Done,
}

type NegoState = OfferState | AnswerState;

class CallSession {
  private myUserId: number;
  private peerUserId: number;
  private state: State = State.IDLE;
  private sig: SignalingClient;
  private rtc: RTCPeerConnection | null = null;
  private myMediaStream: MediaStream | null = null;
  private peerMediaStream: MediaStream | null = null;
  private reconnectTimer: number | null = null;
  private negoTimeout: NodeJS.Timeout | null = null;
  private negotiationDirty = false;
  private negoRole = NegoRole.OFFER;
  private negoState: NegoState = 0;

  onStateChange: (state: State) => void = () => {};
  onPeerMediaStreamChange: (stream: MediaStream) => void = () => {};

  constructor(myUserId: number, peerUserId: number, sig: SignalingClient) {
    this.myUserId = myUserId;
    this.peerUserId = peerUserId;
    this.sig = sig;
    this.reset();
  }

  private createConfig() {
    return {
      iceServers: [
        { urls: "stun:stun.miwifi.com" },
        { urls: "stun:stun.voipbuster.com" },
      ],
    };
  }

  private updateState(s: State) {
    if (s == this.state) {
      return;
    }
    this.state = s;
    this.onStateChange(s);
  }

  private setPeerMediaStream(stream: MediaStream) {
    this.peerMediaStream = stream;
    this.onPeerMediaStreamChange(stream);
  }

  getPeerMediaStream() {
    return this.peerMediaStream;
  }

  setMyMediaStream(stream: MediaStream | null) {
    this.myMediaStream = stream;
    if (!this.rtc) {
      return;
    }
    this.applyStream();
  }

  private applyStream() {
    const stream = this.myMediaStream;
    console.log("apply stream", stream?.getTracks().length);
    const rtc = this.rtc!;
    const oldTrackIds = new Set<string>();
    rtc.getSenders().forEach((sender) => {
      const trackId = sender.track?.id;
      if (stream && trackId && stream.getTrackById(trackId)) {
        oldTrackIds.add(trackId);
        return;
      }
      console.log("remove track", sender.track);
      rtc.removeTrack(sender);
    });
    if (stream) {
      for (const track of stream.getTracks()) {
        if (oldTrackIds.has(track.id)) {
          continue;
        }
        rtc.addTrack(track, stream);
        console.log("add track", track);
      }
    }
  }

  private reset() {
    this.peerMediaStream = null;
    this.rtc = null;
    this.negotiationDirty = false;
    this.negoRole =
      this.myUserId < this.peerUserId ? NegoRole.OFFER : NegoRole.ANSWER;
    this.negoState = 0;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    if (this.negoTimeout) {
      clearTimeout(this.negoTimeout);
    }
  }

  connect() {
    if (this.state == State.CONNECTING || this.state == State.CONNECTED) {
      console.log("invalid state", this.state);
      return;
    }
    const rtc = new RTCPeerConnection(this.createConfig());
    this.rtc = rtc;
    this.updateState(State.CONNECTING);
    rtc.addEventListener("connectionstatechange", () => {
      console.log("connectionstatechange", rtc.connectionState);
      switch (rtc.connectionState) {
        case "connected":
          this.updateState(State.CONNECTED);
          break;
        case "closed":
          this.reset();
          this.updateState(State.CLOSED);
          break;
      }
    });
    rtc.addEventListener("icecandidate", (event) => {
      if (event.candidate) {
        this.sig!.sendSignal(
          this.peerUserId,
          SignalingType.IceCandidate,
          event.candidate
        );
      }
    });
    rtc.addEventListener("track", (event) => {
      console.log("track", event);
      this.setPeerMediaStream(event.streams[0]);
    });
    rtc.addEventListener("negotiationneeded", (ev) => {
      console.log("negotiationneeded", ev);
      this.negotiate();
    });
    this.applyStream();
    this.negotiate(); // 可能本地没有媒体，导致没有发sdp，但是对端有媒体需要sdp offer
  }

  private negotiate() {
    if (!this.rtc) {
      return;
    }
    if (this.negoState != 0) {
      this.negotiationDirty =
        (this.negoRole == NegoRole.OFFER &&
          this.negoState >= OfferState.CreateOffer) ||
        (this.negoRole == NegoRole.ANSWER &&
          this.negoState >= AnswerState.CreateAnswer);
      console.log("negotiating, dirty:", this.negotiationDirty);
      return;
    }
    console.log("negotiate begin");
    const rtc = this.rtc!;
    this.negoRole =
      this.myUserId < this.peerUserId || rtc.localDescription
        ? NegoRole.OFFER
        : NegoRole.ANSWER;
    if (this.negoRole == NegoRole.OFFER) {
      this.createOffer();
    } else {
      console.log("waiting for offer");
    }
  }

  private clearNegoTimeout() {
    if (this.negoTimeout) {
      clearTimeout(this.negoTimeout);
      this.negoTimeout = null;
    }
  }

  private isNegoDone() {
    return (
      (this.negoRole == NegoRole.OFFER && this.negoState == OfferState.Done) ||
      (this.negoRole == NegoRole.ANSWER && this.negoState == AnswerState.Done)
    );
  }

  private updateNegoState(s: NegoState) {
    this.negoState = s;
    this.clearNegoTimeout();
    if (!this.isNegoDone()) {
      this.negoTimeout = setTimeout(() => {
        console.log("nego timeout");
        this.renegociate();
      }, 3000);
    } else {
      console.log(
        "nego done, role:",
        this.negoRole == NegoRole.OFFER ? "offer" : "answer"
      );
      this.negoState = 0;
      if (this.negotiationDirty) {
        this.renegociate();
      }
    }
  }

  private renegociate() {
    this.negoState = 0;
    this.negotiationDirty = false;
    this.negotiate();
  }

  private createOffer() {
    const rtc = this.rtc!;
    this.updateNegoState(OfferState.CreateOffer);
    const cancelled = Symbol("cancelled");
    rtc
      .createOffer()
      .then((offer) => {
        if (this.negoRole == NegoRole.ANSWER) {
          console.log("offer cancelled");
          throw cancelled;
        }
        return rtc.setLocalDescription(offer);
      })
      .then(() => {
        this.updateNegoState(OfferState.SendOffer);
        console.log("offer", rtc.localDescription);
        this.sig!.sendSignal(
          this.peerUserId,
          SignalingType.Offer,
          rtc.localDescription
        );
      })
      .catch((error) => {
        if (error !== cancelled) {
          console.error(error);
        }
      });
  }

  private handleOfferConflict(sdp: RTCSessionDescriptionInit) {
    console.log("offer conflict");
    if (this.myUserId < this.peerUserId) {
      console.log("drop offer");
      return;
    }
    console.log("switch role to answer");
    this.negoRole = NegoRole.ANSWER;
    this.negoState = AnswerState.Idle;
    this.rtc!.setLocalDescription(undefined).then(() => this.createAnswer(sdp));
  }

  createAnswer(sdp: RTCSessionDescriptionInit) {
    if (!this.rtc) {
      return;
    }
    if (this.negoRole == NegoRole.OFFER) {
      if (this.negoState) {
        this.handleOfferConflict(sdp);
        return;
      }
      this.negoRole = NegoRole.ANSWER;
    }
    this.updateNegoState(AnswerState.CreateAnswer);
    const rtc = this.rtc!;
    rtc
      .setRemoteDescription(sdp) // 注意需要时间
      .then(() => rtc.createAnswer())
      .then((answer) => rtc.setLocalDescription(answer))
      .then(() => {
        this.updateNegoState(AnswerState.SendAnswer);
        console.log("answer", rtc.localDescription);
        this.sig!.sendSignal(
          this.peerUserId,
          SignalingType.Answer,
          rtc.localDescription
        );
      })
      .then(() => {
        this.updateNegoState(AnswerState.Done);
      })
      .catch((error) => {
        console.error(error);
      });
  }

  setAnswer(sdp: RTCSessionDescriptionInit) {
    if (!this.rtc) {
      return;
    }
    if (this.negoRole != NegoRole.OFFER) {
      console.error("Role [Answer] can't set answer", this.negoState);
      return;
    }
    console.log("setAnswer", sdp);
    this.updateNegoState(OfferState.SetAnswer);
    this.rtc!.setRemoteDescription(sdp).then(() => {
      this.updateNegoState(OfferState.Done);
    });
  }

  addIceCandidate(candidate: RTCIceCandidate) {
    if (!this.rtc || !this.rtc.remoteDescription) {
      return;
    }
    this.rtc.addIceCandidate(candidate).catch(() => {});
  }

  close() {
    if (this.state != State.CONNECTING && this.state != State.CONNECTED) {
      return;
    }
    if (this.rtc) {
      this.rtc.close();
    }
    this.reset();
    this.updateState(State.CLOSED);
    console.log("closed");
  }
}

export { CallSession };
