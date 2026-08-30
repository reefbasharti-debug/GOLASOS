import { Link } from "@tanstack/react-router";
import { Menu, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

export type NavCategory = { slug: string; name: string; kind: string };

const KIND_LABEL: Record<string, string> = {
  club: "קבוצות מועדון",
  national: "נבחרות לאומיות",
  retro: "חולצות רטרו",
  shoes: "נעלי כדורגל",
  mixed: "קולקציות נוספות",
};

export function Header({ categories }: { categories: NavCategory[] }) {
  const { count } = useCart();
  const [open, setOpen] = useState(false);

  const groups = Object.entries(
    categories.reduce<Record<string, NavCategory[]>>((acc, c) => {
      const key = KIND_LABEL[c.kind] ? c.kind : "mixed";
      acc[key] = [...(acc[key] ?? []), c];
      return acc;
    }, {}),
  );

  return (
    <header className="sticky top-0 z-50 surface-navy shadow-md">
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            className="rounded-md p-2 transition-colors hover:bg-sidebar-accent"
            aria-label="פתיחת תפריט"
          >
            <Menu className="size-5" />
          </SheetTrigger>
          <SheetContent side="right" className="w-80 overflow-y-auto bg-sidebar text-sidebar-foreground">
            <SheetTitle className="text-sidebar-foreground">כל הקטגוריות</SheetTitle>
            <nav className="mt-4 space-y-5 pb-10">
              {groups.map(([kind, list]) => (
                <div key={kind}>
                  <p className="mb-2 text-xs font-bold uppercase text-accent">{KIND_LABEL[kind]}</p>
                  <ul className="space-y-1">
                    {list.map((c) => (
                      <li key={c.slug}>
                        <Link
                          to="/category/$slug"
                          params={{ slug: c.slug }}
                          onClick={() => setOpen(false)}
                          className="block rounded px-2 py-1.5 text-sm transition-colors hover:bg-sidebar-accent"
                        >
                          {c.name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        <Link to="/" className="flex items-center gap-2">
          <span className="rounded surface-gold px-2 py-1 text-lg font-extrabold leading-none">G</span>
          <span className="text-xl font-extrabold tracking-tight">גולאסוס</span>
        </Link>

        <nav className="mx-4 hidden flex-1 items-center gap-5 text-sm font-medium md:flex">
          <Link to="/" className="transition-colors hover:text-accent">
            דף הבית
          </Link>
          <Link to="/categories" className="transition-colors hover:text-accent">
            כל הקטגוריות
          </Link>
          <Link
            to="/category/$slug"
            params={{ slug: "football-boots" }}
            className="transition-colors hover:text-accent"
          >
            נעלי כדורגל
          </Link>
          <Link to="/contact" className="transition-colors hover:text-accent">
            צור קשר
          </Link>
        </nav>

        <Link
          to="/cart"
          className="relative mr-auto flex items-center gap-2 rounded-md surface-gold px-3 py-2 text-sm font-bold md:mr-0"
        >
          <ShoppingCart className="size-4" />
          עגלה
          {count > 0 ? (
            <span className="absolute -top-2 -left-2 grid size-5 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
              {count}
            </span>
          ) : null}
        </Link>
      </div>
    </header>
  );
}
