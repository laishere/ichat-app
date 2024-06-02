import { createSelector, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { AppDispatch, RootState } from ".";
import contactApi from "../api/contact";
import { describeMessage, Message } from "../model/chat";
import { Contact, ContactInfo, ContactRequest } from "../model/contact";
import { fetchGroup, selectGroupById } from "./groups";
import { fetchUser, selectUserById } from "./users";

interface ContactsState {
  contacts: Contact[];
  currentContact: Contact | undefined;
  loading: boolean;
  pendingRequests: ContactRequest[];
}

const initialState: ContactsState = {
  contacts: [],
  currentContact: undefined,
  loading: false,
  pendingRequests: [],
};

async function _fetchContacts() {
  const r = await contactApi.getContacts();
  return r.map((c: Contact) => ({
    ...c,
    lastMessageTime: c.lastMessageTime && new Date(c.lastMessageTime).toJSON(),
  }));
}

function fetchContactInfo(dispatch: AppDispatch, c: Contact) {
  if (c.userId) {
    dispatch(fetchUser(c.userId));
  } else {
    dispatch(fetchGroup(c.groupId!));
  }
}

export const fetchContacts =
  () => async (dispatch: AppDispatch, getState: () => RootState) => {
    if (getState().contacts.loading) return;
    dispatch(setLoading(true));
    await _fetchContacts()
      .then((contacts) => {
        contacts.forEach((c) => {
          fetchContactInfo(dispatch, c);
        });
        dispatch(setContacts(contacts));
      })
      .showError()
      .finally(() => {
        dispatch(setLoading(false));
      });
  };

export const fetchAllPendingContactRequests =
  () => async (dispatch: AppDispatch) => {
    await contactApi
      .getAllPendingRequests()
      .then((requests) => {
        dispatch(setContactRequests(requests.toReversed()));
      })
      .ignoreError();
  };

export const acceptContactRequest =
  (requestId: number) => async (dispatch: AppDispatch) => {
    await contactApi.acceptContactRequest(requestId).then(() => {
      dispatch(removeContactRequest(requestId));
    });
  };

export const rejectContactRequest =
  (requestId: number) => async (dispatch: AppDispatch) => {
    await contactApi.rejectContactRequest(requestId).then(() => {
      dispatch(removeContactRequest(requestId));
    });
  };

function contactTime(c: Contact): Date {
  if (c.lastMessageTime) {
    return new Date(c.lastMessageTime);
  }
  return new Date(c.updatedAt);
}

export const addNewContact = (c: Contact) => (dispatch: AppDispatch) => {
  dispatch(insertNewContact(c));
  fetchContactInfo(dispatch, c);
};

const contactsSlice = createSlice({
  name: "contacts",
  initialState,
  reducers: {
    setContacts: (state, action: PayloadAction<Contact[]>) => {
      state.contacts = action.payload.toSorted((a, b) => {
        return contactTime(b).getTime() - contactTime(a).getTime();
      });
      if (state.contacts.length === 0) {
        state.currentContact = undefined;
      } else {
        if (!state.currentContact) {
          state.currentContact = state.contacts[0];
        } else {
          state.currentContact = state.contacts.find(
            (v) => v.contactId == state.currentContact?.contactId
          );
        }
      }
    },
    setCurrentContactById: (state, action: PayloadAction<number>) => {
      state.currentContact = state.contacts.find(
        (v) => v.contactId == action.payload
      );
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    updateLastMessage: (state, action: PayloadAction<Message>) => {
      const roomId = action.payload.roomId;
      const i = state.contacts.findIndex((v) => v.roomId === roomId);
      if (i != -1) {
        const contact = state.contacts[i];
        contact.lastMessageTime = action.payload.createdAt;
        contact.lastMessageContent = describeMessage(action.payload, true);
        if (i != 0) {
          const firstContact = state.contacts[0];
          if (
            contactTime(contact).getTime() > contactTime(firstContact).getTime()
          ) {
            state.contacts.splice(i, 1);
            state.contacts.unshift(contact);
          }
        }
      }
    },
    setContactRequests(state, action: PayloadAction<ContactRequest[]>) {
      state.pendingRequests = action.payload;
    },
    removeContactRequest(state, action: PayloadAction<number>) {
      state.pendingRequests = state.pendingRequests.filter(
        (v) => v.id !== action.payload
      );
    },
    insertNewContact(state, action: PayloadAction<Contact>) {
      state.contacts.unshift(action.payload);
    },
    insertNewContactRequest(state, action: PayloadAction<ContactRequest>) {
      state.pendingRequests.unshift(action.payload);
    },
  },
});

export const selectContactsState = () => (state: RootState) => state.contacts;

export const selectCurrentContact = () => (state: RootState) =>
  state.contacts.currentContact;

export const selectContactRequests = () => (state: RootState) =>
  state.contacts.pendingRequests;

export const selectUserContacts = createSelector(
  [selectContactsState()],
  (state) => {
    return state.contacts.filter((c) => c.userId);
  }
);

export const selectContactInfo = (contact: Contact) =>
  createSelector(
    [selectUserById(contact.userId), selectGroupById(contact.groupId)],
    (user, group): ContactInfo => {
      return user
        ? {
            name: user.nickname,
            avatar: user.avatar,
          }
        : {
            name: group?.name || "",
            avatar: group?.avatar || "",
          };
    }
  );

const {
  setContacts,
  setLoading,
  setContactRequests,
  removeContactRequest,
  insertNewContact,
} = contactsSlice.actions;

export const {
  setCurrentContactById,
  updateLastMessage,
  insertNewContactRequest,
} = contactsSlice.actions;

export default contactsSlice.reducer;
