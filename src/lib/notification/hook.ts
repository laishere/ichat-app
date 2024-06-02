import { useEffect, useState } from "react";
import { useNotificationClient } from ".";
import { NotificationState } from "./client";

export function useNotificationState() {
  const client = useNotificationClient();
  const [state, setState] = useState(client?.state ?? NotificationState.Closed);
  useEffect(() => {
    if (!client) return;
    const stateHandler = (s: NotificationState) => {
      setState(s);
    };
    client.addEventListener("state", stateHandler);
    return () => {
      client.removeEventListener("state", stateHandler);
    };
  }, [client]);
  return state;
}
