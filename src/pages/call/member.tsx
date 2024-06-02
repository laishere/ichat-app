import Avatar from "@/components/Avatar";
import { getLoginUserId } from "@/lib/shared/login-user";
import { useEffect, useState } from "react";
import { AudioPlayer, AudioVolume } from "./audio";
import { Member } from "./types";
import { VideoView } from "./video";
import { UserStateType } from "@/lib/call/types";

function checkHasVideo(stream: MediaStream | null) {
  return stream != null && stream.getVideoTracks().length > 0;
}

export function MemberView({
  member,
  bordered = true,
  big = true,
}: {
  member: Member;
  bordered?: boolean;
  big?: boolean;
}) {
  const [hasVideo, setHasVideo] = useState(checkHasVideo(member.stream));
  const isMyself = member.userId == getLoginUserId();
  const [volume, setVolume] = useState(-1);
  useEffect(() => {
    const stream = member.stream;
    function updateTracks() {
      setHasVideo(checkHasVideo(stream));
    }
    updateTracks();
    if (!stream) {
      return;
    }
    stream.addEventListener("addtrack", updateTracks);
    stream.addEventListener("removetrack", updateTracks);
    return () => {
      stream.removeEventListener("addtrack", updateTracks);
      stream.removeEventListener("removetrack", updateTracks);
    };
  }, [member]);
  const displayName = isMyself ? "我" : member.name;
  const extraClass = bordered ? " border border-white border-solid" : "";
  const audioPlayer = (
    <AudioPlayer
      stream={member.stream}
      muted={isMyself}
      version={member.streamVersion}
      onVolumeChange={setVolume}
    />
  );
  const audioVolume = <AudioVolume volume={volume} size="0.8em" />;
  let tips = "";
  switch (member.state) {
    case UserStateType.Invited:
      tips = "已邀请";
      break;
    case UserStateType.Accepted:
      tips = "正在加入";
      break;
    case UserStateType.Rejected:
      tips = "已拒绝";
      break;
  }

  const onlineState =
    member.state == UserStateType.Online ||
    member.state == UserStateType.Offline ? (
      <div
        className={
          "size-[1em] rounded-full border-2 border-solid border-white " +
          (member.state == UserStateType.Online
            ? "bg-green-400"
            : "bg-orange-300")
        }
        title={member.state == UserStateType.Online ? "在线" : "离线"}
      />
    ) : null;

  return (
    <div
      className={
        "relative w-full h-full overflow-hidden box-border select-none " +
        extraClass
      }
    >
      {hasVideo ? (
        <>
          <VideoView stream={member.stream} />
          {audioPlayer}
          <div className="flex items-center space-x-1 absolute w-full overflow-hidden bottom-0 left-0 p-2">
            <div className="text-[0.4rem] mt-1">{onlineState}</div>
            <span
              className="text-md text-white relative"
              style={{ textShadow: "1px 1px 2px black" }}
            >
              {displayName}
            </span>
            {audioVolume}
          </div>
        </>
      ) : (
        <div className="absolute w-full h-full left-0 top-0 flex flex-col items-center justify-center bg-black">
          {audioPlayer}
          <div className="relative">
            <Avatar
              icon={<div className="w-full h-full bg-gray-200" />}
              src={member.avatar || undefined}
              className={big ? "size-[5rem]" : "size-[3rem]"}
            />
            <div
              className={
                "absolute bottom-0 " +
                (big ? "right-2 text-[0.8rem]" : "right-0 text-[0.5rem]")
              }
            >
              {onlineState}
            </div>
          </div>
          <div
            className={
              "flex items-center text-white " +
              (big ? "text-2xl mt-4 space-x-1" : "text-sm mt-2 space-x-0")
            }
          >
            <span>{displayName}</span>
            {audioVolume}
          </div>
          {tips && <div className="text-sm text-gray-500">{tips}</div>}
        </div>
      )}
    </div>
  );
}
