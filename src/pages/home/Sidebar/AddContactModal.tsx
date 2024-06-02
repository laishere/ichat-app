import Avatar from "@/components/Avatar";
import contactApi from "@/lib/api/contact";
import userApi from "@/lib/api/user";
import { ContactRequest } from "@/lib/model/contact";
import { getLoginUserId } from "@/lib/shared/login-user";
import { messageInstance } from "@/lib/shared/message";
import { useAppDispatch } from "@/lib/store";
import { acceptContactRequest } from "@/lib/store/contacts";
import {
  Button,
  Input,
  InputRef,
  List,
  Modal,
  ModalProps,
  Skeleton,
} from "antd";
import { useEffect, useRef, useState } from "react";

interface UserItemData {
  userId: number;
  name: string;
  avatar: string;
  isFriend: boolean;
  pendingRequest?: ContactRequest;
  loading?: boolean;
}

interface UserItemProps {
  item: UserItemData;
  onUpdate?: (item: UserItemData) => void;
}

function UserItem(props: UserItemProps) {
  const item = props.item;
  const dispatch = useAppDispatch();

  function accept() {
    props.onUpdate?.({ ...item, loading: true });
    let success = false;
    dispatch(acceptContactRequest(item.pendingRequest!.id))
      .then(() => {
        success = true;
      })
      .showError()
      .finally(() => {
        const newItem = { ...item, loading: false };
        if (success) {
          newItem.isFriend = true;
          newItem.pendingRequest = undefined;
        }
        props.onUpdate?.(newItem);
      });
  }

  function add() {
    if (item.pendingRequest) {
      accept();
      return;
    }
    props.onUpdate?.({ ...item, loading: true });
    let pendingRequest: ContactRequest | undefined;
    contactApi
      .addContact(item.userId)
      .then((req) => {
        pendingRequest = req;
        messageInstance().success("已发送请求");
      })
      .showError()
      .finally(() => {
        props.onUpdate?.({ ...item, pendingRequest, loading: false });
      });
  }

  const pending =
    item.pendingRequest && item.pendingRequest.requestUid == getLoginUserId();

  return (
    <div className="w-full flex items-center justify-between px-[1rem]">
      <div className="flex items-center">
        <Avatar src={item.avatar} alt="" className="size-[2rem]" />
        <span className="ml-2">{item.name}</span>
      </div>
      {item.isFriend || pending ? (
        <Button type="text" disabled size="small">
          {pending ? "待同意" : "已添加"}
        </Button>
      ) : (
        <Button
          type="primary"
          size="small"
          loading={item.loading}
          onClick={add}
        >
          {item.pendingRequest ? "同意" : "添加"}
        </Button>
      )}
    </div>
  );
}

export default function AddContactModal(props: ModalProps) {
  const [list, setList] = useState<UserItemData[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setMore] = useState(false);
  const [firstSearch, setFirstSearch] = useState(true);
  const [keyword, setKeyword] = useState("");
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<InputRef>(null);
  const loadMoreRef = useRef(loadMore);

  function updateItem(item: UserItemData) {
    setList((list) =>
      list.map((i) => (i.userId == item.userId ? { ...i, ...item } : i))
    );
  }

  function loadMore() {
    setLoading(true);
    const pageSize = 5;
    userApi
      .searchUsers(keyword, Math.floor(list.length / pageSize) + 1, pageSize)
      .then((data: any) => {
        const items = data.map((item: any) => ({
          userId: item.userId,
          name: item.nickname,
          avatar: item.avatar,
          isFriend: item.isFriend,
          pendingRequest: item.pendingRequest,
        }));
        setList([...list, ...items]);
        setMore(data.length >= 5);
      })
      .showError()
      .finally(() => setLoading(false));
  }
  loadMoreRef.current = loadMore;

  function search(kw: string) {
    if (kw == keyword) {
      return;
    }
    if (firstSearch) {
      setFirstSearch(false);
    }
    setKeyword(kw);
    setMore(false);
    setList([]);
  }

  useEffect(() => {
    if (props.open) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    } else {
      setInputValue("");
      setKeyword("");
      setList([]);
      setLoading(false);
      setMore(false);
      setFirstSearch(true);
    }
  }, [props.open]);

  useEffect(() => {
    if (keyword != "") {
      loadMoreRef.current();
    }
  }, [keyword]);

  function Result() {
    return (
      <List
        loading={list.length == 0 && loading}
        loadMore={
          hasMore ? (
            <div className="mx-auto w-fit mt-2">
              <Button
                type="default"
                onClick={() => loadMore()}
                loading={hasMore && loading}
              >
                加载更多
              </Button>
            </div>
          ) : null
        }
        dataSource={list}
        renderItem={(item: UserItemData, index: number) => (
          <List.Item key={index}>
            <UserItem item={item} onUpdate={updateItem} />
          </List.Item>
        )}
      />
    );
  }

  return (
    <Modal
      {...props}
      title="添加联系人"
      width="20rem"
      footer={null}
      destroyOnClose
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
    >
      <div className="flex flex-col overflow-hidden h-[23rem]">
        <Input.Search
          ref={inputRef}
          placeholder="请输入用户名"
          enterButton
          allowClear
          onSearch={search}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="px-[1rem]"
        />
        {firstSearch ? (
          <Skeleton className="px-[1rem]" />
        ) : (
          <div className="flex-1 overflow-auto">
            <Result />
          </div>
        )}
      </div>
    </Modal>
  );
}
