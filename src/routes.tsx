import React from "react";
import { createBrowserRouter } from "react-router-dom";
import Home from "./pages/home";
import Login from "./pages/login";

const LazyCall = React.lazy(() => import("./pages/call"));

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/call/:callId",
    loader: ({ params }) => {
      return parseInt(params.callId as string);
    },
    element: <LazyCall />,
  },
]);
