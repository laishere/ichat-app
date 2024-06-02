import { message } from "antd";
import { MessageInstance } from "antd/es/message/interface";

let _instance: MessageInstance;

export function messageInstance(): MessageInstance {
  return _instance;
}

export default function SharedMessageHolder() {
  const [instance, contextHolder] = message.useMessage();
  _instance = instance;
  return contextHolder;
}
