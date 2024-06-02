import { createContext, useContext, useEffect, useState } from "react";
import { clearAppStore } from "../store/StoreProvider";
import { useAppDispatch } from "../store";
import { fetchLoginUser } from "../store/users";
import { fetchSettings } from "../store/settings";

interface LoginUser {
  userId: number;
  token: string;
}

let loginUser: LoginUser | null = null;

function saveLoginUser(u: LoginUser) {
  loginUser = u;
  localStorage.setItem("token", u.token);
  localStorage.setItem("loginUserId", u.userId.toString());
}

export function loadLoginUser(): LoginUser | null {
  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("loginUserId");
  loginUser = null;
  if (token && userId) {
    loginUser = { token, userId: parseInt(userId) };
  }
  return loginUser;
}

export function clearLogin() {
  loginUser = null;
  localStorage.removeItem("token");
  localStorage.removeItem("loginUserId");
  setLoginUserHook(null);
  clearAppStore();
}

export function getLoginToken() {
  return loginUser?.token;
}

export function getLoginUserId() {
  return loginUser?.userId;
}

let setLoginUserHook: (u: LoginUser | null) => void = () => {};

export function setLoginUser(u: LoginUser) {
  saveLoginUser(u);
  setLoginUserHook(u);
}

const LoginUserContext = createContext<LoginUser | null>(loadLoginUser());
export function useLoginUser() {
  return useContext(LoginUserContext);
}

function LoginUserInitConsumer() {
  const dispatch = useAppDispatch();
  const loginUser = useLoginUser();

  useEffect(() => {
    if (loginUser) {
      dispatch(fetchLoginUser());
      dispatch(fetchSettings());
    }
  }, [loginUser, dispatch]);

  return null;
}

export default function LoginUserProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<LoginUser | null>(loadLoginUser());

  useEffect(() => {
    setLoginUserHook = setUser;
    return () => {
      setLoginUserHook = () => {};
    };
  }, []);

  return (
    <LoginUserContext.Provider value={user}>
      <LoginUserInitConsumer />
      {children}
    </LoginUserContext.Provider>
  );
}
