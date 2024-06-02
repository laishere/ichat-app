import { ImageID } from "../image";
import { Call, describeCall } from "./call";

export enum MessageType {
  Text = 1,
  Image = 2,
  Call = 3,
}

export enum MessageStatus {
  Sent = 0,
  Sending = 1,
  Failed = 2,
}

interface LocalMessage {
  localId?: string;
  contactId?: number;
  status?: MessageStatus;
  localImage?: ImageID;
}

export interface Message extends LocalMessage {
  messageId: number;
  deliveryId?: number;
  roomId: number;
  senderId: number;
  type: number;
  text?: string;
  image?: string;
  thumbnail?: string;
  call?: Call;
  revoked: boolean;
  createdAt: string;
  updatedAt: string;
}

export function describeMessage(message: Message, simple: boolean = false) {
  if (message.revoked) {
    return "[消息已撤回]";
  }
  switch (message.type) {
    case MessageType.Text:
      return message.text;
    case MessageType.Image:
      return "[图片]";
    case MessageType.Call:
      if (!message.call || simple) {
        // console.error("call is empty", message);
        return "[通话]";
      }
      return describeCall(message.call);
    default:
      return "";
  }
}
