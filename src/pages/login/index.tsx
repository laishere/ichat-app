import ImageUpload from "@/components/ImageUpload";
import IconLogo from "@/icons/logo";
import loginApi from "@/lib/api/login";
import { setLoginUser } from "@/lib/shared/login-user";
import { messageInstance } from "@/lib/shared/message";
import { resetLoginRedirectState } from "./route";
import { Button, Card, Form, Input } from "antd";
import { useEffect, useState } from "react";
import { redirect } from "@/lib/shared/router";

export default function Login() {
  const [type, setType] = useState(1);

  useEffect(() => {
    resetLoginRedirectState();
  }, []);

  return (
    <div className="flex justify-center items-center h-full">
      <Card>
        <div>
          <IconLogo className="text-[2rem] mx-auto my-4 pb-4" />
          {type == 1 ? (
            <LoginForm setType={setType} />
          ) : (
            <RegisterForm setType={setType} />
          )}
        </div>
      </Card>
    </div>
  );
}

function LoginForm(props: { setType: (type: number) => void }) {
  const { setType } = props;
  const [loginDisabled, setLoginDisabled] = useState(false);

  useEffect(() => {
    document.title = "iChat - 登录";
  }, []);

  function login(form: any) {
    setLoginDisabled(true);
    loginApi
      .login(form.username, form.password)
      .then((r) => {
        setLoginUser(r);
        messageInstance().success("登录成功");
        redirect("/");
      })
      .showError()
      .finally(() => {
        setLoginDisabled(false);
      });
  }

  return (
    <Form
      labelCol={{ span: 6 }}
      wrapperCol={{ span: 16 }}
      style={{ maxWidth: 600 }}
      className="w-[20rem]"
      onFinish={login}
    >
      <Form.Item
        label="用户名"
        name="username"
        rules={[{ required: true, message: "请输入用户名" }]}
      >
        <Input autoFocus />
      </Form.Item>
      <Form.Item
        label="密码"
        name="password"
        rules={[{ required: true, message: "请输入密码" }]}
      >
        <Input.Password />
      </Form.Item>
      <Form.Item wrapperCol={{ offset: 6, span: 16 }} className="mb-3">
        <Button
          loading={loginDisabled}
          type="primary"
          className="w-full"
          htmlType="submit"
        >
          登录
        </Button>
      </Form.Item>
      <Form.Item wrapperCol={{ offset: 6, span: 16 }} className="mb-0">
        <Button type="link" className="w-full" onClick={() => setType(2)}>
          创建账号
        </Button>
      </Form.Item>
    </Form>
  );
}

function RegisterForm(props: { setType: (type: number) => void }) {
  const { setType } = props;
  const [registerDisabled, setRegisterDisabled] = useState(false);

  useEffect(() => {
    document.title = "iChat - 注册";
  }, []);

  function registerAndLogin(form: any) {
    if (!form.avatar) {
      messageInstance().warning("头像未上传");
      return;
    }
    setRegisterDisabled(true);
    loginApi
      .registerAndLogin({
        username: form.username,
        password: form.password,
        nickname: form.nickname,
        avatar: form.avatar,
      })
      .then((r) => {
        setLoginUser(r);
        messageInstance().success("注册成功");
        redirect("/");
      })
      .showError()
      .finally(() => {
        setRegisterDisabled(false);
      });
  }

  return (
    <Form
      labelCol={{ span: 6 }}
      wrapperCol={{ span: 16 }}
      style={{ maxWidth: 600 }}
      className="w-[20rem]"
      onFinish={registerAndLogin}
    >
      <Form.Item
        label="头像"
        name="avatar"
        rules={[{ required: true, message: "请上传头像" }]}
        style={{ alignItems: "center" }}
      >
        <ImageUpload tips="上传头像" />
      </Form.Item>
      <Form.Item
        label="用户名"
        name="username"
        rules={[{ required: true, message: "请输入用户名" }]}
      >
        <Input autoFocus />
      </Form.Item>
      <Form.Item
        label="昵称"
        name="nickname"
        rules={[{ required: true, message: "请输入昵称" }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        label="密码"
        name="password"
        rules={[{ required: true, message: "请输入密码" }]}
      >
        <Input.Password />
      </Form.Item>
      <Form.Item
        label="确认密码"
        name="password2"
        dependencies={["password"]}
        hasFeedback
        rules={[
          {
            required: true,
            message: "请确认密码",
          },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue("password") === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error("两次输入的密码不一致"));
            },
          }),
        ]}
      >
        <Input.Password />
      </Form.Item>
      <Form.Item wrapperCol={{ offset: 6, span: 16 }} className="mb-3">
        <Button
          loading={registerDisabled}
          type="primary"
          className="w-full"
          htmlType="submit"
        >
          注册并登录
        </Button>
      </Form.Item>
      <Form.Item wrapperCol={{ offset: 6, span: 16 }} className="mb-0">
        <Button type="link" className="w-full" onClick={() => setType(1)}>
          已有账号
        </Button>
      </Form.Item>
    </Form>
  );
}
