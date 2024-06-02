import IconMicOff from "@/icons/mic-off";
import IconMicOn from "@/icons/mic-on";
import callApi from "@/lib/api/call";
import { VideoSource } from "@/lib/call/types";
import { CallStatus } from "@/lib/model/call";
import { Button, Modal, Select } from "antd";
import { useEffect, useMemo, useState } from "react";
import { LayoutType } from "./types";

interface Params {
  callInfo: any;
  isMicrophoneOn: boolean;
  setMircoPhoneOn: (on: boolean) => void;
  videoSource: VideoSource;
  setVideoSource: (source: VideoSource) => void;
  layout: LayoutType;
  setLayoutType: (layout: LayoutType) => void;
}

export default function BottomBar(params: Params) {
  const {
    callInfo,
    isMicrophoneOn,
    setMircoPhoneOn,
    videoSource,
    setVideoSource,
    layout,
    setLayoutType,
  } = params;
  const [showHangup, setShowHangup] = useState(false);

  function hangup() {
    setShowHangup(false);
    callApi.hangup(callInfo.callId).showError();
  }

  function toggleMicrophone() {
    setMircoPhoneOn(!isMicrophoneOn);
  }

  const VideoSelect = useMemo(() => {
    return (
      <Select
        value={videoSource}
        onChange={(value) => setVideoSource(value)}
        style={{ width: "6rem" }}
        options={[
          { value: VideoSource.None, label: "关闭" },
          { value: VideoSource.Camera, label: "摄像头" },
          { value: VideoSource.Screen, label: "屏幕" },
        ]}
      />
    );
  }, [videoSource, setVideoSource]);

  const LayoutSelect = useMemo(() => {
    return (
      <Select
        value={layout}
        onChange={(value) => setLayoutType(value)}
        style={{ width: "6.5rem" }}
        options={[
          { value: LayoutType.Main, label: "主次布局" },
          { value: LayoutType.Grid, label: "栅格布局" },
        ]}
      />
    );
  }, [layout, setLayoutType]);

  return (
    <>
      <div className="flex h-16 bg-slate-100 items-center px-4 relative">
        <div className="absolute left-0 top-0 w-full h-full flex items-center justify-center">
          <CallTime callInfo={callInfo} />
        </div>
        <div className="flex-1 items-center space-x-4">
          {VideoSelect}
          <Button
            onClick={toggleMicrophone}
            icon={isMicrophoneOn ? <IconMicOn /> : <IconMicOff />}
          >
            麦克风{isMicrophoneOn ? "开" : "关"}
          </Button>
        </div>
        <div className="items-center space-x-4">
          <Button onClick={() => setShowHangup(true)} danger>
            离开
          </Button>
          {LayoutSelect}
        </div>
      </div>
      <Modal
        width="20rem"
        title="确认"
        okText="离开"
        okType="danger"
        cancelText="取消"
        centered
        open={showHangup}
        onOk={hangup}
        onCancel={() => setShowHangup(false)}
      >
        确定离开通话吗？
      </Modal>
    </>
  );
}

function CallTime({ callInfo }: { callInfo: any }) {
  const [_, displayTimeTick] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (callInfo?.status == CallStatus.Active) {
      timer = setInterval(() => {
        displayTimeTick((tick) => tick + 1);
      }, 1000);
    }
    return () => {
      clearInterval(timer);
    };
  }, [callInfo]);

  function calcTime(a: Date, b: Date) {
    const duration = b.getTime() - a.getTime();
    if (duration < 0) {
      return "--:--:--";
    }
    const hours = Math.floor(duration / 1000 / 60 / 60);
    const minutes = Math.floor((duration / 1000 / 60) % 60);
    const seconds = Math.floor((duration / 1000) % 60);
    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  }

  function displayTime() {
    if (!callInfo) {
      return "--:--:--";
    }
    const status = callInfo.status as CallStatus;
    const startTime = callInfo.startTime && new Date(callInfo.startTime);
    const endTime = callInfo.endTime && new Date(callInfo.endTime);
    if (status == CallStatus.Active && startTime) {
      return calcTime(startTime, new Date());
    }
    if (status == CallStatus.End && endTime) {
      return calcTime(startTime, endTime);
    }
    return "--:--:--";
  }

  return <span className="color-slate-700">{displayTime()}</span>;
}
