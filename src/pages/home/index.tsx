import { useLoginUser } from "@/lib/shared/login-user";
import { messageInstance } from "@/lib/shared/message";
import { useAppSelector } from "@/lib/store";
import { selectCurrentContact } from "@/lib/store/contacts";
import { useEffect } from "react";
import { gotoLogin } from "../login/route";
import { Background } from "./Background";
import { BlurBox } from "./BlurBox";
import Chat from "./Chat";
import IncomingCall from "./IncomingCall";
import Sidebar from "./Sidebar";

export default function Home() {
  const loginUser = useLoginUser();

  useEffect(() => {
    document.title = "iChat";
  }, []);

  useEffect(() => {
    if (!loginUser && gotoLogin()) {
      messageInstance().error("未登录");
    }
  }, [loginUser]);

  const currentContact = useAppSelector(selectCurrentContact());

  return (
    <>
      <Background>
        <BlurBox>
          <div
            className="flex h-full"
            style={{
              background:
                "linear-gradient(180deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0) 50%)",
            }}
          >
            <div className="w-72">
              <Sidebar />
            </div>
            <div
              className="flex-1"
              style={{ background: "rgba(255, 255, 255, 0.3)" }}
            >
              {currentContact && <Chat />}
            </div>
          </div>
        </BlurBox>
      </Background>
      <IncomingCall />
    </>
  );
}
