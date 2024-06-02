import Avatar from "@/components/Avatar";
import { ContactRequest } from "@/lib/model/contact";
import { messageInstance } from "@/lib/shared/message";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import {
  acceptContactRequest,
  rejectContactRequest,
  selectContactRequests,
} from "@/lib/store/contacts";
import { fetchUser, selectUserById } from "@/lib/store/users";
import { Button, List, Modal } from "antd";
import { useEffect } from "react";

function Item(props: {
  item: ContactRequest;
  onClickAction: (type: number, item: ContactRequest) => void;
}) {
  const { item, onClickAction } = props;
  const user = useAppSelector(selectUserById(item.requestUid));
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!user) {
      dispatch(fetchUser(item.requestUid));
    }
  }, [user, dispatch, item.requestUid]);

  return (
    <div className="flex space-x-2 items-center w-full">
      <Avatar src={user?.avatar || undefined} className="bg-gray-300" />
      <span className="flex-1">{user?.nickname ?? "--"}</span>
      <Button
        type="link"
        danger
        size="small"
        onClick={() => onClickAction(2, item)}
      >
        拒绝
      </Button>
      <Button type="link" size="small" onClick={() => onClickAction(1, item)}>
        同意
      </Button>
    </div>
  );
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContactRequestsModal(props: Props) {
  const { open, onOpenChange } = props;
  const requests = useAppSelector(selectContactRequests());
  const dispatch = useAppDispatch();

  function onClickAction(type: number, item: ContactRequest) {
    const action =
      type == 1 ? acceptContactRequest(item.id) : rejectContactRequest(item.id);
    const lastRequest = requests.length == 1;
    dispatch(action)
      .then(() => {
        messageInstance().success("操作成功");
        if (lastRequest) {
          onOpenChange(false);
        }
      })
      .showError();
  }

  return (
    <>
      <Modal
        width="20rem"
        title="待处理联系人请求"
        footer={null}
        open={open}
        destroyOnClose
        onCancel={() => onOpenChange(false)}
      >
        <List
          className="max-h-80 overflow-auto"
          dataSource={requests}
          renderItem={(item) => (
            <List.Item key={item.id}>
              <Item item={item} onClickAction={onClickAction} />
            </List.Item>
          )}
        />
      </Modal>
    </>
  );
}
