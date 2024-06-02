import IconLogo from "@/icons/logo";
import { NotificationState } from "@/lib/notification/client";
import { useNotificationState } from "@/lib/notification/hook";
import { useCallback, useEffect, useRef, useState } from "react";

export default function Logo() {
  const state = useNotificationState();
  const [localState, setLocalState] = useState(state);
  const updateStateTimer = useRef<NodeJS.Timeout>();

  const updateLocalState = useCallback(
    (s: NotificationState) => {
      if (updateStateTimer.current) {
        clearTimeout(updateStateTimer.current);
        updateStateTimer.current = undefined;
      }
      if (s === NotificationState.Connected) {
        if (
          localState === NotificationState.Closed ||
          localState === NotificationState.Connecting
        ) {
          /* 延迟更新，避免闪现 */
          updateStateTimer.current = setTimeout(() => {
            setLocalState(s);
          }, 500);
          return;
        }
      }
      setLocalState(s);
    },
    [localState]
  );

  useEffect(() => {
    updateLocalState(state);
  }, [state, updateLocalState]);

  const stateTitle =
    localState === NotificationState.Connecting
      ? "正在连接"
      : localState === NotificationState.Closed
      ? "连接断开"
      : undefined;

  return (
    <div className="flex items-center" title={stateTitle}>
      <IconLogo fontSize="1.2rem" />
      {stateTitle && (
        <div className="size-[0.6rem] rounded-full border-2 border-solid border-white ms-1 bg-yellow-400" />
      )}
    </div>
  );
}
