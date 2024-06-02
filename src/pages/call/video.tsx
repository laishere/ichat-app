import { useEffect, useRef } from "react";

export function VideoView({
  stream
}: {
  stream: MediaStream | null;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <video
      style={{
        background: "black",
      }}
      muted={true}
      ref={videoRef}
      autoPlay
      playsInline
      className="w-full h-full"
    ></video>
);
}
