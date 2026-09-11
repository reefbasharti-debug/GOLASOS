import { Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useLang } from "@/lib/i18n";
import type { CatalogGroupMeta } from "@/lib/catalog";

export function Footer({ settings, groups }: { settings: Record<string, string>; groups: CatalogGroupMeta[] }) {
  const { t } = useLang();
  const [email, setEmail] = useState("");
  const [bot, setBot] = useState("");
  const [error, setError] = useState("");

  const subscribe = (e: FormEvent) => {
    e.preventDefault();
    // Honeypot: real people never fill a hidden field.
    if (bot.trim()) return;
    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email.trim())) {
      setError("נא להזין כתובת אימייל תקינה");
      return;
    }
    setError("");
    toast.success(t("subscribed"));
    setEmail("");
  };

  return (
    <footer className="mt-16 border-t bg-secondary/50">
      {/* league links row */}
      <div className="border-b">
        <ul className="mx-auto flex max-w-7xl flex-wrap justify-center gap-x-6 gap-y-2 px-4 py-4 text-xs font-semibold">
          {groups.map((g) => (
            <li key={g.name}>
              <Link to="/categories" hash={`g-${encodeURIComponent(g.name)}`} className="flex items-center gap-1.5 hover:text-primary hover:underline">
                {g.image_url ? <img src={g.image_url} alt="" className="size-4 object-contain" /> : null}
                {g.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 md:grid-cols-4">
        <div>
          <h3 className="text-sm font-bold">{t("newsletter")}</h3>
          <p className="mt-2 text-xs text-muted-foreground">{t("newsletter_hint")}</p>
          <form onSubmit={subscribe} className="mt-3 flex" noValidate>
            <input
              type="text"
              name="company_website"
              value={bot}
              onChange={(e) => setBot(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="hidden"
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              aria-label="Email"
              aria-invalid={error ? true : undefined}
              required
              className="h-9 w-full rounded-s-md border bg-background px-3 text-sm outline-none focus-key"
              dir="ltr"
            />
            <button className="h-9 rounded-e-md bg-primary px-4 text-xs font-bold text-primary-foreground focus-key">{t("subscribe")}</button>
          </form>
          {error ? <p className="mt-1 text-xs font-semibold text-destructive">{error}</p> : null}
        </div>
        <div>
          <h3 className="text-sm font-bold">{t("company_info")}</h3>
          <ul className="mt-3 space-y-1.5 text-xs">
            <li><Link to="/contact" className="hover:underline">{t("about_us")}</Link></li>
            <li><Link to="/contact" className="hover:underline">{t("customer_reviews")}</Link></li>
            <li><Link to="/contact" className="hover:underline">{t("feedback")}</Link></li>
            <li><Link to="/contact" className="hover:underline">{t("contact")}</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-bold">{t("user_center")}</h3>
          <ul className="mt-3 space-y-1.5 text-xs">
            <li><Link to="/tracking" className="hover:underline">{t("tracking")}</Link></li>
            <li><Link to="/tracking" className="hover:underline">{t("my_orders")}</Link></li>
            <li><Link to="/auth" className="hover:underline">{t("register")}</Link></li>
            <li><Link to="/cart" className="hover:underline">{t("cart")}</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-bold">{t("help")}</h3>
          <ul className="mt-3 space-y-1.5 text-xs">
            <li><Link to="/terms" hash="shipping" className="hover:underline">{t("shipping_methods")}</Link></li>
            <li><Link to="/terms" hash="refunds" className="hover:underline">{t("refund_policy")}</Link></li>
            <li><Link to="/terms" className="hover:underline">{t("terms_page")}</Link></li>
            <li><Link to="/privacy" className="hover:underline">{t("privacy_policy")}</Link></li>
            <li><Link to="/accessibility" className="hover:underline">{t("accessibility")}</Link></li>
            <li><Link to="/admin" className="hover:underline">{t("admin")}</Link></li>
          </ul>
          {settings["shipping_note"] ? <p className="mt-4 text-xs text-muted-foreground">{settings["shipping_note"]}</p> : null}
        </div>
      </div>

      <div className="border-t">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-4 text-xs text-muted-foreground">
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Link to="/terms" className="hover:underline">{t("terms_page")}</Link>
            <Link to="/privacy" className="hover:underline">{t("privacy_policy")}</Link>
            <Link to="/accessibility" className="hover:underline">{t("accessibility")}</Link>
          </span>
          <span>
            Copyright © {new Date().getFullYear()} {settings["site_title"] || "גולאסוס"}. {t("rights")}
          </span>
          <span className="flex items-center gap-2 font-bold" aria-label="payments">
            {["VISA", "Mastercard", "PayPal", "Apple Pay", "bit"].map((p) => (
              <span key={p} className="rounded border bg-background px-2 py-0.5 text-[10px]">
                {p}
              </span>
            ))}
          </span>
        </div>
      </div>
    </footer>
  );
}
