import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { Message, MessageStatus, MessageType } from "../model/chat";
import { AppDispatch, RootState } from ".";
import { updateLastMessage } from "./contacts";
import chatApi from "../api/chat";
import { v4 as uuidv4 } from "uuid";
import { getLoginUserId } from "../shared/login-user";
import { Contact } from "../model/contact";
import {
  createThumbnail,
  imageFile,
  ImageID,
  releaseImage,
  uploadImage,
} from "../image";

interface RoomMessages {
  roomId: number;
  messages: Message[];
  hasMore: boolean;
  loading: boolean;
}

interface MessagesState {
  messagesMap: Record<number, RoomMessages>;
}

const initialState: MessagesState = {
  messagesMap: {},
};

interface HistoryMessagesPayLoad {
  roomId: number;
  messages: Message[];
  hasMore: boolean;
}

type CancelFn = () => void;

const localIds = new Set<string>();
const uploadTask: Record<string, CancelFn> = {};

function createLocalId() {
  const id = uuidv4();
  localIds.add(id);
  return id;
}

function isLocalMessage(localId: string) {
  return localIds.has(localId);
}

function setUploadTask(localId: string, cancel: CancelFn) {
  uploadTask[localId] = cancel;
}

function removeUploadTask(localId: string) {
  delete uploadTask[localId];
}

function cancelUploadTask(localId: string) {
  const cancel = uploadTask[localId];
  if (cancel) {
    cancel();
    delete uploadTask[localId];
  }
}

function getOrInit(state: MessagesState, roomId: number): RoomMessages {
  if (!state.messagesMap[roomId]) {
    state.messagesMap[roomId] = {
      roomId: roomId,
      messages: [],
      hasMore: true,
      loading: false,
    };
  }
  return state.messagesMap[roomId];
}

function messagesIdSet(r: RoomMessages) {
  return new Set(r.messages.map((m) => m.messageId));
}

function isSameMessage(a: Message, b: Message) {
  return (
    (a.messageId !== 0 && a.messageId === b.messageId) ||
    (a.messageId === 0 && a.localId === b.localId)
  );
}

const messagesSlice = createSlice({
  name: "messages",
  initialState,
  reducers: {
    updateLoading: (
      state,
      action: PayloadAction<{ roomId: number; loading: boolean }>
    ) => {
      const { roomId, loading } = action.payload;
      getOrInit(state, roomId).loading = loading;
    },
    appendHistoryMessages: (
      state,
      action: PayloadAction<HistoryMessagesPayLoad>
    ) => {
      const { roomId, messages, hasMore } = action.payload;
      const roomMessages = getOrInit(state, roomId);
      const messageIds = messagesIdSet(roomMessages);
      roomMessages.messages = messages
        .filter((m) => !messageIds.has(m.messageId))
        .concat(roomMessages.messages);
      roomMessages.hasMore = hasMore;
      roomMessages.loading = false;
    },
    insertMessages: (state, action: PayloadAction<Message[]>) => {
      const messages = action.payload;
      messages.sort((a, b) => a.messageId - b.messageId);
      for (const message of messages) {
        const roomMessages = getOrInit(state, message.roomId);
        const ins = roomMessages.messages.findIndex(
          (m) => m.messageId >= message.messageId
        );
        if (ins == -1) {
          roomMessages.messages.push(message);
        } else if (isSameMessage(roomMessages.messages[ins], message)) {
          roomMessages.messages[ins] = message;
        } else {
          roomMessages.messages.splice(ins, 0, message);
        }
      }
    },
    appendMessage: (state, action: PayloadAction<Message>) => {
      const message = action.payload;
      const roomMessages = getOrInit(state, message.roomId);
      const oldIndex = roomMessages.messages.findIndex((m) =>
        isSameMessage(m, message)
      );
      if (oldIndex == -1) {
        roomMessages.messages.push(message);
      } else {
        const old = roomMessages.messages[oldIndex];
        if (old.revoked) {
          /* 被撤回消息不允许更新 */
          return;
        }
        if (
          !old.localId /* 注意localId以本地为准，后端仅在发送时返回localId */ ||
          !isLocalMessage(old.localId) ||
          message.status !== undefined
        ) {
          /* 别人发送的消息或者主动更新（带status）的本地消息，可以直接替换 */
          roomMessages.messages[oldIndex] = message;
        } else {
          /* 
          后端返回的消息，除了被撤回的外，不能直接更新，否则会丢失本地可能需要的信息:
          - 本地id
          - 状态
          - 本地图片
          以上信息以本地消息为准
          */
          if (message.revoked) {
            /* 被撤回消息立即更新 */
            roomMessages.messages[oldIndex] = message;
            if (old.localId) {
              cancelUploadTask(old.localId);
            }
          } else {
            roomMessages.messages[oldIndex] = {
              ...message,
              image:
                old.image ||
                message.image /* 可能多次更新，后端返回的消息由于延迟image可能从不存在 -> 存在，如果本地可用直接用本地 */,
              localId: old.localId,
              status: old.status,
              localImage: old.localImage,
            };
          }
        }
      }
    },
  },
});

