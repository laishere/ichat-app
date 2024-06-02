import { PayloadAction, createSlice } from "@reduxjs/toolkit";
import { AppDispatch, RootState } from ".";
import contactApi from "../api/contact";
import { Group } from "../model/contact";

interface GroupsState {
  lazyLoadingQueue: number[];
  groupsMap: Record<number, Group>;
  checkMap: Record<number, boolean>;
}

const initialState: GroupsState = {
  lazyLoadingQueue: [],
  groupsMap: {},
  checkMap: {},
};

interface GroupResult {
  groupId: number;
  group: Group | null;
}

const groupsSlice = createSlice({
  name: "groups",
  initialState,
  reducers: {
    enqueue: (state, action: PayloadAction<number>) => {
      state.lazyLoadingQueue.push(action.payload);
    },
    drainQueue: (state) => {
      state.lazyLoadingQueue = [];
    },
    batchSetGroups: (state, action: PayloadAction<GroupResult[]>) => {
      action.payload.forEach((result) => {
        state.checkMap[result.groupId] = result.group != null;
        if (result.group) {
          state.groupsMap[result.groupId] = result.group;
        }
      });
    },
  },
});

const doFetchGroups = (dispatch: AppDispatch, getState: () => RootState) => {
  const q = getState().groups.lazyLoadingQueue;
  if (q.length == 0) {
    return;
  }
  console.log("fetching groups, size:", q.length);
  dispatch(drainQueue());
  contactApi
    .getGroupInfos(q)
    .then((groups) => groups.map((group, i) => ({ groupId: q[i], group })))
    .then((groups) => dispatch(batchSetGroups(groups)))
    .ignoreError();
};

export const fetchGroup =
  (groupId: number) => (dispatch: AppDispatch, getState: () => RootState) => {
    const state = getState().groups;
    if (state.checkMap[groupId]) {
      return;
    }
    if (state.lazyLoadingQueue.includes(groupId)) {
      return;
    }
    dispatch(enqueue(groupId));
    if (state.lazyLoadingQueue.length == 0) {
      setTimeout(() => {
        doFetchGroups(dispatch, getState);
      }, 500);
    }
  };

export const selectGroupById = (groupId?: number) => (state: RootState) => {
  return groupId ? state.groups.groupsMap[groupId] : undefined;
};

const { enqueue, drainQueue, batchSetGroups } = groupsSlice.actions;

export default groupsSlice.reducer;
