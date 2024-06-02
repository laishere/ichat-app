import ChatInput from "./ChatInput";
import MessageList from "./MessageList";

export default function Chat() {
  return (
    <div
      className="h-full flex flex-col overflow-hidden"
      style={{ background: "#ffffff30" }}
    >
      <MessageList />
      <ChatInput />
    </div>
  );
}
