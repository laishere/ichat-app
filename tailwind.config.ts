import type { Config } from "tailwindcss";

const config: Config = {
  corePlugins: {
    preflight: false,
  },
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  plugins: [],
};
export default config;
