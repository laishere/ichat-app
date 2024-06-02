import { formatTime } from "@/lib/fmt/time";
import { Message } from "@/lib/model/chat";
import { getLoginUserId } from "@/lib/shared/login-user";
import { useAppSelector } from "@/lib/store";
import { selectUserById } from "@/lib/store/users";
import ChatMessage from "./ChatMessage";

enum ItemType {
  Message,
  Time,
  Tips,
}

interface Item {
  type: ItemType;
  item: any;
}

export function messageItemKey(item: Item, index: number) {
  if (item.type == ItemType.Message) {
    const m = item.item as Message;
    return m.localId || m.messageId;
  }
  return "i_" + index;
}

export function mapMessageItems(list: Message[]) {
  const items: Item[] = [];
  let lastTime = 0;
  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    const time = new Date(item.createdAt).getTime();
    if (time - lastTime > 5 * 60 * 1000) {
      items.push({ type: ItemType.Time, item: time });
      lastTime = time;
    }
    if (item.revoked) {
      items.push({ type: ItemType.Tips, item });
    } else {
      items.push({ type: ItemType.Message, item });
    }
  }
  return items;
}

function RevokeTips(props: { item: Message }) {
  const { item } = props;
  const isMyself = getLoginUserId() == item.senderId;
  const sender = useAppSelector(selectUserById(item.senderId));
  let tips;
  if (isMyself) {
    tips = "您撤回了一条消息";
  } else {
    tips = sender?.nickname ? `${sender.nickname}撤回了一条消息` : "消息已撤回";
  }
  return <div className="text-center text-gray-600 text-xs mt-2">{tips}</div>;
}

export default function MessageItem(props: { item: Item }) {
  const { item } = props;
  if (item.type == ItemType.Message) {
    return <ChatMessage item={item.item} />;
  }
  if (item.type == ItemType.Time) {
    return (
      <div className="text-center text-gray-600 text-xs mt-2">
        {formatTime(new Date(item.item))}
      </div>
    );
  }
  return <RevokeTips item={item.item} />;
}
