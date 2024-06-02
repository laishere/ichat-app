import ReactDOM from "react-dom/client";
import Suspense from "./components/Suspense";
import AnimatedLogo from "./icons/animated-logo";
import "./index.css";

function Loading() {
  return (
    <div className="flex h-full items-center justify-center">
      <AnimatedLogo fontSize="5rem" className="pb-[4rem]" />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <div className="h-screen">
    <Suspense
      loadingShowTime={4500}
      loadingDelay={500}
      loading={<Loading />}
      lazy={() => import("./App")}
    />
  </div>
);
