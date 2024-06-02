export enum VideoSource {
  None,
  Camera,
  Screen,
}

export interface MediaConfig {
  video: VideoSource;
  audio: boolean;
}

export interface CallMember {
  userId: number;
  state: UserStateType;
  stream: MediaStream | null;
  streamVersion: number;
}

export enum SignalingMessageType {
  Unauthorized = 1,
  UpdateUserStates = 2,
  UpdateUserState = 3,
  Signaling = 4,
  Heartbeat = 5,
  CallStart = 6,
  CallEnd = 7,
  Error = 8,
}

export enum SignalingType {
  Offer = 1,
  Answer = 2,
  IceCandidate = 3,
}

export enum UserStateType {
  Invited = 1,
  Rejected = 2,
  Accepted = 3,
  Online = 4,
  Offline = 5,
  Dead = 6,
}

export interface SignalingMessage {
  type: number;
  payload: string;
}

export interface UserState {
  userId: number;
  state: UserStateType;
}

export interface Signaling {
  type: SignalingType;
  payload: any;
}
