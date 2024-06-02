import { RouterProvider } from "react-router-dom";
import LoginUserProvider from "./lib/shared/login-user";
import SharedMessageHolder from "./lib/shared/message";
import NotificationProvider from "./lib/notification";
import ThemeProvider from "./lib/shared/theme";
import StoreProivder from "./lib/store/StoreProvider";
import { router } from "./routes";
import React from "react";

export default function App() {
  return (
    <React.StrictMode>
      <ThemeProvider>
        <SharedMessageHolder />
        <StoreProivder>
          <LoginUserProvider>
            <NotificationProvider>
              <RouterProvider router={router} />
            </NotificationProvider>
          </LoginUserProvider>
        </StoreProivder>
      </ThemeProvider>
    </React.StrictMode>
  );
}
