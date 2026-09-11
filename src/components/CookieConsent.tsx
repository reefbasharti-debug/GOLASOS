import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { useLang } from "@/lib/i18n";

const STORAGE_KEY = "golassos-cookie-consent";

/**
 * Cookie / storage consent banner. Essential storage (cart, language, session)
 * always runs; analytics-style optional storage is only used after "accept".
 */
export function CookieConsent() {
  const { t } = useLang();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {
      /* storage blocked — stay hidden */
    }
  }, []);

  const decide = (choice: "all" | "essential") => {
    try {
      localStorage.setItem(STORAGE_KEY, choice);
    } catch {
      /* ignore */
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label={t("cookie_title")}
      className="fixed inset-x-0 bottom-0 z-[60] border-t bg-card/98 p-4 shadow-elevated backdrop-blur"
    >
      <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-relaxed text-foreground sm:text-sm">
          <span className="font-bold">{t("cookie_title")} </span>
          {t("cookie_text")}{" "}
          <Link to="/privacy" className="font-semibold underline focus-key">
            {t("privacy_policy")}
          </Link>
        </p>
        <div className="flex shrink-0 gap-2">
          <button onClick={() => decide("essential")} className="btn-critical-ghost focus-key min-h-11 px-4 text-xs font-bold">
            {t("cookie_essential")}
          </button>
          <button onClick={() => decide("all")} className="btn-critical focus-key min-h-11 px-5 text-xs font-bold">
            {t("cookie_accept")}
          </button>
        </div>
      </div>
    </div>
  );
}
