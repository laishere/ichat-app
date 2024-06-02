import soundAsset from "@/assets/notification.mp3";
import { Message } from "@/lib/model/chat";
import { Contact, ContactRequest } from "@/lib/model/contact";
import { getLoginUserId } from "@/lib/shared/login-user";
import { useAppDispatch } from "@/lib/store";
import { addNewContact, insertNewContactRequest } from "@/lib/store/contacts";
import { messageInbox } from "@/lib/store/messages";
import { SyncClient } from "@/lib/sync";
import { useEffect, useMemo, useRef } from "react";
import { useNotificationClient } from ".";
import { Notification, NotificationType, SessionStartEvent } from "./client";

interface NewMessage extends Message {
  isNew: boolean;
}

export function DefaultConsumer() {
  const dispatch = useAppDispatch();
  const audioRef = useRef<HTMLAudioElement>(null);
  const client = useNotificationClient();
  const actionsRef = useRef<typeof actions>();

  function playAudio() {
    const audio = audioRef.current;
    if (audio) {
      audio.currentTime = 0;
      audio.play();
    }
  }

  const actions = useMemo(
    () => ({
      onMessage(m: NewMessage) {
        dispatch(messageInbox(m));
        if (m.isNew && m.senderId !== getLoginUserId()) {
          playAudio();
        }
      },
      onContact(c: Contact) {
        dispatch(addNewContact(c));
      },
      onContactRequest(r: ContactRequest) {
        dispatch(insertNewContactRequest(r));
        playAudio();
      },
    }),
    [dispatch]
  );
  actionsRef.current = actions;

  useEffect(() => {
    if (!client) {
      return;
    }
    const handler = (n: Notification) => {
      const actions = actionsRef.current!;
      switch (n.type) {
        case NotificationType.ChatMessage:
          actions.onMessage(n.payload as NewMessage);
          break;
        case NotificationType.NewContact:
          actions.onContact(n.payload as Contact);
          break;
        case NotificationType.NewContactRequest:
          actions.onContactRequest(n.payload as ContactRequest);
          break;
      }
    };
    client.addEventListener("notification", handler);
    return () => {
      client.removeEventListener("notification", handler);
    };
  }, [client]);

  return (
    <audio src={soundAsset} autoPlay={false} loop={false} ref={audioRef} />
  );
}

export function SyncConsumer() {
  const dispatch = useAppDispatch();
  const client = useNotificationClient();
  const syncRef = useRef(new SyncClient());

  syncRef.current.dispatch = dispatch;

  useEffect(() => {
    if (!client) {
      return;
    }
    const sessionStartHandler = (ev: SessionStartEvent) => {
      syncRef.current.onNotificationSessionStart(
        ev.sessionId,
        ev.lastDeliveryId
      );
    };
    const notficationHandler = (n: Notification) => {
      if (n.type == NotificationType.ChatMessage) {
        const m = n.payload as Message;
        syncRef.current.onMessageInbox(m.deliveryId!);
      }
    };
    client.addEventListener("session-start", sessionStartHandler);
    client.addEventListener("notification", notficationHandler);
    return () => {
      client.removeEventListener("session-start", sessionStartHandler);
      client.removeEventListener("notification", notficationHandler);
    };
  }, [client]);

  return null;
}
