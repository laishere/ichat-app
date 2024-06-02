import { navigate } from "@/lib/shared/router";

export function openCall(callId: number) {
  return navigate(`/call/${callId}`);
}
