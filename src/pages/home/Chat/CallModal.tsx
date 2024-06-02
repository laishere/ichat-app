import Avatar from "@/components/Avatar";
import callApi from "@/lib/api/call";
import contactApi from "@/lib/api/contact";
import { VideoSource } from "@/lib/call/types";
import { Contact } from "@/lib/model/contact";
import { User } from "@/lib/model/user";
import { messageInstance } from "@/lib/shared/message";
import { openCall } from "@/pages/call/route";
import { initCallMediaConfig } from "@/pages/call/config";
import { Button, Checkbox, List, Modal, Switch } from "antd";
import { useEffect, useRef, useState } from "react";

interface SelectableUser extends User {
  selected: boolean;
}

function UserItem(props: {
  user: SelectableUser;
  onSelectChange: (selected: boolean) => void;
}) {
  const { user } = props;
  return (
    <div className="w-full flex space-x-2 items-center px-4">
      <Avatar src={user.avatar || undefined} className="bg-gray-200" />
      <div className="flex-1">{user.nickname}</div>
      <Checkbox
        checked={user.selected}
        onChange={(e) => props.onSelectChange(e.target.checked)}
      />
    </div>
  );
}

interface CallProps {
  contact: Contact;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function CallModal(props: CallProps) {
  const contact = props.contact;
  const [userList, setUserList] = useState<SelectableUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(false);
  const [microphoneEnabled, setMicrophoneEnabled] = useState(false);
  const loadUsersRef = useRef(loadUsers);

  function loadUsers() {
    if (!contact.groupId) {
      return;
    }
    setLoadingUsers(true);
    contactApi
      .getContactMembers(contact.contactId)
      .then((users) => users.filter((u) => u.userId !== contact.ownerId))
      .then((users) => {
        setUserList(() => users.map((u) => ({ ...u, selected: false })));
      })
      .showError()
      .finally(() => setLoadingUsers(false));
  }
  loadUsersRef.current = loadUsers;

  useEffect(() => {
    if (props.open) {
      setUserList([]);
      loadUsersRef.current();
    }
  }, [props.open, contact]);

  function setSelected(index: number, selected: boolean) {
    setUserList(userList.map((u, i) => (i === index ? { ...u, selected } : u)));
  }

  function makeCall() {
    let userIds = [];
    if (contact.userId) {
      userIds = [contact.userId];
    } else {
      userIds = userList.filter((u) => u.selected).map((u) => u.userId);
    }
    if (userIds.length == 0) {
      messageInstance().error("通话对象不能为空");
      return;
    }
    setLoading(true);
    callApi
      .createCall(contact.contactId, userIds)
      .then((callId) => {
        props.onOpenChange(false);
        setTimeout(() => {
          initCallMediaConfig({
            video: cameraEnabled ? VideoSource.Camera : VideoSource.None,
            audio: microphoneEnabled,
          });
          openCall(callId);
        }, 500);
      })
      .showError()
      .finally(() => setLoading(false));
  }

  const list = contact.groupId ? (
    <List loading={loadingUsers} className="max-h-40 overflow-auto mb-8" split>
      {userList.map((item, index) => (
        <List.Item key={index}>
          <UserItem user={item} onSelectChange={(s) => setSelected(index, s)} />
        </List.Item>
      ))}
    </List>
  ) : null;

  const footer = (
    <div className="flex justify-center">
      <Button type="primary" onClick={makeCall} loading={loading}>
        开始通话
      </Button>
    </div>
  );

  return (
    <Modal
      title="创建通话"
      width="20rem"
      centered
      destroyOnClose
      footer={footer}
      styles={{
        content: {
          paddingLeft: 0,
          paddingRight: 0,
        },
        header: {
          paddingLeft: "1rem",
          paddingRight: "1rem",
        },
      }}
      open={props.open}
      onCancel={() => props.onOpenChange(false)}
    >
      <div className="py-4">
        {list}
        <div className="flex justify-center items-center space-x-4">
          <div className="flex space-x-2 items-center">
            <span>摄像头</span>
            <Switch checked={cameraEnabled} onChange={setCameraEnabled} />
          </div>
          <div className="flex space-x-2 items-center">
            <span>麦克风</span>
            <Switch
              checked={microphoneEnabled}
              onChange={setMicrophoneEnabled}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}
