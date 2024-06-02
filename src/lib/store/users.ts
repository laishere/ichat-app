import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { User } from "../model/user";
import { AppDispatch, RootState } from ".";
import userApi from "../api/user";
import { getLoginUserId } from "../shared/login-user";

interface UsersState {
  lazyLoadingQueue: number[];
  usersMap: Record<number, User>;
  checkMap: Record<number, boolean>;
}

const initialState: UsersState = {
  lazyLoadingQueue: [],
  usersMap: {},
  checkMap: {},
};

interface UserResult {
  userId: number;
  user: User | null;
}

const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    enqueue: (state, action: PayloadAction<number>) => {
      state.lazyLoadingQueue.push(action.payload);
    },
    drainQueue: (state) => {
      state.lazyLoadingQueue = [];
    },
    batchSetUsers: (state, action: PayloadAction<UserResult[]>) => {
      action.payload.forEach((result) => {
        state.checkMap[result.userId] = result.user != null;
        if (result.user) {
          state.usersMap[result.userId] = result.user;
        }
      });
    },
  },
});

const doFetchUsers = async (
  dispatch: AppDispatch,
  getState: () => RootState
) => {
  const q = getState().users.lazyLoadingQueue;
  if (q.length == 0) {
    return;
  }
  console.log("fetching users, size:", q.length);

  dispatch(drainQueue());
  userApi
    .getUserInfos(q)
    .then((users) => users.map((user, i) => ({ userId: q[i], user })))
    .then((users) => dispatch(batchSetUsers(users)))
    .ignoreError();
};

export const fetchUser =
  (userId: number, force = false) =>
  (dispatch: AppDispatch, getState: () => RootState) => {
    const state = getState();
    if (!force && state.users.checkMap[userId]) {
      return;
    }
    if (state.users.lazyLoadingQueue.includes(userId)) {
      return;
    }
    dispatch(enqueue(userId));
    if (state.users.lazyLoadingQueue.length == 0) {
      setTimeout(() => {
        doFetchUsers(dispatch, getState);
      }, 500);
    }
  };

export const fetchLoginUser = (force: boolean = false) =>
  fetchUser(getLoginUserId()!, force);

export const selectUserById = (userId?: number) => (state: RootState) =>
  userId ? state.users.usersMap[userId] : undefined;

const { drainQueue, enqueue, batchSetUsers } = usersSlice.actions;

export default usersSlice.reducer;
