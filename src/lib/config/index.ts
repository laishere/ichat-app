const config = {
  baseURL: "/api/",
  timeout: 10000,
  wsEndpoint: "{host}/api/ws/",
};

export default config;

export function wsEndpoint(url: string) {
  const host = window.location.host;
  const isHttps = window.location.protocol === "https:";
  const wsProtocol = isHttps ? "wss:" : "ws:";
  const prefix = config.wsEndpoint.replace("{host}", host);
  return `${wsProtocol}//${prefix}${url}`;
}

export function appImageUrl(url: string) {
  if (
    !url ||
    url.startsWith("http") ||
    url.startsWith("data:") ||
    url.startsWith("/")
  ) {
    return url;
  }
  return config.baseURL + url;
}
