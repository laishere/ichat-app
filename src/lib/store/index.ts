import { configureStore } from "@reduxjs/toolkit";
import contacts from "./contacts";
import messages from "./messages";
import users from "./users";
import { useDispatch, useSelector, useStore } from "react-redux";
import groups from "./groups";
import settings from "./settings";

export const createStore = () =>
  configureStore({
    reducer: {
      contacts,
      messages,
      users,
      groups,
      settings,
    },
    devTools: process.env.NODE_ENV !== "production",
  });

export type AppStore = ReturnType<typeof createStore>;

export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
export const useAppStore = useStore.withTypes<AppStore>();
