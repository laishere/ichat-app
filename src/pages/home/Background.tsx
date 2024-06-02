import defaultBg from "@/assets/bg.webp";
import { appImageUrl } from "@/lib/config";
import { useAppSelector } from "@/lib/store";
import { selectSettings } from "@/lib/store/settings";
import React from "react";
export function Background({ children }: { children: React.ReactNode }) {
  const settings = useAppSelector(selectSettings());
  const src = appImageUrl(settings.wallpaper || defaultBg);

  return (
    <div
      style={{
        backgroundImage: `url(${src})`,
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundSize: "cover",
      }}
      className="h-full flex items-center justify-center"
    >
      {children}
    </div>
  );
}
