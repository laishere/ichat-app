import { messageInstance } from "../shared/message";

declare global {
  interface Promise<T> {
    ignoreError(): Promise<T>;
    showError(): Promise<T>;
  }
}

Promise.prototype.ignoreError = async function () {
  return this.catch(() => {});
};

Promise.prototype.showError = async function () {
  return this.catch((error) => {
    // console.log("showError", error);
    if (error === IgnoredError) return;
    messageInstance().error(error.message || error);
  });
};

export const IgnoredError = Symbol("IgnoredError");

export {};
