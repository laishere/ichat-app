import React from "react";
import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#2F48F9",
        },
      }}
      locale={zhCN}
    >
      {children}
    </ConfigProvider>
  );
}
