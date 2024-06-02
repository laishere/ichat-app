import { Message } from "../model/chat";
import { get, post } from "./common";

interface SendMessageForm {
  contactId: number;
  localId: string;
}

interface SendTextForm extends SendMessageForm {
  text: string;
}

interface SendImageForm extends SendMessageForm {
  thumbnail: string;
  image?: string;
}

function sendMessage(form: SendTextForm | SendImageForm) {
  return post<Message>("chat/send", form);
}

function delayUpload(messageId: number, image: string) {
  return post("chat/delayUpload", { messageId, image });
}

function getHistoryMessages(
  contactId: number,
  lastMessageId?: number,
  limit: number = 10
) {
  return get<Message[]>("chat/messages", { contactId, lastMessageId, limit });
}

function revokeMessage(messageId: number) {
  return post("chat/revoke", undefined, { params: { messageId } });
}

function syncMessages(synced: number, limit: number, last?: number) {
  return get<Message[]>("chat/sync", { last, synced, limit });
}

const chatApi = {
  sendMessage,
  getHistoryMessages,
  revokeMessage,
  syncMessages,
  delayUpload,
};

export default chatApi;
