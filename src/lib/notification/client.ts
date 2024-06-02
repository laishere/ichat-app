import { wsEndpoint } from "@/lib/config";
import { getLoginToken } from "../shared/login-user";

export enum NotificationState {
  Connecting,
  Connected,
  Closed,
}

export enum NotificationType {
  ChatMessage = 1,
  NewContact = 2,
  NewContactRequest = 3,
  CallHandled = 4,
}

export interface Notification {
  type: NotificationType;
  payload: unknown;
}

export interface SessionStartEvent {
  sessionId: string;
  lastDeliveryId: number | undefined;
}

interface NotificationEventMap {
  "session-start": SessionStartEvent;
  notification: Notification;
  state: NotificationState;
}

type EventListenerMap = {
  [K in keyof NotificationEventMap]?: ((ev: NotificationEventMap[K]) => void)[];
};

class NotificationClient {
  private ws: WebSocket | null = null;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private sessionId = "";
  private sessionIniting = false;
  private eventListeners: EventListenerMap = {};
  private _state = NotificationState.Closed;
  private heartbeatInterval: NodeJS.Timeout | null = null;

  public get state() {
    return this._state;
  }

  connect() {
    const token = getLoginToken();
    if (token === undefined || this._state != NotificationState.Closed) {
      return;
    }
    const endpoint = wsEndpoint("notification");
    console.log("ws connecting");
    const ws = new WebSocket(endpoint);
    this.ws = ws;
    this.sessionIniting = true;
    this.updateState(NotificationState.Connecting);
    ws.onopen = () => {
      console.log("ws opened");
      ws.send(token);
      ws.send(this.sessionId);
    };
    // globalThis.ws = ws;
    ws.onclose = (ev) => {
      if (this.ws != ws) {
        return;
      }
      console.warn("ws closed, reconnect in 3 seconds", ev.reason);
      this._close();
      this.reconnectTimer = setTimeout(() => this.connect(), 3000);
    };
    ws.onmessage = (ev) => this.handleMessage(ev.data);
  }

  addEventListener<K extends keyof NotificationEventMap>(
    type: K,
    listener: (ev: NotificationEventMap[K]) => void
  ) {
    const listeners: EventListenerMap[K] = this.eventListeners[type] || [];
    listeners.push(listener);
    this.eventListeners[type] = listeners;
  }

  removeEventListener<K extends keyof NotificationEventMap>(
    type: K,
    listener: (ev: NotificationEventMap[K]) => void
  ) {
    const listeners: EventListenerMap[K] = this.eventListeners[type] || [];
    const i = listeners.indexOf(listener);
    if (i >= 0) {
      listeners.splice(i, 1);
    }
  }

  private dispatchEvent<K extends keyof NotificationEventMap>(
    type: K,
    ev: NotificationEventMap[K]
  ) {
    const listeners = this.eventListeners[type] || [];
    for (const listener of listeners) {
      listener(ev);
    }
  }

  private initSession(s: string) {
    this.sessionIniting = false;
    const sessionPrefix = "session:";
    const lines = s.split("\n");
    const i = lines[0].indexOf(sessionPrefix);
    if (i != 0) {
      console.error("failed to init session", s);
      this.ws?.close();
      return;
    }
    this.sessionId = lines[0].substring(sessionPrefix.length);
    let lastDeliveryId: number | undefined = undefined;
    if (lines.length > 1) {
      lastDeliveryId = parseInt(lines[1]);
    }
    console.log("notification session", this.sessionId, lastDeliveryId);
    this.dispatchEvent("session-start", {
      sessionId: this.sessionId,
      lastDeliveryId,
    });
    this.updateState(NotificationState.Connected);
    this.startHeartbeat();
  }

  private startHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    this.heartbeatInterval = setInterval(() => {
      if (this.ws) {
        this.ws.send("1");
      }
    }, 30000);
  }

  private handleMessage(data: string) {
    if (this.sessionIniting) {
      this.initSession(data);
      return;
    }
    const notification = JSON.parse(data) as Notification;
    this.dispatchEvent("notification", notification);
  }

  private updateState(s: NotificationState) {
    this._state = s;
    this.dispatchEvent("state", s);
  }

  private _close() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.ws) {
      console.log("closing ws");
      this.ws.close();
      this.ws = null;
    }
    this.updateState(NotificationState.Closed);
  }

  close() {
    this._close();
    this.sessionId = "";
  }
}

export { NotificationClient };
