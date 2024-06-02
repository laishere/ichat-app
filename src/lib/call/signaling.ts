import {
  Signaling,
  SignalingMessage,
  SignalingMessageType,
  SignalingType,
  UserState,
} from "./types";

type SignalingMessageHandler = (message: SignalingMessage) => void;

class SignalingClient {
  private token: string;
  private messageHandler: SignalingMessageHandler;
  private reconnectTimer: NodeJS.Timeout | null;
  private endpoint: string;
  private ws: WebSocket | null;
  private closed: boolean;

  constructor(
    endpoint: string,
    token: string,
    messageHandler: SignalingMessageHandler
  ) {
    this.token = token;
    this.messageHandler = messageHandler;
    this.reconnectTimer = null;
    this.endpoint = endpoint;
    this.ws = null;
    this.closed = false;
  }

  connect() {
    console.log("connecting...");
    const ws = new WebSocket(this.endpoint);
    this.ws = ws;
    ws.onopen = () => {
      console.log("connected");
      ws.send(this.token);
    };
    ws.onmessage = (event) => {
      const message = JSON.parse(event.data) as SignalingMessage;
      this.messageHandler(message);
    };
    ws.onclose = () => {
      this.ws = null;
      if (this.closed) {
        return;
      }
      console.log("abnormal close, reconnecting...");
      this.reconnectTimer = setTimeout(() => {
        if (!this.closed) {
          this.connect();
        }
      }, 3000);
    };
  }

  close() {
    this.closed = true;
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
    }
    this.ws?.close();
  }

  private send(type: number, payload: string = "") {
    const message = JSON.stringify({ type, payload });
    this.ws?.send(message);
  }

  sendHeartbeat() {
    this.send(SignalingMessageType.Heartbeat);
  }

  sendSignal(toUserId: number, type: SignalingType, payload: unknown) {
    this.send(
      SignalingMessageType.Signaling,
      JSON.stringify({
        toUserId,
        message: JSON.stringify({
          type,
          payload,
        }),
      })
    );
  }
}

export { SignalingClient };

export function updateUserStatesPayload(m: SignalingMessage) {
  return JSON.parse(m.payload) as UserState[];
}

export function updateUserStatePayload(m: SignalingMessage) {
  return JSON.parse(m.payload) as UserState;
}

export function callEndPayload(m: SignalingMessage) {
  return parseInt(m.payload);
}

export function signalingPayload(m: SignalingMessage) {
  const a = JSON.parse(m.payload);
  return {
    fromUserId: a.fromUserId,
    message: JSON.parse(a.message) as Signaling,
  };
}
