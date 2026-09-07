import { createFileRoute } from "@tanstack/react-router";

/**
 * Pulls tracking numbers from the Google Sheet back into the store.
 * Called by a scheduler; guarded by the shared cron secret.
 */
export const Route = createFileRoute("/api/public/sheet-sync")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["LOVABLE_CRON_SECRET"];
        const provided = request.headers.get("x-cron-secret") ?? "";
        if (!secret || provided !== secret) {
          return new Response("Unauthorized", { status: 401 });
        }
        const { pullTrackingFromSheet } = await import("@/lib/sheets.server");
        const result = await pullTrackingFromSheet();
        return Response.json(result, { status: result.ok ? 200 : 502 });
      },
    },
  },
});
