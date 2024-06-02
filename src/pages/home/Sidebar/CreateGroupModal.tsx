import Avatar from "@/components/Avatar";
import ImageUpload from "@/components/ImageUpload";
import contactApi from "@/lib/api/contact";
import { Contact } from "@/lib/model/contact";
import { messageInstance } from "@/lib/shared/message";
import { useAppSelector } from "@/lib/store";
import { selectContactInfo, selectUserContacts } from "@/lib/store/contacts";
import { Button, Checkbox, Input, List, Modal } from "antd";
import { useEffect, useState } from "react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SelectableContact extends Contact {
  selected: boolean;
}

function ContactInfo(props: { item: Contact }) {
  const { item } = props;
  const info = useAppSelector(selectContactInfo(item));
  return (
    <>
      <Avatar src={info.avatar} />
      <span className="flex-1">{info.name}</span>
    </>
  );
}

export default function CreateGroupModal(props: Props) {
  const { open, onOpenChange } = props;
  const [step, setStep] = useState(1);
  const [avatar, setAvatar] = useState<string>();
  const [groupName, setGroupName] = useState("");
  const contacts = useAppSelector(selectUserContacts);
  const [contactList, setContactList] = useState<SelectableContact[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setContactList(() => contacts.map((c) => ({ ...c, selected: false })));
  }, [contacts]);

  function toggleContact(id: number) {
    setContactList((list) =>
      list.map((c) => {
        if (c.contactId == id) {
          return { ...c, selected: !c.selected };
        }
        return c;
      })
    );
  }

  function stepTwo() {
    if (!avatar) {
      messageInstance().warning("请上传群聊头像");
      return;
    }
    if (groupName.length == 0) {
      messageInstance().warning("请输入群聊名称");
      return;
    }
    setStep(2);
  }

  function submit() {
    const selected = contactList
      .filter((c) => c.selected)
      .map((c) => c.contactId);
    if (selected.length == 0) {
      messageInstance().warning("请选择联系人");
      return;
    }
    const form = {
      name: groupName,
      avatar: avatar!,
      contactIds: selected,
    };
    setLoading(true);
    contactApi
      .createGroup(form)
      .then(() => {
        messageInstance().success("创建成功");
        onOpenChange(false);
      })
      .showError()
      .finally(() => setLoading(false));
  }

  const groupInfo = (
    <div className="flex flex-col items-center space-y-4">
      <ImageUpload tips="上传头像" circle value={avatar} onChange={setAvatar} />
      <Input
        placeholder="请输入群聊名称"
        className="w-2/3"
        value={groupName}
        onChange={(ev) => setGroupName(ev.target.value.trim())}
      />
      <Button type="primary" onClick={stepTwo}>
        选择联系人
      </Button>
    </div>
  );

  const selectUser = (
    <div className="flex flex-col items-center space-y-4">
      <List
        className="max-h-80 overflow-auto w-full"
        dataSource={contactList}
        renderItem={(item) => (
          <List.Item key={item.contactId}>
            <div className="flex items-center space-x-2 w-full">
              <ContactInfo item={item} />
              <Checkbox
                checked={item.selected}
                onChange={() => toggleContact(item.contactId)}
              />
            </div>
          </List.Item>
        )}
      />
      <Button type="primary" loading={loading} onClick={submit}>
        创建群组
      </Button>
      <Button type="text" onClick={() => setStep(1)}>
        编辑信息
      </Button>
    </div>
  );

  return (
    <Modal
      title="创建群聊"
      width="20rem"
      open={open}
      footer={null}
      destroyOnClose
      onCancel={() => onOpenChange(false)}
    >
      {step == 1 ? groupInfo : selectUser}
    </Modal>
  );
}
