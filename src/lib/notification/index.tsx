import { useLoginUser } from "@/lib/shared/login-user";
import { ReactNode, createContext, useContext, useEffect, useRef } from "react";
import { NotificationClient } from "./client";
import { DefaultConsumer, SyncConsumer } from "./consumers";

const ClientContext = createContext<NotificationClient | null>(null);

export function useNotificationClient() {
  return useContext(ClientContext);
}

export default function NotificationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const clientRef = useRef(new NotificationClient());
  const loginUser = useLoginUser();

  useEffect(() => {
    const client = clientRef.current;
    if (loginUser) {
      client.connect();
    }
    return () => {
      client.close();
    };
  }, [loginUser]);

  return (
    <ClientContext.Provider value={clientRef.current}>
      <DefaultConsumer />
      <SyncConsumer />
      {children}
    </ClientContext.Provider>
  );
}
