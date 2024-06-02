import { useAppDispatch, useAppSelector } from "@/lib/store";
import { selectCurrentContact } from "@/lib/store/contacts";
import {
  fetchMoreHistoryMessages,
  initFetchHistoryMessages,
  selectRoomMessages,
} from "@/lib/store/messages";
import { Spin } from "antd";
import { createContext, useEffect, useMemo, useRef, useState } from "react";
import MessageItem, { mapMessageItems, messageItemKey } from "./MessageItem";

type LayoutCallback = () => void;

export const MessageLayoutCallback = createContext<LayoutCallback | null>(null);

const lazyPageSize = 30;

export default function MessageList() {
  const currentContact = useAppSelector(selectCurrentContact());
  const { contactId, roomId } = currentContact!;
  const roomMessages = useAppSelector(selectRoomMessages(roomId));
  const [lazyListSize, setLazyListSize] = useState(lazyPageSize);
  const dispatch = useAppDispatch();
  const listWrapperRef = useRef<HTMLDivElement>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const anchorOffset = useRef<number>();
  const lockScrollUntilRef = useRef(Date.now());
  const lockScrollRef = useRef(lockScroll);
  const lockScrollValid = useRef(true);
  const onScrollRef = useRef(updateScroll);
  const animRef = useRef<number>();
  const lastMessageId = useRef(-1);
  const messages = roomMessages?.messages || [];

  useEffect(() => {
    dispatch(initFetchHistoryMessages(contactId, roomId));
  }, [contactId, roomId, dispatch]);

  useEffect(() => {
    lastMessageId.current = -1;
    setLazyListSize(lazyPageSize);
  }, [contactId]);

  useEffect(() => {
    const messages = roomMessages?.messages || [];
    if (messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage.messageId !== lastMessageId.current) {
        // console.log(
        //   "scroll to bottom",
        //   lastMessage.messageId,
        //   lastMessageId.current
        // );
        lastMessageId.current = lastMessage.messageId;
        anchorOffset.current = undefined; // scroll to bottom
        lockScroll();
        onScrollRef.current();
      }
    }
  }, [roomMessages?.messages]);

  function lockScroll(dt: number = 300) {
    lockScrollUntilRef.current = Date.now() + dt;
    requestAnimationFrame(() => {
      lockScrollUntilRef.current = Date.now() + dt;
    });
  }
  lockScrollRef.current = lockScroll;

  function saveAnchorOffset() {
    const listWrapper = listWrapperRef.current!;
    const anchor = anchorRef.current!;
    anchorOffset.current = anchor.offsetTop - listWrapper.scrollTop;
  }

  function restoreAnchorOffset() {
    const listWrapper = listWrapperRef.current!;
    const top =
      anchorOffset.current === undefined
        ? listWrapper.scrollHeight - listWrapper.clientHeight
        : anchorRef.current!.offsetTop - anchorOffset.current!;
    listWrapper.scrollTop = top;
    lockScrollValid.current = true;
  }

  function onMessageLayout() {
    if (lockScrollValid.current) {
      // console.log("update scroll");
      updateScroll();
    }
  }

  function loadMore() {
    saveAnchorOffset();
    if (lazyListSize < messages.length) {
      const newSize = lazyListSize + lazyPageSize;
      lockScroll(300);
      setLazyListSize(newSize);
      if (newSize <= messages.length) {
        // console.log("local list is large enough");
        return;
      }
    }
    if (roomMessages.hasMore && !roomMessages.loading) {
      setLazyListSize(Number.MAX_SAFE_INTEGER);
      dispatch(
        fetchMoreHistoryMessages(contactId, roomId, () => {
          saveAnchorOffset(); // 更新状态前保存锚点位置
          lockScroll();
        })
      );
    }
  }

  function updateScroll() {
    // 问题：当运行动画时，锁定滚动会和已有动画冲突，从而出现抽搐现象
    if (!listWrapperRef.current) {
      return;
    }
    if (lockScrollValid.current || lockScrollUntilRef.current > Date.now()) {
      restoreAnchorOffset();
      return;
    }
    if (!roomMessages) {
      return;
    }
    const scrollTop = listWrapperRef.current.scrollTop;
    if (scrollTop < listWrapperRef.current.clientHeight / 2) {
      loadMore();
    }
  }
  onScrollRef.current = updateScroll;

  function onScroll() {
    if (lockScrollValid.current) {
      // console.log("lock scroll breaks");
      lockScrollValid.current = false;
    }
    updateScroll();
  }

  const items = useMemo(() => {
    const messages = roomMessages?.messages || [];
    return mapMessageItems(
      messages.slice(
        Math.max(0, messages.length - lazyListSize),
        messages.length
      )
    );
  }, [roomMessages, lazyListSize]);

  if (!roomMessages) {
    return <div className="flex-1" />;
  }

  if (animRef.current) cancelAnimationFrame(animRef.current);
  animRef.current = requestAnimationFrame(() => {
    updateScroll();
  });

  return (
    <div
      ref={listWrapperRef}
      onScroll={onScroll}
      className="flex-1 overflow-y-auto overflow-x-hidden space-y-4 py-4"
    >
      {roomMessages.hasMore && (
        <div className="mx-auto w-fit">
          <Spin />
        </div>
      )}
      <MessageLayoutCallback.Provider value={onMessageLayout}>
        {items.map((item, index) => (
          <MessageItem key={messageItemKey(item, index)} item={item} />
        ))}
      </MessageLayoutCallback.Provider>
      <div ref={anchorRef} />
    </div>
  );
}
