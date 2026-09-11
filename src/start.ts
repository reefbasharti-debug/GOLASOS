import { createStart, createCsrfMiddleware, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

// Start installs this automatically when src/start.ts is absent; defining the
// file opts out, so re-add it explicitly to keep server functions protected
// from cross-site requests.
// Force HTTPS: browsers that arrive over plain HTTP are redirected, and every
// response carries HSTS so later visits go straight to HTTPS.
const httpsMiddleware = createMiddleware().server(async ({ next, request }) => {
  const url = new URL(request.url);
  const proto = request.headers.get("x-forwarded-proto");
  const isLocal = url.hostname === "localhost" || url.hostname === "127.0.0.1";
  if (!isLocal && (proto ? proto.split(",")[0]?.trim() === "http" : url.protocol === "http:")) {
    url.protocol = "https:";
    return new Response(null, { status: 301, headers: { location: url.toString() } });
  }
  const result = await next();
  if (!isLocal && result instanceof Response) {
    result.headers.set("strict-transport-security", "max-age=31536000; includeSubDomains");
  }
  return result;
});

const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth],
  requestMiddleware: [httpsMiddleware, errorMiddleware, csrfMiddleware],
}));
