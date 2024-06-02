import Avatar from "@/components/Avatar";
import IconError from "@/icons/error";
import { CallStatus, isCallMember } from "@/lib/model/call";
import {
  Message,
  MessageStatus,
  MessageType,
  describeMessage,
} from "@/lib/model/chat";
import { getLoginUserId } from "@/lib/shared/login-user";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { resendMessage, revokeMessage } from "@/lib/store/messages";
import { fetchUser, selectUserById } from "@/lib/store/users";
import { openCall } from "@/pages/call/route";
import { Button, Popover } from "antd";
import { ReactNode, useContext, useEffect, useState } from "react";
import ChatImage from "./ChatImage";
import { MessageLayoutCallback } from "./MessageList";
import { selectCurrentContact } from "@/lib/store/contacts";

function MultilineText({ text }: { text: string }) {
  const lines = text.split("\n");
  const children: ReactNode[] = [];
  for (let i = 0; i < lines.length; i++) {
    children.push(<span key={i}>{lines[i]}</span>);
    if (i < lines.length - 1) {
      children.push(<br key={i + "br"} />);
    }
  }
  return children;
}

export default function ChatMessage(props: { item: Message }) {
  const { item } = props;
  const user = useAppSelector(selectUserById(item.senderId));
  const dispatch = useAppDispatch();
  const isLeft = getLoginUserId() !== item.senderId;
  const [menuOpen, setMenuOpen] = useState(false);
  const callback = useContext(MessageLayoutCallback);
  const isGroup = (useAppSelector(selectCurrentContact())?.groupId ?? 0) > 0;

  useEffect(() => {
    if (!user?.userId) {
      dispatch(fetchUser(item.senderId));
    }
  }, [item.senderId, dispatch, user?.userId]);

  function revoke() {
    if (item.revoked || item.type == MessageType.Call) {
      return;
    }
    setMenuOpen(false);
    dispatch(revokeMessage(item)).showError();
  }

  function onOpenMenuChange(o: boolean) {
    if (o && getLoginUserId() != item.senderId) {
      return;
    }
    setMenuOpen(o);
  }

  function onImageLoad() {
    callback?.();
  }

  function onClickMessage() {
    const call = item.call;
    if (call && call.status != CallStatus.End && isCallMember(call)) {
      openCall(call.callId);
    }
  }

  function resend() {
    dispatch(resendMessage(item)).showError();
  }

  const avatar = <Avatar src={user?.avatar} className="size-[2.6rem]" />;

  const sendFailedIcon =
    item.status == MessageStatus.Failed ? (
      <div className="mt-[0.3rem] cursor-pointer" onClick={resend}>
        <IconError color="#f00" fontSize="1.5rem" />
      </div>
    ) : null;

  const menu = (
    <Button
      className="w-20"
      onClick={revoke}
      disabled={item.type == MessageType.Call}
    >
      撤回
    </Button>
  );

  return (
    <div
      className={
        "flex space-x-3 mx-4 " + (isLeft ? "justify-start" : "justify-end")
      }
    >
      {isLeft ? avatar : null}
      <Popover
        content={menu}
        open={menuOpen}
        onOpenChange={onOpenMenuChange}
        trigger="contextMenu"
      >
        <div
          className={
            "flex space-x-2 mb-4 " + (isLeft ? "justify-start" : "justify-end")
          }
        >
          {isLeft ? null : sendFailedIcon}
          <div>
            {isLeft && isGroup ? (
              <div className="text-sm text-black h-[1.3rem] relative mt-[-0.2rem] mb-[0.2rem]">
                {user?.nickname}
              </div>
            ) : (
              <div className="h-[1.3rem]" />
            )}
            {item.type == MessageType.Image ? (
              <ChatImage message={item} onLoad={onImageLoad} />
            ) : (
              <div
                className="max-w-[20rem] max-h-[16rem] w-fit px-4 py-2 rounded-[0.8rem] overflow-hidden"
                style={{
                  borderTopLeftRadius: isLeft ? 0 : undefined,
                  borderTopRightRadius: !isLeft ? 0 : undefined,
                  background: isLeft ? "#78EEB666" : "#798AFA4D",
                  userSelect:
                    item.type == MessageType.Call ? "none" : undefined,
                }}
                onClick={onClickMessage}
              >
                {item.type == MessageType.Text ? (
                  <MultilineText text={item.text!} />
                ) : (
                  describeMessage(item)
                )}
              </div>
            )}
          </div>
          {!isLeft ? null : sendFailedIcon}
        </div>
      </Popover>
      {!isLeft ? avatar : null}
    </div>
  );
}
