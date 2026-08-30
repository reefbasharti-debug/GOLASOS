import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const orderSchema = z.object({
  customerName: z.string().trim().min(2, "שם חייב להכיל לפחות 2 תווים").max(80),
  phone: z.string().trim().min(8, "מספר טלפון לא תקין").max(20),
  email: z.string().trim().email("אימייל לא תקין").max(200).optional().or(z.literal("")),
  city: z.string().trim().max(80).optional().or(z.literal("")),
  address: z.string().trim().max(200).optional().or(z.literal("")),
  notes: z.string().trim().max(600).optional().or(z.literal("")),
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        size: z.string().trim().max(20).optional().or(z.literal("")),
        quantity: z.number().int().min(1).max(20),
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
    return createOrder(data);
  });
