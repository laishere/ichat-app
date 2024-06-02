import { AppDispatch } from "../store";
import { fetchAllPendingContactRequests, fetchContacts } from "../store/contacts";
import { syncMissingMessages } from "../store/messages";

class SyncClient {
  private notificationSessionId = "";
  private lastDeliveryId = -1;

  dispatch: AppDispatch | null = null;

  onMessageInbox(deliveryId: number) {
    this.lastDeliveryId = deliveryId;
  }

  onNotificationSessionStart(id: string, lastDeliveryId?: number) {
    if (this.notificationSessionId === id) {
      console.log("session reused:", id);
      return;
    }
    if (this.lastDeliveryId == -1 && lastDeliveryId !== undefined) {
      this.lastDeliveryId = lastDeliveryId;
    }
    this.notificationSessionId = id;
    this.loadContacts();
    this.loadContactRequests();
    this.loadMessages();
  }

  private loadContacts() {
    this.dispatch!(fetchContacts());
  }

  private loadContactRequests() {
    this.dispatch!(fetchAllPendingContactRequests());
  }

  private loadMessages() {
    if (this.lastDeliveryId === -1) {
      return;
    }
    this.dispatch!(syncMissingMessages(this.lastDeliveryId)).catch((e) => {
      console.error("sync missing messages failed", e);
      // todo: 失败后的操作
    });
  }
}

export {
  SyncClient
}