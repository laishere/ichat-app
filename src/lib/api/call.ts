import { Call } from "../model/call";
import { get, post } from "./common";

function createCall(contactId: number, userIds: number[]) {
  return post<number>("call", { contactId, userIds });
}

function joinCall(callId: number) {
  return post<string>("call/join?callId=" + callId);
}

function callInfo(callId: number) {
  return get<Call>("call", { callId });
}

function hangup(callId: number) {
  return post<void>("call/hangup?callId=" + callId);
}

const callApi = {
  createCall,
  joinCall,
  callInfo,
  hangup,
};

export default callApi;
