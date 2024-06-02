import React from "react";

export function BlurBox({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="w-full h-full max-w-4xl max-h-[34rem] rounded-[1rem] overflow-hidden"
      style={{
        background: "rgba(255, 255, 255, 0.2)",
        backdropFilter: "blur(0.5rem)",
        boxShadow: "rgba(0, 0, 0, 0.1) 0 0 0.5rem",
      }}
    >
      {children}
    </div>
  );
}
