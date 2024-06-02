import "@/lib/ext/promise";
import { IgnoredError } from "@/lib/ext/promise";
import { gotoLogin } from "@/pages/login/route";
import Axios, { AxiosError, AxiosRequestConfig } from "axios";
import config from "../config";
import { getLoginToken } from "../shared/login-user";

/* 在vite中，fast refresh会多次初始化此module，但是axios不会重新初始化，如果使用默认的axios，那么interceptors会层层叠加 */
const axios = Axios.create();

axios.defaults.baseURL = config.baseURL;
axios.defaults.timeout = config.timeout;

axios.interceptors.request.use((config) => {
  const token = getLoginToken();
  if (token) {
    config.headers["Authorization"] = token;
  }
  return config;
});

function handleError(code: number, message?: string): string {
  switch (code) {
    case 401:
      return "未登录";
    case 1005:
      return "token 过期";
    default:
      return message || "请求失败";
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function handleData(data: any): any {
  if (data.code !== undefined) {
    if (data.code === 200) {
      return data.data || data;
    }
    switch (data.code) {
      case 401: // 未登录
      case 1005: // token 过期
        if (!gotoLogin()) {
          return Promise.reject(IgnoredError);
        }
        break;
    }
    return Promise.reject(handleError(data.code, data.message));
  }
  return Promise.reject(data);
}

axios.interceptors.response.use(
  (rsp) => {
    return handleData(rsp.data);
  },
  (error) => {
    if (!error.response || typeof error.response.data !== "object") {
      console.error(error);
      const code = error.response?.status || 500;
      switch (code) {
        case 413:
          return Promise.reject("文件太大");
      }
      if (error instanceof AxiosError) {
        if (error.code === "ECONNABORTED") {
          return Promise.reject("请求超时");
        }
      }
      return Promise.reject(error.message || "请求失败");
    }
    /* json错误数据处理 */
    const data = error.response.data;
    return handleData(data);
  }
);

export type ApiResponse<T> = Promise<T>;

export function get<R>(url: string, params?: unknown) {
  return axios.get<R>(url, { params }) as ApiResponse<R>;
}

export function post<R>(
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig<unknown>
) {
  return axios.post<R>(url, data, config) as ApiResponse<R>;
}

export function put<R>(url: string, data?: unknown, params?: unknown) {
  return axios.put<R>(url, data, { params }) as ApiResponse<R>;
}
