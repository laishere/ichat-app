import ImageUpload from "@/components/ImageUpload";
import userApi from "@/lib/api/user";
import { getLoginUserId } from "@/lib/shared/login-user";
import { messageInstance } from "@/lib/shared/message";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import { fetchLoginUser, selectUserById } from "@/lib/store/users";
import { Button, Form, Input, Modal } from "antd";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function EditInfoModal(props: Props) {
  const { open, onOpenChange } = props;
  const info = useAppSelector(selectUserById(getLoginUserId()!));
  const dispatch = useAppDispatch();

  function submit(form: any) {
    userApi
      .updateInfo(form)
      .then(() => {
        onOpenChange(false);
        messageInstance().success("修改成功");
        dispatch(fetchLoginUser(true));
      })
      .showError();
  }

  return (
    <Modal
      title="修改用户信息"
      width="20rem"
      open={open}
      footer={null}
      destroyOnClose
      onCancel={() => onOpenChange(false)}
    >
      <Form labelCol={{ span: 6 }} wrapperCol={{ span: 16 }} onFinish={submit}>
        <Form.Item
          label="头像"
          name="avatar"
          rules={[{ required: true, message: "请上传头像" }]}
          style={{ alignItems: "center" }}
          initialValue={info?.avatar}
        >
          <ImageUpload tips="上传头像" />
        </Form.Item>
        <Form.Item
          label="昵称"
          name="nickname"
          rules={[{ required: true, message: "请输入昵称" }]}
          initialValue={info?.nickname}
        >
          <Input />
        </Form.Item>
        <Form.Item wrapperCol={{ offset: 6, span: 16 }} className="mb-0">
          <Button type="primary" htmlType="submit" className="w-full">
            保存
          </Button>
        </Form.Item>
      </Form>
    </Modal>
  );
}
