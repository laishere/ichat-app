import { appImageUrl } from "@/lib/config";
import { Avatar as _Avatar } from "antd";

type Props = typeof _Avatar.defaultProps;

export default function Avatar(props: Props) {
  let src = props?.src;
  if (src && typeof src == "string") {
    src = appImageUrl(src);
  }
  return <_Avatar {...props} src={src || undefined} />;
}
