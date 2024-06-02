import { Message } from "@/lib/model/chat";
import Image from "@/components/Image";
import { useEffect, useMemo, useState } from "react";
import { extractThumbnail } from "@/lib/image";

const maxWidthRem = 20;
const maxHeightRem = 16;

export default function ChatImage({
  message,
  onLoad,
}: {
  message: Message;
  onLoad: () => void;
}) {
  const [loaded, setLoaded] = useState(false);
  const thumbnail = useMemo(() => {
    const r = extractThumbnail(message.thumbnail);
    if (!r) {
      return undefined;
    }
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const scale = Math.min(
      (maxWidthRem * rem) / r.size[0],
      (maxHeightRem * rem) / r.size[1]
    );
    return {
      width: r.size[0] * scale + "px",
      height: r.size[1] * scale + "px",
      base64: r.base64,
    };
  }, [message.thumbnail]);

  useEffect(() => {
    setLoaded(false);
  }, [message.image]);

  const downloadName = useMemo(() => {
    const img = message.image;
    if (!img) {
      return undefined;
    }
    const i = img.lastIndexOf("/");
    return img.substring(i + 1);
  }, [message.image]);

  function onImageLoad() {
    if (!thumbnail) {
      /* 仅当无法通过thumbnail确定尺寸才调用onLoad */
      onLoad();
    }
    setLoaded(true);
  }

  const uploadTimeout = 1000 * 60 * 3;
  const isUploadFailed =
    !message.image &&
    !message.localImage &&
    Date.now() - new Date(message.createdAt).getTime() > uploadTimeout;

  return (
    <div
      className="rounded-md overflow-hidden relative"
      style={{
        maxWidth: maxWidthRem + "rem",
        maxHeight: maxHeightRem + "rem",
        width: thumbnail?.width,
        height: thumbnail?.height,
      }}
    >
      {thumbnail && !loaded && (
        <Image
          className="w-full h-full blur-md"
          wrapperClassName="w-full h-full"
          src={thumbnail?.base64}
          alt=""
          preview={false}
        />
      )}
      <div className={thumbnail ? "w-full h-full absolute top-0 left-0" : ""}>
        {isUploadFailed ? (
          <div className="w-full h-full flex items-center justify-center bg-black bg-opacity-30 text-white select-none text-sm">
            <span className="p-4">图片上传失败</span>
          </div>
        ) : (
          <Image
            className="max-w-full max-h-full"
            wrapperClassName="max-w-full max-h-full"
            src={message.image}
            alt=""
            onLoad={onImageLoad}
            download={downloadName}
          />
        )}
      </div>
    </div>
  );
}
