import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

function email(context: { claims: unknown }): string {
  return (context.claims as { email?: string }).email ?? "";
}

export const getAccount = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { loadAccount } = await import("./account.server");
    return loadAccount(context.supabase, context.userId, email(context));
  });

export const registerReferral = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ code: z.string().trim().max(20) }).parse(data))
  .handler(async ({ data, context }) => {
    const { ensureProfile } = await import("./account.server");
    const profile = await ensureProfile(context.supabase, context.userId, email(context), data.code);
    return { referralCode: profile.referral_code };
  });

export const saveProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        full_name: z.string().trim().max(120),
        phone: z.string().trim().max(30),
        payment_pref: z.enum(["card", "paypal", "applepay", "bit"]),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("profiles").update(data).eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Permanently deletes the signed-in customer's account. */
export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("profiles").delete().eq("id", context.userId);
    await supabaseAdmin.from("orders").update({ user_id: null }).eq("user_id", context.userId);
    const { error } = await supabaseAdmin.auth.admin.deleteUser(context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
