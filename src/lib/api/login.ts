import { post } from "./common";

interface LoginResult {
  userId: number; token: string;
}

function login(username: string, password: string) {
  return post<LoginResult>("login", {
    username,
    password,
  });
}

interface RegisterForm {
  username: string;
  nickname: string;
  password: string;
  avatar: string;
}

function registerAndLogin(form: RegisterForm) {
  return post<LoginResult>("register", form);
}

const loginApi = {
  login,
  registerAndLogin
};

export default loginApi;
