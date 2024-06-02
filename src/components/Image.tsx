import { appImageUrl } from "@/lib/config";
import {
  DownloadOutlined,
  SwapOutlined,
  RotateLeftOutlined,
  RotateRightOutlined,
  ZoomOutOutlined,
  ZoomInOutlined,
} from "@ant-design/icons";
import { ImageProps, Space, Image as _Image } from "antd";

interface Props extends ImageProps {
  download?: boolean | string;
}

export default function Image(props: Props) {
  let src = props?.src;
  if (src && typeof src == "string") {
    src = appImageUrl(src);
  }

  const onDownload = () => {
    fetch(src!)
      .then((response) => response.blob())
      .then((blob) => {
        const url = URL.createObjectURL(new Blob([blob]));
        const link = document.createElement("a");
        link.href = url;
        link.download =
          (typeof props.download == "string" ? props.download : undefined) ||
          "image.png";
        document.body.appendChild(link);
        link.click();
        URL.revokeObjectURL(url);
        link.remove();
      });
  };

  const preview: ImageProps["preview"] = props.download
    ? {
        toolbarRender: (
          _,
          {
            transform: { scale },
            actions: {
              onFlipY,
              onFlipX,
              onRotateLeft,
              onRotateRight,
              onZoomOut,
              onZoomIn,
            },
          }
        ) => (
          <Space size={12} className="toolbar-wrapper">
            <DownloadOutlined onClick={onDownload} />
            <SwapOutlined rotate={90} onClick={onFlipY} />
            <SwapOutlined onClick={onFlipX} />
            <RotateLeftOutlined onClick={onRotateLeft} />
            <RotateRightOutlined onClick={onRotateRight} />
            <ZoomOutOutlined disabled={scale === 1} onClick={onZoomOut} />
            <ZoomInOutlined disabled={scale === 50} onClick={onZoomIn} />
          </Space>
        ),
      }
    : props.preview;

  return <_Image {...props} preview={preview} src={src || undefined} />;
}
