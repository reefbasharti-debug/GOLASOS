import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Copy, Gift, Share2, Wallet } from "lucide-react";
import { getAccount } from "@/lib/account.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/affiliate")({
  head: () => ({
    meta: [
      { title: "חבר מביא חבר | גולאסוס" },
      {
        name: "description",
        content: "שתפו את הקישור האישי שלכם וקבלו 15 ₪ זיכוי לאתר על כל חבר שרוכש בגולאסוס.",
      },
      { property: "og:title", content: "חבר מביא חבר — 15 ₪ על כל רכישה" },
      { property: "og:description", content: "משתפים קישור, חבר קונה, ואתם מקבלים 15 ₪ זיכוי לאתר." },
    ],
  }),
  component: AffiliatePage,
});

function AffiliatePage() {
  const fetchAccount = useServerFn(getAccount);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useQuery({
    queryKey: ["session-check"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      setSignedIn(Boolean(data.session));
      return true;
    },
  });

  const { data } = useQuery({
    queryKey: ["account-affiliate"],
    queryFn: () => fetchAccount(),
    enabled: signedIn === true,
  });

  const code = data?.profile.referral_code ?? "";
  const link = code && typeof window !== "undefined" ? `${window.location.origin}/?ref=${code}` : "";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      toast.success("הקישור הועתק");
    } catch {
      /* ignore */
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-bold">חבר מביא חבר</h1>
      <p className="mt-2 text-muted-foreground">
        משתפים את הקישור האישי, וכל חבר חדש שרוכש דרכו מכניס לכם 15 ₪ זיכוי לרכישה באתר.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Step icon={<Share2 className="size-5" />} title="1. משתפים" text="שולחים את הקישור האישי לחברים בוואטסאפ או באינסטגרם." />
        <Step icon={<Gift className="size-5" />} title="2. החבר קונה" text="החבר מזמין דרך הקישור — המערכת מזהה אותו אוטומטית." />
        <Step icon={<Wallet className="size-5" />} title="3. מקבלים 15 ₪" text="הזיכוי נכנס לחשבון שלכם וניתן לנצל אותו בקנייה הבאה." />
      </div>

      <div className="mt-8 rounded-xl border bg-card p-5">
        <h2 className="text-lg font-bold">הקישור האישי שלך</h2>
        {signedIn === false ? (
          <div className="mt-3">
            <p className="text-sm text-muted-foreground">כדי לקבל קישור אישי צריך חשבון באתר.</p>
            <Link to="/auth" className="btn-critical mt-3 inline-flex rounded-md px-5 py-2.5 text-sm">
              התחברות / הרשמה
            </Link>
          </div>
        ) : link ? (
          <>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <code dir="ltr" className="flex-1 overflow-x-auto rounded-md border bg-secondary px-3 py-2 text-sm">
                {link}
              </code>
              <button onClick={copy} className="btn-critical-sm focus-key flex items-center gap-1.5">
                <Copy className="size-4" /> העתקה
              </button>
            </div>
            <div className="mt-4 flex flex-wrap gap-6 text-sm">
              <p>
                זיכוי זמין: <b>{Number(data?.profile.credit_ils ?? 0)} ₪</b>
              </p>
              <p>
                חברים שרכשו: <b>{data?.referrals.length ?? 0}</b>
              </p>
            </div>
            {data && data.referrals.length > 0 ? (
              <ul className="mt-4 space-y-1 text-sm text-muted-foreground">
                {data.referrals.map((r) => (
                  <li key={r.id} className="flex justify-between gap-2 border-b py-1">
                    <span>{r.buyer_label ?? "חבר"} רכש באתר</span>
                    <span className="font-semibold text-foreground">+{Number(r.amount_ils)} ₪</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">טוען...</p>
        )}
      </div>

      <div className="mt-8 text-sm text-muted-foreground">
        <h2 className="text-base font-bold text-foreground">איך זה עובד בפועל</h2>
        <ul className="mt-2 list-disc space-y-1 pe-5">
          <li>הזיכוי מוענק על רכישה ראשונה של חבר חדש שהגיע דרך הקישור שלך.</li>
          <li>אפשר לנצל את הזיכוי בסיום ההזמנה, כהנחה מסכום התשלום.</li>
          <li>אין הגבלה על מספר החברים שאפשר להביא.</li>
        </ul>
      </div>
    </div>
  );
}

function Step({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="rounded-xl border bg-card p-4">
      <div className="flex items-center gap-2 font-bold">
        <span className="text-primary">{icon}</span>
        {title}
      </div>
      <p className="mt-1.5 text-sm text-muted-foreground">{text}</p>
    </div>
  );
}
