import IconImage from "@/icons/image";
import IconVideo from "@/icons/video";
import { ImageID, putImage } from "@/lib/image";
import { messageInstance } from "@/lib/shared/message";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { selectCurrentContact } from "@/lib/store/contacts";
import { sendMessage } from "@/lib/store/messages";
import { Button } from "antd";
import { useEffect, useRef, useState } from "react";
import CallModal from "./CallModal";

export default function ChatInput() {
  const [text, setText] = useState("");
  const dispatch = useAppDispatch();
  const currentContact = useAppSelector(selectCurrentContact())!;
  const { contactId } = currentContact;
  const [loading, setLoading] = useState(false);
  const compositioningRef = useRef(false);
  const [openMakeCall, setOpenMakeCall] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setText("");
  }, [contactId]);

  function _sendMessage(msg: { text?: string; image?: ImageID }) {
    if (!text && !msg.image) {
      return;
    }
    setLoading(true);
    setText("");
    return dispatch(
      sendMessage({
        contact: currentContact,
        ...msg,
      })
    )
      .showError()
      .finally(() => setLoading(false));
  }

  function sendTextMessage() {
    if (text.trim() === "") return;
    _sendMessage({ text: text.trim() });
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (compositioningRef.current) {
      return;
    }
    if (e.key == "Enter" && !e.shiftKey) {
      sendTextMessage();
      e.preventDefault();
    }
  }

  function pickImage() {
    if (loading) {
      return;
    }
    imageInputRef.current?.click();
  }

  function onFileChanged(ev: React.ChangeEvent<HTMLInputElement>) {
    const file = ev.target.files?.[0];
    ev.target.value = "";
    if (!file) {
      return;
    }
    const maxSize = 1024 * 1024 * 10;
    if (file.size > maxSize) {
      messageInstance().warning("文件大小不能超过10M");
      return;
    }
    _sendMessage({ image: putImage(file) });
  }

  function handlePaste(d: DataTransfer): boolean {
    for (const item of d.items) {
      if (item.kind == "file" && item.type.startsWith("image")) {
        const file = item.getAsFile()!;
        _sendMessage({ image: putImage(file) });
        return true;
      }
    }
    return false;
  }

  const textAreaStyles: React.CSSProperties = {
    background: "transparent",
    resize: "none",
    border: "none",
    outline: "none",
    font: "inherit",
  };

  const iconBtnClass = "size-[2rem] text-[1.1rem] ms-2 cursor-pointer";

  return (
    <div
      className="h-48 flex flex-col overflow-hidden"
      style={{ background: "#ffffff60" }}
    >
      <CallModal
        contact={currentContact}
        open={openMakeCall}
        onOpenChange={setOpenMakeCall}
      />
      <textarea
        className="flex-1 px-4 py-4"
        style={textAreaStyles}
        placeholder="输入文本/粘贴/拖动图片"
        onKeyDown={onKeyDown}
        onCompositionStart={() => (compositioningRef.current = true)}
        onCompositionEnd={() => (compositioningRef.current = false)}
        value={text}
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
        }}
        onDrop={(e) => {
          e.preventDefault();
          handlePaste(e.dataTransfer);
        }}
        onPaste={(e) => {
          if (handlePaste(e.clipboardData)) {
            e.preventDefault();
          }
        }}
        onChange={(e) => setText(e.target.value)}
      />
      <div className="h-[2.2rem] flex justify-end mb-2 me-4">
        <input
          type="file"
          accept="image/*"
          hidden
          ref={imageInputRef}
          onChange={onFileChanged}
        />
        <IconImage className={iconBtnClass} onClick={pickImage} />
        <IconVideo
          className={iconBtnClass}
          onClick={() => setOpenMakeCall(true)}
        />
        <Button
          disabled={!loading && text.trim() === ""}
          loading={loading}
          type="primary"
          className="ms-4"
          onClick={sendTextMessage}
        >
          发送
        </Button>
      </div>
    </div>
  );
}
