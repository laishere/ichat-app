import { MediaConfig } from "@/lib/call/types";

let initMediaConfig: MediaConfig | null = null;

export function initCallMediaConfig(mediaConfig: MediaConfig) {
  initMediaConfig = mediaConfig;
}

export function getInitCallMediaConfig() {
  return initMediaConfig;
}
