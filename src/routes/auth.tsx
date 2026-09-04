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

  const signInWithGoogle = async () => {
    setPending(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) throw result.error;
      if (result.redirected) return;
      navigate({ to: "/admin" });
    } catch (error) {
      console.error(error);
      toast.error("ההתחברות עם Google נכשלה");
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="text-2xl font-bold">
        {mode === "signin" ? "התחברות לניהול האתר" : "יצירת חשבון ניהול"}
      </h1>
      <button
        type="button"
        onClick={signInWithGoogle}
        disabled={pending}
        className="mt-6 flex w-full items-center justify-center gap-3 rounded-md border bg-card px-4 py-2.5 font-bold hover:bg-muted disabled:opacity-60"
      >
        <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.5 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.3l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.7 6c4.5-4.2 6.9-10.3 6.9-17.7z"/>
          <path fill="#FBBC05" d="M10.5 28.6A14.5 14.5 0 0 1 9.7 24c0-1.6.3-3.2.8-4.6l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.7l7.9-6.1z"/>
          <path fill="#34A853" d="M24 48c6.3 0 11.7-2.1 15.6-5.7l-7.7-6c-2.1 1.4-4.8 2.3-7.9 2.3-6.3 0-11.6-4.1-13.5-9.9l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/>
        </svg>
        המשך עם Google
      </button>
      <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />
        או עם אימייל וסיסמה
        <span className="h-px flex-1 bg-border" />
      </div>
      <form onSubmit={submit} className="space-y-4 rounded-lg border bg-card p-5">
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
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="w-full text-xs font-semibold text-muted-foreground"
        >
          {mode === "signin" ? "אין לך חשבון? הרשמה" : "יש לך חשבון? התחברות"}
        </button>
      </form>
    </div>
  );
}
