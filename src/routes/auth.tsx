import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";

const schema = z.object({
  email: z.string().trim().email("אימייל לא תקין").max(200),
  password: z.string().min(6, "הסיסמה חייבת להכיל לפחות 6 תווים").max(72),
});

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "התחברות לניהול | גולאסוס" },
      { name: "description", content: "כניסת מנהל האתר לניהול מוצרים, קטגוריות והזמנות." },
      { property: "og:title", content: "התחברות לניהול | גולאסוס" },
      { property: "og:description", content: "אזור הניהול של חנות גולאסוס." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "נא לבדוק את הפרטים");
      return;
    }
    setPending(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: { emailRedirectTo: `${window.location.origin}/admin` },
        });
        if (error) throw error;
        toast.success("החשבון נוצר, מתחברים...");
      } else {
        const { error } = await supabase.auth.signInWithPassword(parsed.data);
        if (error) throw error;
      }
      const { data } = await supabase.auth.getSession();
      if (data.session) navigate({ to: "/admin" });
      else toast.info("נשלח אליך מייל לאישור החשבון");
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : "ההתחברות נכשלה");
    } finally {
      setPending(false);
    }
  };

  const google = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("ההתחברות עם גוגל נכשלה");
      return;
    }
    if (result.redirected) return;
    navigate({ to: "/admin" });
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold">
        {mode === "signin" ? "התחברות לניהול האתר" : "יצירת חשבון ניהול"}
      </h1>
      <form onSubmit={submit} className="mt-6 space-y-4 rounded-lg border bg-card p-5">
        <div>
          <label className="mb-1 block text-sm font-semibold">אימייל</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border px-3 py-2"
            maxLength={200}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold">סיסמה</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border px-3 py-2"
            maxLength={72}
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md surface-gold px-4 py-2.5 font-bold disabled:opacity-60"
        >
          {mode === "signin" ? "התחברות" : "הרשמה"}
        </button>
        <button
          type="button"
          onClick={google}
          className="w-full rounded-md border px-4 py-2.5 font-semibold transition-colors hover:bg-secondary"
        >
          התחברות עם Google
        </button>
        <button
          type="button"
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="w-full text-xs font-semibold text-muted-foreground"
        >
          {mode === "signin" ? "אין לך חשבון? הרשמה" : "יש לך חשבון? התחברות"}
        </button>
      </form>
    </div>
  );
}
