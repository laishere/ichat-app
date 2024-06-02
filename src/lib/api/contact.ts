import { Contact, ContactRequest, Group } from "../model/contact";
import { User } from "../model/user";
import { get, post } from "./common";

function addContact(userId: number) {
  return post<ContactRequest>("contact/user", { userId });
}

function getContacts() {
  return get<Contact[]>("contact");
}

function getContactMembers(contactId: number) {
  return get<User[]>("contact/members", { contactId });
}

function acceptContactRequest(requestId: number) {
  return post("contact/accept", undefined, { params: { requestId } });
}

function rejectContactRequest(requestId: number) {
  return post("contact/reject", undefined, { params: { requestId } });
}

function getAllPendingRequests() {
  return get<ContactRequest[]>("contact/pending");
}

function getGroupInfos(groupIds: number[]) {
  return post<(Group | null)[]>("contact/groups", { groupIds });
}

interface CreateGroupForm {
  name: string;
  avatar: string;
  contactIds: number[];
}

function createGroup(form: CreateGroupForm) {
  return post("contact/group", form);
}

const contactApi = {
  addContact,
  getContacts,
  getContactMembers,
  acceptContactRequest,
  rejectContactRequest,
  getAllPendingRequests,
  createGroup,
  getGroupInfos,
};

export default contactApi;
