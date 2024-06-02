export interface Contact {
  contactId: number;
  ownerId: number;
  roomId: number;
  userId?: number;
  groupId?: number;
  lastMessageId: number;
  lastMessageContent?: string;
  lastMessageTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ContactInfo {
  name: string;
  avatar?: string;
}

export interface ContactRequest {
  id: number;
  requestUid: number;
  userId: number;
  status: number;
  expiredAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Group {
  groupId: number;
  ownerId: number;
  name: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}