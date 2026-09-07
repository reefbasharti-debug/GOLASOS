import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const orderSchema = z.object({
  customerName: z.string().trim().min(2, "שם חייב להכיל לפחות 2 תווים").max(80),
  phone: z.string().trim().min(8, "מספר טלפון לא תקין").max(20),
  email: z.string().trim().email("אימייל לא תקין").max(200).optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  address: z.string().trim().max(200).optional().or(z.literal("")),
  notes: z.string().trim().max(600).optional().or(z.literal("")),
  shipping: z.enum(["free", "express"]).default("free"),
  referralCode: z.string().trim().max(20).optional().or(z.literal("")),
  creditUsed: z.number().min(0).max(100000).optional(),

  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        size: z.string().trim().max(80).optional().or(z.literal("")),
        quantity: z.number().int().min(1).max(20),
        version: z.enum(["fan", "player"]).optional(),
        custom: z.string().trim().max(40).optional().or(z.literal("")),
      }),
    )
    .min(1, "העגלה ריקה")
    .max(40),
});

export const getStoreData = createServerFn({ method: "GET" }).handler(async () => {
  const { loadStoreData } = await import("./store.server");
  return loadStoreData();
});

export const getCategoryPage = createServerFn({ method: "GET" })
  .inputValidator((data: { slug: string }) => z.object({ slug: z.string().max(120) }).parse(data))
  .handler(async ({ data }) => {
    const { loadCategoryPage } = await import("./store.server");
    return loadCategoryPage(data.slug);
  });

export const getProduct = createServerFn({ method: "GET" })
  .inputValidator((data: { id: string }) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const { loadProduct } = await import("./store.server");
    return loadProduct(data.id);
  });

export const submitOrder = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => orderSchema.parse(data))
  .handler(async ({ data }) => {
    const { createOrder } = await import("./store.server");
    // Guest checkout: store credit can only be spent by a signed-in customer.
    return createOrder({ ...data, creditUsed: 0 });
  });

/** Signed-in checkout: links the order to the account and may spend store credit. */
export const submitOrderAuthed = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => orderSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { createOrder } = await import("./store.server");
    const { data: profile } = await context.supabase
      .from("profiles")
      .select("credit_ils")
      .eq("id", context.userId)
      .maybeSingle();
    const available = Number(profile?.credit_ils ?? 0);
    return createOrder({
      ...data,
      userId: context.userId,
      creditUsed: Math.min(available, Number(data.creditUsed ?? 0)),
    });
  });

export const getBrowse = createServerFn({ method: "GET" })
  .inputValidator((data: unknown) =>
    z
      .object({
        audience: z.string().max(20).optional(),
        sport: z.string().max(20).optional(),
        item: z.string().max(20).optional(),
        league: z.string().max(80).optional(),
        team: z.string().max(120).optional(),
        color: z.string().max(20).optional(),
        size: z.string().max(10).optional(),
        min: z.number().optional(),
        max: z.number().optional(),
        q: z.string().max(80).optional(),
        sort: z.string().max(20).optional(),
      })
      .parse(data ?? {}),
  )
  .handler(async ({ data }) => {
    const { loadBrowse } = await import("./store.server");
    return loadBrowse(data);
  });

export const getTicker = createServerFn({ method: "GET" }).handler(async () => {
  const { loadPurchaseTicker } = await import("./store.server");
  return loadPurchaseTicker();
});

export const getHomeData = createServerFn({ method: "GET" }).handler(async () => {
  const { loadHomeData } = await import("./store.server");
  return loadHomeData();
});

export const searchCatalog = createServerFn({ method: "GET" })
  .inputValidator((data: { q: string }) => z.object({ q: z.string().max(80) }).parse(data))
  .handler(async ({ data }) => {
    const { searchProducts } = await import("./store.server");
    return searchProducts(data.q);
  });

export const lookupOrder = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ orderNumber: z.number().int().min(1).max(999999999), phone: z.string().trim().min(6).max(20) }).parse(data),
  )
  .handler(async ({ data }) => {
    const { trackOrder } = await import("./store.server");
    return trackOrder(data.orderNumber, data.phone);
  });

export const getShoes = createServerFn({ method: "GET" })
  .inputValidator((data) =>
    z
      .object({
        model: z.string().max(60).optional(),
        color: z.string().max(20).optional(),
        size: z.string().max(10).optional(),
        tier: z.string().max(10).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const { loadShoes } = await import("./store.server");
    return loadShoes(data);
  });

export const getMysteryBox = createServerFn({ method: "GET" }).handler(async () => {
  const { loadMysteryBox } = await import("./store.server");
  return loadMysteryBox();
});
