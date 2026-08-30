import { createFileRoute } from "@tanstack/react-router";

const ALLOWED_HOSTS = ["photo.yupoo.com", "uvfk.yupoo.com", "sfk.yupoo.com"];

/**
 * Supplier images are hotlink-protected (they require a Referer header), so we
 * stream them through this endpoint. Only supplier image hosts are allowed.
 */
export const Route = createFileRoute("/api/public/img")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const raw = new URL(request.url).searchParams.get("u");
        if (!raw) return new Response("Missing image", { status: 400 });

        let target: URL;
        try {
          target = new URL(raw);
        } catch {
          return new Response("Bad image url", { status: 400 });
        }

        if (target.protocol !== "https:" || !ALLOWED_HOSTS.includes(target.hostname)) {
          return new Response("Host not allowed", { status: 403 });
        }

        const upstream = await fetch(target.toString(), {
          headers: {
            Referer: "https://x.yupoo.com/",
            "User-Agent":
              "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
          },
        });

        if (!upstream.ok || !upstream.body) {
          return new Response("Image unavailable", { status: 502 });
        }

        return new Response(upstream.body, {
          status: 200,
          headers: {
            "content-type": upstream.headers.get("content-type") ?? "image/jpeg",
            "cache-control": "public, max-age=604800, immutable",
          },
        });
      },
    },
  },
});