const pageSize = 10;

export const initFetchHistoryMessages =
  (contactId: number, roomId: number) =>
  async (dispatch: AppDispatch, getState: () => RootState) => {
    const roomMessages = getState().messages.messagesMap[roomId];
    if (roomMessages && roomMessages.messages.length >= pageSize) {
      return;
    }
    await dispatch(fetchMoreHistoryMessages(contactId, roomId));
  };

export const fetchMoreHistoryMessages =
  (contactId: number, roomId: number, beforeSetState: () => void = () => {}) =>
  async (dispatch: AppDispatch, getState: () => RootState) => {
    const state = getState();
    const roomMessages = state.messages.messagesMap[roomId] || {
      hasMore: true,
      messages: [],
      loading: false,
    };
    if (!roomMessages.hasMore || roomMessages.loading) {
      return;
    }
    const lastMessageId = roomMessages.messages[0]?.messageId;
    dispatch(updateLoading({ roomId, loading: true }));
    await chatApi
      .getHistoryMessages(contactId, lastMessageId, pageSize)
      .then((messages) => {
        beforeSetState();
        dispatch(
          appendHistoryMessages({
            roomId,
            messages,
            hasMore: messages.length >= pageSize,
          })
          // no need to update loading here
        );
        if (
          (!roomMessages || roomMessages.messages.length == 0) &&
          messages.length > 0
        ) {
          dispatch(
            updateContactLastMessageIfNeeded(messages[messages.length - 1])
          );
        }
      })
      .catch(() => {
        dispatch(updateLoading({ roomId, loading: false }));
      });
  };

export const syncMissingMessages =
  (synced: number) => async (dispatch: AppDispatch) => {
    const pageSize = 10;
    let lastDeliveryId = undefined;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const messages = await chatApi.syncMessages(
        synced,
        pageSize,
        lastDeliveryId
      );
      if (messages.length > 0) {
        dispatch(insertMessages(messages));
        dispatch(
          updateContactLastMessageIfNeeded(messages[messages.length - 1])
        );
      }
      if (messages.length < pageSize) {
        break;
      }
      lastDeliveryId = messages[messages.length - 1].deliveryId!;
    }
  };

const updateContactLastMessageIfNeeded =
  (message: Message) => (dispatch: AppDispatch, getState: () => RootState) => {
    const state = getState();
    const roomId = message.roomId;
    const messages = state.messages.messagesMap[roomId]?.messages || [];
    if (messages.length == 0) return;
    const lastMessage = messages[messages.length - 1];
    if (isSameMessage(lastMessage, message)) {
      dispatch(updateLastMessage(lastMessage));
    }
  };

interface SendMessage {
  contact: Contact;
  text?: string;
  image?: ImageID;
}

