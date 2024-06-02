import { getLoginUserId } from "../shared/login-user";

export enum CallStatus {
  New = 1,
  Ready = 2,
  Active = 3,
  End = 4,
}

export enum CallEndReason {
  Normal = 1,
  Rejected = 2,
  NoAnswer = 3,
  Busy = 4,
  LostConnection = 5,
  Error = 6,
  Cancelled = 7,
}

export interface Call {
  callId: number;
  callerId: number;
  messageId: number;
  members: string;
  status: CallStatus;
  endReason: CallEndReason;
  startTime?: string;
  endTime?: string;
  handled?: boolean;
}

function calcDuration(call: Call) {
  if (!call.startTime || !call.endTime) {
    return "";
  }
  const start = new Date(call.startTime);
  const end = new Date(call.endTime);
  const duration = (end.getTime() - start.getTime()) / 1000;
  return ` ${Math.floor(duration / 60)
    .toString()
    .padStart(2, "0")}:${(duration % 60).toString().padStart(2, "0")}`;
}

function describeEndReason(call: Call) {
  const isCaller = getLoginUserId() === call.callerId;
  switch (call.endReason) {
    case CallEndReason.Normal:
      return `[通话时长${calcDuration(call)}]`;
    case CallEndReason.Rejected:
      return isCaller ? "[对方拒绝]" : "[通话被拒绝]";
    case CallEndReason.NoAnswer:
      return "[无人接听]";
    case CallEndReason.Busy:
      return isCaller ? "[对方忙碌]" : "[忙碌]";
    case CallEndReason.LostConnection:
      return `[通话中断${calcDuration(call)}]`;
    case CallEndReason.Error:
      return "[通话异常]";
    case CallEndReason.Cancelled:
      return "[未接通]";
  }
}

export function describeCall(call: Call) {
  switch (call.status) {
    case CallStatus.New:
    case CallStatus.Ready:
      return "[接通中]";
    case CallStatus.Active:
      return "[通话中]";
    case CallStatus.End:
      return describeEndReason(call);
  }
}

export function isCallee(call: Call) {
  const myId = getLoginUserId()!;
  if (myId === call.callerId) {
    return false;
  }
  const members = JSON.parse(call.members) as number[];
  return members.findIndex((id) => id === myId) !== -1;
}

export function isCallMember(call: Call) {
  const myId = getLoginUserId()!;
  const members = JSON.parse(call.members) as number[];
  return members.findIndex((id) => id === myId) !== -1;
}
