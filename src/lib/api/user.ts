import { User, UserSettings } from "../model/user";
import { get, post } from "./common";

function searchUsers(keyword: string, page: number = 1, size: number = 10) {
  return get("user/search", { keyword, page, size });
}

function getUserInfos(userIds: number[]) {
  return post<(User | null)[]>("user/infos", { userIds });
}

interface UserInfo {
  nickname: string;
  avatar: string;
}

function updateInfo(info: UserInfo) {
  return post("user/info", info);
}

function getSettings() {
  return get<UserSettings | null>("user/settings");
}

function updateSettings(settings: UserSettings) {
  return post("user/settings", settings);
}

const userApi = {
  searchUsers,
  getUserInfos,
  updateInfo,
  getSettings,
  updateSettings,
};

export default userApi;
