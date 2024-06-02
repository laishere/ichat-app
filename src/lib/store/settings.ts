import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { AppDispatch, RootState } from ".";
import userApi from "../api/user";
import { UserSettings } from "../model/user";
import { getLoginUserId } from "../shared/login-user";

interface SettingsState {
  wallpaper: string;
  loading: boolean;
}

const initialState: SettingsState = {
  wallpaper: "",
  loading: false,
};

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    setSettings(state, action: PayloadAction<UserSettings>) {
      const settings = action.payload;
      state.wallpaper = settings.wallpaper || "";
    },
    updateLoading(state, action: PayloadAction<boolean>) {
      state.loading = action.payload;
    },
  },
});

const settingsKey = () => "settings:" + getLoginUserId();

const saveSettings = (settings: UserSettings | null) => {
  const key = settingsKey();
  if (settings) {
    localStorage.setItem(key, JSON.stringify(settings));
  } else {
    localStorage.removeItem(key);
  }
};

const loadSettings = (): UserSettings => {
  const json = localStorage.getItem(settingsKey());
  if (json) {
    return JSON.parse(json);
  }
  return {
    wallpaper: "",
  };
};

export const fetchSettings =
  () => async (dispatch: AppDispatch, getState: () => RootState) => {
    const state = getState().settings;
    if (state.loading) {
      return;
    }
    dispatch(updateLoading(true));
    dispatch(setSettings(loadSettings()));
    return userApi
      .getSettings()
      .then((s) => {
        saveSettings(s);
        if (s) {
          dispatch(setSettings(s));
        }
      })
      .ignoreError()
      .finally(() => {
        dispatch(updateLoading(false));
      });
  };

export const updateSettings =
  (settings: UserSettings, save: boolean) => async (dispatch: AppDispatch) => {
    dispatch(setSettings(settings));
    if (save) {
      await userApi.updateSettings(settings).then(() => {
        saveSettings(settings);
      });
    }
  };

export const selectSettings = () => (state: RootState) => state.settings;

const { updateLoading, setSettings } = settingsSlice.actions;

export default settingsSlice.reducer;
