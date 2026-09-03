import { Link } from "@tanstack/react-router";
import { Menu, ShoppingCart } from "lucide-react";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

import { groupCategories, type CatalogCategory } from "@/lib/catalog";

export type NavCategory = CatalogCategory;

/** Soccer ball glyph used in place of the final letter of the brand name */
export function SoccerBall({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true" fill="none">
      <circle cx="32" cy="32" r="29" fill="currentColor" />
      <circle cx="32" cy="32" r="29" stroke="currentColor" strokeWidth="2" />
      <g fill="var(--sidebar, #1a2b48)">
        <polygon points="32,20 43,28 39,41 25,41 21,28" />
        <polygon points="32,3 40,9 32,16 24,9" transform="translate(0,2)" />
        <polygon points="56,22 61,32 55,40 49,31" />
        <polygon points="8,22 15,31 9,40 3,32" />
        <polygon points="45,52 40,61 32,58 36,48" />
        <polygon points="19,52 28,48 32,58 24,61" />
      </g>
      <g stroke="var(--sidebar, #1a2b48)" strokeWidth="2" strokeLinecap="round">
        <line x1="32" y1="18" x2="32" y2="20" />
        <line x1="43" y1="28" x2="50" y2="31" />
        <line x1="21" y1="28" x2="14" y2="31" />
        <line x1="39" y1="41" x2="42" y2="49" />
        <line x1="25" y1="41" x2="22" y2="49" />
      </g>
    </svg>
  );
}

export function Header({ categories }: { categories: NavCategory[] }) {
  const { count } = useCart();
  const [open, setOpen] = useState(false);

  const groups = groupCategories(categories);

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
            <nav className="mt-4 space-y-1 pb-10">
              {groups.map((g) => (
                <details key={g.name} className="group">
                  <summary className="cursor-pointer list-none rounded px-2 py-1.5 text-sm font-bold text-accent hover:bg-sidebar-accent">
                    {g.name} <span className="text-xs opacity-70">({g.items.length})</span>
                  </summary>
                  <ul className="mt-1 space-y-0.5 pr-2">
                    {g.items.map((c) => (
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
                </details>
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        <Link to="/" className="flex items-center" aria-label="גולאסוס - דף הבית">
          <span className="text-xl font-extrabold tracking-tight">גולאסו</span>
          <SoccerBall className="size-[1.05em] text-xl" />
        </Link>

        <nav className="mx-4 hidden flex-1 items-center gap-5 text-sm font-medium md:flex">
          <Link to="/" className="transition-colors hover:text-accent">
            דף הבית
          </Link>
          <Link to="/categories" className="transition-colors hover:text-accent">
            כל הקטגוריות
          </Link>
          <Link to="/shoes" className="transition-colors hover:text-accent">
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
