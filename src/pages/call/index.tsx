import { useLoaderData } from "react-router-dom";
import CallView from "./call";
import { useEffect } from "react";

export default function CallPage() {
  const callId = useLoaderData() as number;

  useEffect(() => {
    document.title = "iChat - 通话";
  }, []);

  return <CallView callId={callId} />;
}
