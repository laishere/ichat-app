import callApi from "@/lib/api/call";
import userApi from "@/lib/api/user";
import { CallClient } from "@/lib/call/client";
import { CallMember, MediaConfig, VideoSource } from "@/lib/call/types";
import { Call, CallEndReason, CallStatus } from "@/lib/model/call";
import { User } from "@/lib/model/user";
import { getLoginUserId } from "@/lib/shared/login-user";
import { redirect } from "@/lib/shared/router";
import { Button } from "antd";
import { useEffect, useRef, useState } from "react";
import BottomBar from "./bottom";
import { LayoutGrid, LayoutMainA, LayoutMainB } from "./layouts";
import { LayoutType, Member } from "./types";
import { getInitCallMediaConfig } from "./config";

const mediaConfigKey = "callMediaConfig:";
function saveMediaConfig(callId: number, c: MediaConfig) {
  sessionStorage.setItem(mediaConfigKey + callId, JSON.stringify(c));
}
function loadMediaConfig(callId: number): MediaConfig | null {
  if (!globalThis.sessionStorage) {
    return null;
  }
  const json = sessionStorage.getItem(mediaConfigKey + callId);
  if (!json) {
    return null;
  }
  return JSON.parse(json);
}

function LoadingView() {
  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h1 className="text-2xl font-bold">正在连接...</h1>
    </div>
  );
}

function CallEndView({ info }: { info: Call }) {
  function goback() {
    redirect("/");
  }

  const isCaller = getLoginUserId() == info.callerId;

  let reason = "";
  switch (info.endReason as CallEndReason) {
    case CallEndReason.Rejected:
      reason = isCaller ? "对方拒绝" : "您已拒绝";
      break;
    case CallEndReason.NoAnswer:
      reason = "无人接听";
      break;
    case CallEndReason.Busy:
      reason = isCaller ? "对方忙碌" : "";
      break;
    case CallEndReason.LostConnection:
      reason = "网络连接中断";
      break;
    case CallEndReason.Error:
      reason = "通话异常";
      break;
    case CallEndReason.Cancelled:
      reason = "通话取消";
  }

  return (
    <div className="flex flex-col items-center justify-center h-full">
      <h1 className="text-2xl font-bold">通话已结束</h1>
      <p>{reason}</p>
      <Button onClick={goback}>返回主页</Button>
    </div>
  );
}

interface Params {
  callId: number;
}

export default function CallView({ callId }: Params) {
  let initMediaConfig = getInitCallMediaConfig();
  if (initMediaConfig == null) {
    initMediaConfig = loadMediaConfig(callId);
  }

  const clientRef = useRef<CallClient | null>(null);
  const calledRef = useRef(false);
  const [callMembers, setMemebrs] = useState<CallMember[]>([]);
  const [callInfo, setCallInfo] = useState<Call | null>(null);
  const [isCallReady, setCallReady] = useState(false);
  const [isMicrophoneOn, setMircoPhoneOn] = useState(
    initMediaConfig?.audio || false
  );
  const [videoSource, setVideoSource] = useState(
    initMediaConfig?.video || VideoSource.None
  );
  const [layoutType, setLayoutType] = useState(LayoutType.Main);
  const [userInfoMap, setUserInfoMap] = useState<Record<number, User>>({});
  const fetchCallInfoRef = useRef(fetchCallInfo);
  const fetchMemberInfosRef = useRef(fetchMemberInfos);
  const fetchingMemberRef = useRef(false);

  function fetchCallInfo(ended: boolean = false, reason: number = 0) {
    const f = () => {
      callApi
        .callInfo(callId)
        .then((info) => {
          setCallInfo(info);
        })
        .showError();
    };
    if (ended) {
      if (callInfo) {
        setCallInfo({
          ...callInfo!,
          status: CallStatus.End,
          endReason: reason,
        });
      }
    } else {
      f();
    }
  }
  fetchCallInfoRef.current = fetchCallInfo;

  async function fetchMemberInfos() {
    if (Object.keys(userInfoMap).length > 0 || fetchingMemberRef.current) {
      return;
    }
    fetchingMemberRef.current = true;
    const userIds = JSON.parse(callInfo!.members);
    const map = { ...userInfoMap };
    try {
      const users = await userApi.getUserInfos(userIds);
      users.forEach((user) => {
        if (user) {
          map[user.userId] = user;
        }
      });
    } catch {
      /* empty */
    }
    setUserInfoMap(map);
    fetchingMemberRef.current = false;
  }
  fetchMemberInfosRef.current = fetchMemberInfos;

  useEffect(() => {
    if (clientRef.current == null) {
      const client = new CallClient(callId);
      clientRef.current = client;
      client.onMembersChanged = (members) => {
        setMemebrs(members);
      };
      client.onCallStart = () => {
        fetchCallInfoRef.current();
      };
      client.onCallEnd = (reason) => {
        fetchCallInfoRef.current(true, reason);
      };
      client.onCallEndError = () => {
        fetchCallInfoRef.current();
      };
    }
    fetchCallInfoRef.current();
  }, [callId]);

  useEffect(() => {
    if (!callInfo) {
      return;
    }
    let timeout: NodeJS.Timeout | undefined = undefined;
    // console.log("call", callInfo);
    if (callInfo.status == CallStatus.New) {
      // 如果通话未准备好，那么定时刷新信息
      // todo，监听实时通知可能更好
      console.log("waiting for ready");
      timeout = setTimeout(() => {
        fetchCallInfoRef.current();
      }, 1000);
    } else {
      if (
        clientRef.current &&
        callInfo &&
        callInfo.status != CallStatus.End &&
        !calledRef.current
      ) {
        calledRef.current = true;
        clientRef.current.call();
        setCallReady(true);
      }
    }
    fetchMemberInfosRef.current();
    return () => {
      clearTimeout(timeout);
    };
  }, [callInfo]);

  useEffect(() => {
    const client = clientRef.current;
    const config = {
      video: videoSource,
      audio: isMicrophoneOn,
    };
    saveMediaConfig(callId, config);
    client?.updateMediaConfig(config);
  }, [isCallReady, isMicrophoneOn, videoSource, callId]);

  const members = callMembers.map((member) => {
    return {
      ...member,
      name: userInfoMap[member.userId]?.nickname || "",
      avatar: userInfoMap[member.userId]?.avatar,
    };
  });

  if (!callInfo) {
    return <LoadingView />;
  }

  if (callInfo.status == CallStatus.End) {
    return <CallEndView info={callInfo} />;
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <div className="flex-1 overflow-hidden relative">
        <MembersLayout layoutType={layoutType} members={members} />
      </div>
      <BottomBar
        callInfo={callInfo}
        isMicrophoneOn={isMicrophoneOn}
        setMircoPhoneOn={setMircoPhoneOn}
        videoSource={videoSource}
        setVideoSource={setVideoSource}
        layout={layoutType}
        setLayoutType={setLayoutType}
      />
    </div>
  );
}

function MembersLayout({
  members,
  layoutType,
}: {
  members: Member[];
  layoutType: LayoutType;
}) {
  if (members.length == 0) {
    return null;
  }
  if (layoutType == LayoutType.Grid) {
    return <LayoutGrid members={members} />;
  }
  return members.length > 2 ? (
    <LayoutMainB members={members} />
  ) : (
    <LayoutMainA members={members} />
  );
}