export const sendMessage =
  (m: SendMessage) => async (dispatch: AppDispatch) => {
    const localMessage: Message = {
      messageId: 0,
      contactId: m.contact.contactId,
      localId: createLocalId(),
      status: MessageStatus.Sending,
      roomId: m.contact.roomId,
      senderId: getLoginUserId() || 0,
      type: m.text ? MessageType.Text : MessageType.Image,
      text: m.text,
      localImage: m.image,
      call: undefined,
      revoked: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await send(dispatch, localMessage);
  };

export const resendMessage =
  (localMessage: Message) => async (dispatch: AppDispatch) => {
    if (
      localMessage.messageId != 0 ||
      localMessage.status != MessageStatus.Failed
    ) {
      return;
    }
    await send(dispatch, localMessage);
  };

const doDelayUpload =
  (m: Message) => async (dispatch: AppDispatch, getState: () => RootState) => {
    console.log("delay upload", m.messageId!);
    try {
      let uploadError: unknown;
      if (!m.image) {
        const img = m.localImage!;
        try {
          const task = new Promise<string>((resolve, reject) => {
            const localId = m.localId!;
            setUploadTask(localId, () => {
              reject("上传任务已取消");
              resolve = reject = () => {};
            });
            uploadImage(img)
              .then((r) => resolve(r))
              .catch((e) => reject(e))
              .finally(() => {
                removeUploadTask(localId);
              });
          });
          const image = await task;
          m = {
            ...m,
            image,
            localImage: undefined,
          };
          append(dispatch, m);
          releaseImage(img);
        } catch (e) {
          uploadError = e;
        }
      }
      const old = getState().messages.messagesMap[m.roomId].messages.find((v) =>
        isSameMessage(v, m)
      );
      if (old && old.revoked) {
        /* 消息在上传图片时被撤回，不必再提交，同时无需更新状态 */
        console.log("message revoked during delay upload");
        return;
      }
      if (uploadError) {
        throw uploadError;
      }
      await chatApi.delayUpload(m.messageId!, m.image!);
      m = {
        ...m,
        status: MessageStatus.Sent,
      };
      append(dispatch, m);
    } catch (e) {
      console.error("delay upload error", e);
      append(dispatch, { ...m, status: MessageStatus.Failed });
      throw e;
    }
  };

const send = async (dispatch: AppDispatch, localMessage: Message) => {
  if (
    localMessage.messageId !== 0 &&
    localMessage.status !== MessageStatus.Failed
  ) {
    return;
  }
  localMessage = { ...localMessage, status: MessageStatus.Sending };
  append(dispatch, localMessage);
  if (localMessage.messageId !== 0) {
    return dispatch(doDelayUpload(localMessage));
  }
  try {
    let delayUpload = false;
    if (localMessage.type == MessageType.Image && !localMessage.image) {
      const img = localMessage.localImage!;
      if (localMessage.thumbnail === undefined) {
        const thumbnail = await createThumbnail(img);
        console.log("thumbnail size", thumbnail.length);
        localMessage = { ...localMessage, thumbnail };
        append(dispatch, localMessage);
      }
      const file = imageFile(img);
      const delayUploadSize = 1024 * 512;
      delayUpload = file.size > delayUploadSize;
      if (!delayUpload) {
        console.log("upload image no delay", img);
        const image = await uploadImage(img);
        localMessage = { ...localMessage, image, localImage: undefined };
        append(dispatch, localMessage);
        releaseImage(img);
      }
    }
    const m = await (localMessage.type == MessageType.Text
      ? chatApi.sendMessage({
          contactId: localMessage.contactId!,
          localId: localMessage.localId!,
          text: localMessage.text!,
        })
      : chatApi.sendMessage({
          contactId: localMessage.contactId!,
          localId: localMessage.localId!,
          thumbnail: localMessage.thumbnail!,
          image: localMessage.image,
        }));
    localMessage = delayUpload
      ? {
          ...m,
          status: MessageStatus.Sending,
          localImage: localMessage.localImage,
          thumbnail: localMessage.thumbnail,
        }
      : { ...m, status: MessageStatus.Sent };
    append(dispatch, localMessage);
    if (delayUpload) {
      dispatch(doDelayUpload(localMessage));
    }
  } catch (e) {
    console.error("send message error", e);
    append(dispatch, { ...localMessage, status: MessageStatus.Failed });
    throw e;
  }
};

const append = (dispatch: AppDispatch, message: Message) => {
  dispatch(appendMessage(message));
  dispatch(updateContactLastMessageIfNeeded(message));
};

export const messageInbox = (message: Message) => (dispatch: AppDispatch) => {
  append(dispatch, message);
};

export const revokeMessage =
  (message: Message) => async (dispath: AppDispatch) => {
    if (message.messageId == 0 || message.revoked) {
      return;
    }
    await chatApi.revokeMessage(message.messageId).then(() => {
      append(dispath, { ...message, revoked: true });
    });
  };

export const selectRoomMessages = (roomId: number) => (state: RootState) => {
  return state.messages.messagesMap[roomId];
};

const { appendHistoryMessages, updateLoading, insertMessages } =
  messagesSlice.actions;

export const { appendMessage } = messagesSlice.actions;

export default messagesSlice.reducer;
