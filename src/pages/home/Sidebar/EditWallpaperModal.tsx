import ImageUpload from "@/components/ImageUpload";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { selectSettings, updateSettings } from "@/lib/store/settings";
import { Button, Modal } from "antd";
import { useEffect, useRef, useState } from "react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function Body(props: Props) {
  const { onOpenChange } = props;
  const settings = useAppSelector(selectSettings());
  const [wallpaper, setWallpaper] = useState(settings.wallpaper);
  const dispatch = useAppDispatch();

  function save() {
    // 可以为空
    dispatch(updateSettings({ wallpaper }, true))
      .then(() => {
        onOpenChange(false);
      })
      .showError();
  }

  function onChange(v?: string) {
    const val = v || "";
    setWallpaper(val);
    dispatch(updateSettings({ wallpaper: val }, false));
  }

  return (
    <div className="flex flex-col items-center space-y-4">
      <ImageUpload
        className="w-full aspect-video"
        tips="上传新壁纸"
        value={wallpaper}
        onChange={onChange}
        crop={false}
        customSize
      />
      <Button type="primary" className="w-36" onClick={save}>
        保存修改
      </Button>
    </div>
  );
}

export default function EditWallpaperModal(props: Props) {
  const { open, onOpenChange } = props;
  const settings = useAppSelector(selectSettings());
  const oldWallpaperRef = useRef<string>();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (open && oldWallpaperRef.current === undefined) {
      oldWallpaperRef.current = settings.wallpaper;
    }
  }, [open, settings]);

  function discard() {
    onOpenChange(false);
    if (oldWallpaperRef.current !== undefined) {
      dispatch(updateSettings({ wallpaper: oldWallpaperRef.current }, false));
    }
  }

  function reset() {
    oldWallpaperRef.current = undefined;
  }

  return (
    <Modal
      title="修改壁纸"
      width="20rem"
      open={open}
      footer={null}
      destroyOnClose
      onCancel={discard}
      afterClose={reset}
    >
      <Body {...props} />
    </Modal>
  );
}
