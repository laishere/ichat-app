import { Provider } from "react-redux";
import { AppStore, createStore } from ".";
import { useState } from "react";

let setStoreHook: (store: AppStore) => void;
export function clearAppStore() {
  setStoreHook(createStore());
}

export default function StoreProivder({
  children,
}: {
  children: React.ReactNode;
}) {
  const [store, setStore] = useState(createStore());
  setStoreHook = setStore;
  return <Provider store={store}>{children}</Provider>;
}
