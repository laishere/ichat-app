import ringingSound from "@/assets/ringing.mp3";
import Avatar from "@/components/Avatar";
import IconPhone from "@/icons/phone";
import IconPhoneDown from "@/icons/phone-down";
import callApi from "@/lib/api/call";
import { VideoSource } from "@/lib/call/types";
import { Call, CallStatus, isCallee } from "@/lib/model/call";
import { Message } from "@/lib/model/chat";
import { useNotificationClient } from "@/lib/notification";
import { Notification, NotificationType } from "@/lib/notification/client";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { fetchUser, selectUserById } from "@/lib/store/users";
import { initCallMediaConfig } from "@/pages/call/config";
import { openCall } from "@/pages/call/route";
import { Button } from "antd";
import { useEffect, useRef, useState } from "react";
import "./style.css";

enum State {
  Opening,
  Opened,
  Closing,
  Closed,
}

interface Params {
  call?: Call;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function IncomingCallPopup(params: Params) {
  const { call, open, onOpenChange } = params;
  const [state, setState] = useState(State.Closed);
  const [localCall, setLocalCall] = useState<Call>();
  const caller = useAppSelector(selectUserById(localCall?.callerId ?? 0));
  const dispatch = useAppDispatch();
  const ringingRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (open) {
      if (state == State.Closed) {
        const audio = ringingRef.current;
        if (audio) {
          audio.currentTime = 0;
          audio.play();
        }
        setState(State.Opening);
        setTimeout(() => {
          setState(State.Opened);
        }, 500);
      }
    } else {
      if (state == State.Opened) {
        ringingRef.current?.pause();
        setState(State.Closing);
        setTimeout(() => {
          setState(State.Closed);
        }, 1000);
      }
    }
  }, [open, state]);

  useEffect(() => {
    if (open) {
      setLocalCall(call);
    }
  }, [open, call]);

  useEffect(() => {
    if (localCall && !caller) {
      dispatch(fetchUser(localCall.callerId));
    }
  }, [localCall, caller, dispatch]);

  let animStyles = {};
  if (state == State.Opening) {
    animStyles = {
      animation: "showFromTop 0.5s ease",
    };
  } else if (state == State.Closing) {
    animStyles = {
      animation: "hideToTop 0.5s ease forwards",
    };
  }

  function answer() {
    onOpenChange(false);
    initCallMediaConfig({
      video: VideoSource.None,
      audio: false,
    });
    setTimeout(() => {
      openCall(call!.callId);
    }, 500);
  }

  function hangup() {
    onOpenChange(false);
    callApi.hangup(call!.callId).showError();
  }

  const body = (
    <div className="fixed w-full top-0 left-0 flex justify-center">
      <div
        className="h-20 rounded-2xl bg-slate-950 bg-opacity-75 shadow-xl mt-4 flex items-center px-4"
        style={animStyles}
      >
        <Avatar
          className="size-[3rem] bg-gray-200"
          src={caller?.avatar || undefined}
        />
        <div className="flex flex-col ms-2 w-40 overflow-hidden">
          <div className="text-lg text-white text-ellipsis">
            {caller?.nickname || "--"}
          </div>
          <div className="text-sm text-gray-100">邀请您进行通话</div>
        </div>
        <Button
          shape="circle"
          type="primary"
          size="large"
          style={{
            background: "#fc3503",
          }}
          onClick={hangup}
          icon={<IconPhoneDown fontSize="0.7rem" color="#fff" />}
        />
        <Button
          className="ms-3"
          shape="circle"
          type="primary"
          size="large"
          style={{
            background: "#0fb825",
          }}
          onClick={answer}
          icon={<IconPhone fontSize="1rem" color="#fff" />}
        />
      </div>
    </div>
  );

  return (
    <>
      <audio src={ringingSound} autoPlay={false} loop={true} ref={ringingRef} />
      {state != State.Closed && body}
    </>
  );
}

export default function IncomingCall() {
  const client = useNotificationClient();
  const [open, setOpen] = useState(false);
  const [call, setCall] = useState<Call>();
  const handledCalls = useRef(new Set<number>());
  const actionsRef = useRef<typeof actions>();

  const actions = {
    handleCall(newCall: Call) {
      const canAnswer =
        (newCall.status == CallStatus.Ready ||
          newCall.status == CallStatus.Active) &&
        call?.handled !== true;
      if (canAnswer) {
        setCall(newCall);
        if (handledCalls.current.has(newCall.callId)) {
          return;
        }
        handledCalls.current.add(newCall.callId);
        setOpen(true);
      } else if (
        newCall.status == CallStatus.End &&
        call?.callId === newCall.callId
      ) {
        setCall(undefined);
        setOpen(false);
      }
    },
    onCallHandled(callId: number) {
      console.log("call handled", callId);
      handledCalls.current.add(callId);
      if (call?.callId === callId) {
        setCall(undefined);
        setOpen(false);
      }
    },
  };
  actionsRef.current = actions;

  useEffect(() => {
    if (!client) {
      return;
    }
    const notficationHandler = (n: Notification) => {
      if (n.type == NotificationType.ChatMessage) {
        const m = n.payload as Message;
        if (m.call && isCallee(m.call)) {
          actionsRef.current?.handleCall(m.call);
        }
      } else if (n.type == NotificationType.CallHandled) {
        const id = n.payload as number;
        actionsRef.current?.onCallHandled(id);
      }
    };
    client.addEventListener("notification", notficationHandler);
    return () => {
      client.removeEventListener("notification", notficationHandler);
    };
  }, [client]);

  return <IncomingCallPopup open={open} onOpenChange={setOpen} call={call} />;
}
