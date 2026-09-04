import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const uuid = z.string().uuid();

export const claimAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { claimAdminRole } = await import("./admin.server");
    return claimAdminRole(context.userId, (context.claims as { email?: string }).email ?? "");
  });

export const getAdminOverview = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { loadAdminOverview } = await import("./admin.server");
    return loadAdminOverview(context.supabase);
  });

export const updateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ id: uuid, status: z.enum(["new", "contacted", "paid", "shipped", "done", "cancelled"]) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("orders")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const saveSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        settings: z.record(z.string().max(60), z.string().max(2000)),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const rows = Object.entries(data.settings).map(([key, value]) => ({ key, value }));
    const { error } = await context.supabase.from("site_settings").upsert(rows, { onConflict: "key" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const saveProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: uuid,
        name: z.string().trim().min(2).max(200).optional(),
        price_ils: z.number().min(0).max(100000).optional(),
        is_active: z.boolean().optional(),
        is_featured: z.boolean().optional(),
        description: z.string().max(2000).optional(),
        sizes: z.array(z.string().max(20)).max(30).optional(),
        shoe_tier: z.enum(["pro", "semi", "regular"]).nullable().optional(),
        color: z.string().trim().max(20).nullable().optional(),
        home_rank: z.number().int().min(0).max(1000).optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { id, ...raw } = data;
    const patch: Record<string, string | number | boolean | string[] | null> = {};
    for (const [k, v] of Object.entries(raw)) if (v !== undefined) patch[k] = v;
    const { error } = await context.supabase.from("products").update(patch as never).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const saveCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        id: uuid,
        name: z.string().trim().min(1).max(120).optional(),
        kind: z.enum(["club", "national", "retro", "shoes", "mixed"]).optional(),
        description: z.string().max(1000).optional(),
        sort_order: z.number().int().min(0).max(9999).optional(),
        is_active: z.boolean().optional(),
        logo_url: z.string().trim().max(500).nullable().optional(),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { id, ...raw } = data;
    const patch: Record<string, string | number | boolean | null> = {};
    for (const [k, v] of Object.entries(raw)) if (v !== undefined) patch[k] = v;
    const { error } = await context.supabase.from("categories").update(patch as never).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const bulkSetPrice = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ productType: z.enum(["jersey", "shoes"]), tier: z.enum(["pro", "semi", "regular"]).optional(), price: z.number().min(0).max(100000) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    let q = context.supabase.from("products").update({ price_ils: data.price }).eq("product_type", data.productType);
    if (data.tier) q = q.eq("shoe_tier", data.tier);
    const { error } = await q;
    if (error) throw new Error(error.message);
    return { ok: true };
  });
