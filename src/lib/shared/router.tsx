import { router } from "@/routes";

export function redirect(path: string) {
  router.navigate(path, { replace: true });
}

export function navigate(path: string) {
  router.navigate(path);
}
