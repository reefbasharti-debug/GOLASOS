import { useEffect, useState } from "react";
import { imageUrl } from "@/lib/img";

export type TickerProduct = { name: string; price_ils: number; image_url: string | null };

const FIRST_NAMES = [
  "רועי", "נועם", "איתי", "יובל", "דניאל", "עומר", "אלון", "מאור", "שירה", "תמר",
  "ליאור", "עדן", "אורי", "גיא", "רותם", "יונתן", "אביב", "נטע", "הילה", "עמית",
];

function mask(name: string) {
  return `${name.slice(0, 2)}**`;
}

type Popup = { id: number; name: string; product: TickerProduct; at: Date };

/**
 * Desktop-only social-proof popups (bottom-left) showing recent-style purchases.
 * Hidden on mobile so it never blocks the buy buttons.
 */
export function PurchaseToasts({ products }: { products: TickerProduct[] }) {
  const [popup, setPopup] = useState<Popup | null>(null);

  useEffect(() => {
    if (products.length === 0) return;
    if (window.matchMedia("(max-width: 767px)").matches) return;

    let timer: ReturnType<typeof setTimeout>;
    let hide: ReturnType<typeof setTimeout>;
    let n = 0;

    const schedule = () => {
      const delay = 2000 + Math.random() * 8000;
      timer = setTimeout(() => {
        const product = products[Math.floor(Math.random() * products.length)]!;
        const name = FIRST_NAMES[Math.floor(Math.random() * FIRST_NAMES.length)]!;
        n += 1;
        setPopup({ id: n, name, product, at: new Date() });
        hide = setTimeout(() => setPopup(null), 6000);
        schedule();
      }, delay);
    };
    schedule();

    return () => {
      clearTimeout(timer);
      clearTimeout(hide);
    };
  }, [products]);

  if (!popup) return null;

  return (
    <div className="pointer-events-none fixed bottom-4 start-4 z-40 hidden md:block">
      <div className="pop-in flex w-72 items-center gap-3 rounded-xl border bg-card p-3 shadow-elevated">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">
            {mask(popup.name)} קנה
          </p>
          <p className="truncate text-xs text-muted-foreground">{popup.product.name}</p>
          <p className="mt-0.5 text-sm font-extrabold text-primary">{popup.product.price_ils} ₪</p>
          <p className="mt-1 text-[10px] text-muted-foreground">
            {popup.at.toLocaleString("he-IL", { timeZone: "Asia/Jerusalem" })}
          </p>
        </div>
        {popup.product.image_url ? (
          <img
            src={imageUrl(popup.product.image_url)}
            alt=""
            loading="lazy"
            className="size-16 shrink-0 rounded-lg border object-cover"
          />
        ) : null}
      </div>
    </div>
  );
}
