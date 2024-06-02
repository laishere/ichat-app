import IconAdd from "@/icons/add";
import IconNotification from "@/icons/notification";
import { messageInstance } from "@/lib/shared/message";
import { NotificationState } from "@/lib/notification/client";
import { useNotificationState } from "@/lib/notification/hook";
import { useAppSelector } from "@/lib/store";
import {
  selectContactRequests,
  selectContactsState,
  selectCurrentContact,
} from "@/lib/store/contacts";
import { gotoLogin } from "@/pages/login/route";
import { Badge, Button, Popover, Spin } from "antd";
import useToken from "antd/es/theme/useToken";
import { useEffect, useState } from "react";
import AddContactModal from "./AddContactModal";
import ContactItem from "./ContactItem";
import { ContactRequestsModal } from "./ContactRequestsModal";
import CreateGroupModal from "./CreateGroupModal";
import EditInfoModal from "./EditInfoModal";
import EditWallpaperModal from "./EditWallpaperModal";
import Logo from "./Logo";

export default function Sidebar() {
  const [openAddPopover, setOpenAddPopover] = useState(false);
  const [openAddContact, setOpenAddContact] = useState(false);
  const [openContactRequests, setOpenContactRequests] = useState(false);
  const [openCreateGroup, setOpenCreateGroup] = useState(false);
  const [openEditInfo, setOpenEditInfo] = useState(false);
  const [openEditWallpaper, setOpenEditWallpaper] = useState(false);
  const contactRequests = useAppSelector(selectContactRequests());

  function onClickNotification() {
    if (contactRequests.length == 0) {
      messageInstance().info("暂无待处理联系人请求");
      return;
    }
    setOpenContactRequests(true);
  }

  function logout() {
    setOpenAddPopover(false);
    gotoLogin();
  }

  function PopoverAdd() {
    const token = useToken()[1];

    return (
      <div className="w-24 flex flex-col items-stretch">
        <Button
          type="text"
          style={{
            color: token.colorPrimary,
          }}
          onClick={() => {
            setOpenAddContact(true);
            setOpenAddPopover(false);
          }}
        >
          添加联系人
        </Button>
        <Button
          type="text"
          onClick={() => {
            setOpenCreateGroup(true);
            setOpenAddPopover(false);
          }}
        >
          创建群聊
        </Button>
        <Button
          type="text"
          onClick={() => {
            setOpenEditWallpaper(true);
            setOpenAddPopover(false);
          }}
        >
          修改壁纸
        </Button>
        <Button
          type="text"
          onClick={() => {
            setOpenEditInfo(true);
            setOpenAddPopover(false);
          }}
        >
          修改信息
        </Button>
        <Button type="text" danger onClick={logout}>
          退出登录
        </Button>
      </div>
    );
  }

  const notiIcon = (
    <Badge count={contactRequests.length} size="small">
      <IconNotification fontSize="1rem" />
    </Badge>
  );

  return (
    <>
      <div className="h-full flex flex-col overflow-hidden">
        <div className="h-16 flex items-center px-[1.5rem]">
          <Logo />
          <div className="flex flex-1 justify-end">
            <Button
              shape="circle"
              type="text"
              icon={notiIcon}
              onClick={onClickNotification}
            />
            <Popover
              trigger="click"
              placement="bottomRight"
              arrow={{ pointAtCenter: true }}
              open={openAddPopover}
              onOpenChange={(open) => setOpenAddPopover(open)}
              content={<PopoverAdd />}
            >
              <Button
                shape="circle"
                type="text"
                className="me-[-0.5rem]"
                icon={<IconAdd fontSize="1rem" />}
              />
            </Popover>
          </div>
        </div>
        <div className="overflow-y-auto overflow-x-hidden flex-1 flex-col space-y-4">
          <Contacts
            openAddContact={openAddContact}
            setOpenAddContact={setOpenAddContact}
          />
        </div>
      </div>
      <ContactRequestsModal
        open={openContactRequests}
        onOpenChange={setOpenContactRequests}
      />
      <CreateGroupModal
        open={openCreateGroup}
        onOpenChange={setOpenCreateGroup}
      />
      <EditInfoModal open={openEditInfo} onOpenChange={setOpenEditInfo} />
      <EditWallpaperModal
        open={openEditWallpaper}
        onOpenChange={setOpenEditWallpaper}
      />
    </>
  );
}

function Contacts(params: {
  openAddContact: boolean;
  setOpenAddContact: (o: boolean) => void;
}) {
  const { openAddContact, setOpenAddContact } = params;
  const { loading, contacts } = useAppSelector(selectContactsState());
  const currentContact = useAppSelector(selectCurrentContact());
  const [_, setTick] = useState(0);
  const notificationState = useNotificationState();

  useEffect(() => {
    const id = setInterval(() => {
      setTick((v) => v + 1);
    }, 3000);
    return () => clearInterval(id);
  }, []);

  if (loading && contacts.length == 0) {
    return (
      <div className="flex h-full justify-center items-center mt-[-2rem]">
        <Spin />
      </div>
    );
  }

  if (
    contacts.length == 0 &&
    notificationState !== NotificationState.Connected
  ) {
    return null;
  }

  return (
    <>
      {contacts.length == 0 ? (
        <div className="flex h-full justify-center items-center mt-[-2rem]">
          <Button type="primary" onClick={() => setOpenAddContact(true)}>
            添加联系人
          </Button>
        </div>
      ) : (
        <div className="overflow-y-auto overflow-x-hidden flex-1 flex-col space-y-4">
          {contacts.map((item) => (
            <ContactItem
              key={item.contactId}
              active={item.contactId == currentContact?.contactId}
              item={item}
            />
          ))}
          <div />
        </div>
      )}
      <AddContactModal
        open={openAddContact}
        onCancel={() => setOpenAddContact(false)}
      />
    </>
  );
}
