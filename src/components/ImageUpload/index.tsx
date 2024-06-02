import fileApi from "@/lib/api/file";
import {
  DeleteOutlined,
  EyeOutlined,
  LoadingOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import ImgCrop from "antd-img-crop";
import { ChangeEvent, ReactNode, useRef, useState } from "react";
import Image from "../Image";

interface Props {
  tips: string;
  circle?: boolean;
  className?: string;
  value?: string;
  crop?: boolean;
  customSize?: boolean;
  onChange?: (url?: string) => void;
}

type BeforeUploadCallback = (file: unknown, FileList: unknown[]) => unknown;

function BeforeUploadWrapper(props: {
  children: ReactNode;
  beforeUpload?: BeforeUploadCallback;
  setBeforeUpload: (beforeUpload?: BeforeUploadCallback) => void;
}) {
  const { beforeUpload, setBeforeUpload } = props;
  setBeforeUpload(beforeUpload);
  return props.children;
}

export default function ImageUpload(props: Props) {
  const {
    tips,
    circle,
    className,
    value,
    onChange,
    crop = true,
    customSize = false,
  } = props;
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const beforeUploadRef = useRef<BeforeUploadCallback>();

  function pickImage() {
    if (value) {
      return;
    }
    inputRef.current?.click();
  }

  async function onFileChange(ev: ChangeEvent<HTMLInputElement>) {
    let file = ev.target.files?.[0];
    if (!file) {
      return;
    }
    if (beforeUploadRef.current && crop) {
      const r = await beforeUploadRef.current(file, [file]);
      if (typeof r == "string") {
        return;
      }
      file = r as File;
    }
    setUploading(true);
    fileApi
      .upload(file)
      .then((url) => {
        onChange?.(url);
      })
      .showError()
      .finally(() => setUploading(false));
  }

  function deleteImage() {
    if (inputRef.current) {
      inputRef.current.value = "";
    }
    onChange?.(undefined);
  }

  const uploadBtn = (
    <div className="w-full h-full flex flex-col items-center justify-center">
      {uploading ? <LoadingOutlined /> : <PlusOutlined />}
      <div className="mt-2 text-sm text-gray-500">{tips}</div>
    </div>
  );

  const imageMask = (
    <div className="text-white flex flex-col space-y-2 px-4">
      <div className="flex space-x-1">
        <EyeOutlined />
        <span>预览</span>
      </div>
      <div
        className="flex space-x-1"
        onClick={(e) => {
          e.stopPropagation();
          deleteImage();
        }}
      >
        <DeleteOutlined />
        <span>删除</span>
      </div>
    </div>
  );

  const round = circle ? "rounded-full" : "rounded-md";

  let clz =
    `transition-all bg-slate-100 cursor-pointer 
      border-dashed border-[1px] border-blue-200 hover:border-blue-700 overflow-hidden ` +
    round +
    (className ? ` ${className}` : "");

  if (!customSize) {
    clz += " size-28";
  }

  const url = value;

  return (
    <ImgCrop quality={0.8}>
      <BeforeUploadWrapper
        setBeforeUpload={(cb) => (beforeUploadRef.current = cb)}
      >
        <div onClick={pickImage} className={clz}>
          {url ? (
            <Image
              alt=""
              src={url}
              style={{
                objectFit: "cover",
                maxWidth: "100%",
                maxHeight: "100%",
              }}
              wrapperStyle={{
                height: "100%",
                display: "flex",
                alignItems: "center",
              }}
              preview={{
                mask: imageMask,
              }}
            />
          ) : (
            uploadBtn
          )}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={onFileChange}
            style={{ display: "none" }}
          />
        </div>
      </BeforeUploadWrapper>
    </ImgCrop>
  );
}
