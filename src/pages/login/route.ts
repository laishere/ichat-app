import { clearLogin } from "@/lib/shared/login-user";
import { redirect } from "@/lib/shared/router";

let redirectingToLogin = false;

export function gotoLogin(): boolean {
  if (redirectingToLogin) {
    // console.log("login redirecting");
    return false;
  }
  setTimeout(() => {
    clearLogin();
  }, 1000);
  redirectingToLogin = true;
  redirect("/login");
  return true;
}

export function resetLoginRedirectState() {
  redirectingToLogin = false;
}
