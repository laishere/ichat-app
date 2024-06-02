import { post } from "./common";

function upload(file: File) {
  const formData = new FormData();
  const timeoutFactor = 15000 / (1024 * 1024 * 1);
  formData.append("file", file);
  return post<string>("file/upload", formData, {
    timeout: Math.max(10000, Math.round(file.size * timeoutFactor)),
  });
}

const fileApi = {
  upload,
};

export default fileApi;
