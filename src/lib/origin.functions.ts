import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";

/**
 * Absolute origin of the current request, used to build absolute social-preview
 * URLs (og:image / twitter:image) without hardcoding a host.
 */
export const getRequestOrigin = createServerFn({ method: "GET" }).handler(() => {
  const req = getRequest();
  const url = new URL(req.url);
  // x-forwarded-host is only trustworthy behind the localhost dev proxy.
  const proxied = url.hostname === "localhost" ? req.headers.get("x-forwarded-host") : null;
  return proxied ? `https://${proxied}` : url.origin;
});
