import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export const submitTicket = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        kind: z.enum(["shipping_delay", "damaged_item", "product_request", "misunderstood"]),
        orderNumber: z.number().int().min(1).max(999999999).optional(),
        email: z.string().trim().email().max(200).optional().or(z.literal("")),
        description: z.string().trim().max(2000).optional(),
        // data: URL of a single customer screenshot, capped at ~4 MB
        imageDataUrl: z.string().max(6_000_000).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { createTicket } = await import("./support.server");
    return createTicket({
      kind: data.kind,
      ...(data.orderNumber !== undefined ? { orderNumber: data.orderNumber } : {}),
      ...(data.email ? { email: data.email } : {}),
      ...(data.description ? { description: data.description } : {}),
      ...(data.imageDataUrl ? { imageDataUrl: data.imageDataUrl } : {}),
    });
  });

export const chatLookupOrder = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        orderNumber: z.number().int().min(1).max(999999999),
        email: z.string().trim().email().max(200),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { chatOrderStatus } = await import("./account.server");
    return chatOrderStatus(data.orderNumber, data.email);
  });
