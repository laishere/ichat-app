import fileApi from "../api/file";

export type ImageID = string;

const imageStore: Record<ImageID, File> = {};

export function putImage(file: File) {
  const id = URL.createObjectURL(file);
  imageStore[id] = file;
  return id;
}

export function releaseImage(id: ImageID) {
  URL.revokeObjectURL(id);
  delete imageStore[id];
}

export function imageFile(id: ImageID) {
  return imageStore[id];
}

function imageUrl(id: ImageID) {
  return id;
}

/**
 *  创建缩略图，返回格式：WxH;base64
 */
export function createThumbnail(id: ImageID) {
  const maxSize = 64;
  return new Promise<string>((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      const { width, height } = image;
      const scale = Math.min(maxSize / width, maxSize / height);
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d")!;
      canvas.width = width * scale;
      canvas.height = height * scale;
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const base64 = canvas.toDataURL("image/jpeg", 0.8);
      resolve(`${width}x${height};${base64}`);
    };
    image.onerror = reject;
    image.src = imageUrl(id);
  });
}

export function extractThumbnail(thumbnail?: string) {
  if (!thumbnail) {
    return undefined;
  }
  const i = thumbnail.indexOf(";");
  if (i == -1) {
    return undefined;
  }
  const size = thumbnail.substring(0, i).split("x").map(Number);
  return {
    size,
    base64: thumbnail.substring(i + 1),
  };
}

export function uploadImage(id: ImageID) {
  const file = imageStore[id];
  if (!file) {
    return Promise.reject("file not found");
  }
  return fileApi.upload(file);
}
