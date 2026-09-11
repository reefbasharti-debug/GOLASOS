import { Link, useNavigate } from "@tanstack/react-router";
import {
  ChevronDown,
  Home,
  Footprints,
  Package,
  HelpCircle,
  Facebook,
  Instagram,
  Menu,
  Search,
  PackageSearch,
  ShoppingCart,
  Twitter,
  User,
  Youtube,
  MessageCircle,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { useCart } from "@/lib/cart";
import { useLang } from "@/lib/i18n";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import type { CatalogCategory, CatalogGroupMeta } from "@/lib/catalog";
import { MarqueeBar } from "@/components/MarqueeBar";

export type NavCategory = CatalogCategory;

/** Soccer ball glyph used in place of the final letter of the brand name */
export function SoccerBall({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden="true" fill="none">
      <circle cx="32" cy="32" r="29" fill="currentColor" />
      <circle cx="32" cy="32" r="29" stroke="currentColor" strokeWidth="2" />
      <g fill="var(--background, #fff)">
        <polygon points="32,20 43,28 39,41 25,41 21,28" />
        <polygon points="32,3 40,9 32,16 24,9" transform="translate(0,2)" />
        <polygon points="56,22 61,32 55,40 49,31" />
        <polygon points="8,22 15,31 9,40 3,32" />
        <polygon points="45,52 40,61 32,58 36,48" />
        <polygon points="19,52 28,48 32,58 24,61" />
      </g>
      <g stroke="var(--background, #fff)" strokeWidth="2" strokeLinecap="round">
        <line x1="32" y1="18" x2="32" y2="20" />
        <line x1="43" y1="28" x2="50" y2="31" />
        <line x1="21" y1="28" x2="14" y2="31" />
        <line x1="39" y1="41" x2="42" y2="49" />
        <line x1="25" y1="41" x2="22" y2="49" />
      </g>
    </svg>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`flex flex-col items-center leading-none ${className}`} aria-label="גולאסוס - דף הבית">
      <span className="flex items-center gap-0 text-navy font-display text-3xl font-extrabold tracking-tight">
        <span>גולא</span>
        <SoccerBall className="size-[0.68em] text-navy" aria-hidden="true" />
        <span>וס</span>
      </span>
    </Link>
  );
}

/** Audience entries that open the faceted catalog. */
const PRIMARY_NAV = [
  { label: "גברים", search: { audience: "men" } },
  { label: "ילדים", search: { audience: "kids" } },
  { label: "נשים", search: { audience: "women" } },
] as const;

export function Header({
  settings,
}: {
  categories?: NavCategory[];
  groups?: CatalogGroupMeta[];
  settings: Record<string, string>;
}) {
  const { count } = useCart();
  const { t, lang, setLang } = useLang();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    if (term) navigate({ to: "/browse", search: { q: term } });
  };

  const social = [
    { href: settings["instagram"], Icon: Instagram, label: "Instagram" },
    { href: settings["twitter"], Icon: Twitter, label: "X" },
    { href: settings["facebook"], Icon: Facebook, label: "Facebook" },
    {
      href: settings["whatsapp"] ? `https://wa.me/${settings["whatsapp"].replace(/\D/g, "")}` : "",
      Icon: MessageCircle,
      label: "WhatsApp",
    },
    { href: settings["youtube"], Icon: Youtube, label: "YouTube" },
  ];

  return (
    <header className="bg-background">
      <MarqueeBar />

      {/* Utility bar */}
      <div>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2 text-xs">
          <div className="flex items-center gap-4">
            <Link to="/tracking" className="focus-key rounded px-1 hover:text-accent-foreground hover:underline">
              {t("tracking")}
            </Link>
            <button
              onClick={() => setLang(lang === "he" ? "en" : "he")}
              className="flex items-center gap-1 font-semibold"
              aria-label="language"
            >
              {lang === "he" ? "עברית" : "English"} <ChevronDown className="size-3" />
              <span className="sr-only">{t("lang_switch")}</span>
            </button>
          </div>
          <div className="flex items-center gap-3 text-foreground/80">
            {social.map(({ href, Icon, label }) => (
              <a
                key={label}
                href={href || "#"}
                target={href ? "_blank" : undefined}
                rel="noreferrer"
                aria-label={label}
                className="hover:text-foreground"
              >
                <Icon className="size-4" />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Main row: logo / search / account+cart */}
      <div className="mx-auto grid max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-4 px-4 py-5 md:gap-8">
        <div className="flex items-center gap-2">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger className="focus-key rounded-md p-2 hover:bg-secondary lg:hidden" aria-label={t("menu")}>
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent side={lang === "he" ? "right" : "left"} className="w-80 overflow-y-auto">
              <SheetTitle>{t("menu")}</SheetTitle>
              <nav className="mt-4 space-y-2 pb-6">
                <Link to="/" onClick={() => setOpen(false)} className="nav-key flex items-center gap-2 text-sm">
                  <Home className="size-4" /> {t("home")}
                </Link>
                {PRIMARY_NAV.map((item) => (
                  <Link
                    key={item.label}
                    to="/browse"
                    search={item.search}
                    onClick={() => setOpen(false)}
                    className="nav-key flex items-center gap-2 text-sm"
                  >
                    {item.label}
                  </Link>
                ))}
                <Link
                  to="/mystery-box"
                  onClick={() => setOpen(false)}
                  className="mystery-glow flex items-center gap-2 rounded-full bg-gold px-3 py-2 text-sm font-extrabold text-navy"
                >
                  <span className="relative">
                    <Package className="size-4" />
                    <HelpCircle className="absolute -bottom-1 -end-1 size-2.5 text-navy" />
                  </span>
                  {t("mystery_box")}
                </Link>
                <Link to="/shoes" onClick={() => setOpen(false)} className="nav-key flex items-center gap-2 text-sm">
                  <Footprints className="size-4" /> {t("shoes")}
                </Link>
                <Link
                  to="/browse"
                  search={{ sport: "basketball" }}
                  onClick={() => setOpen(false)}
                  className="nav-key flex items-center gap-2 text-sm"
                >
                  NBA
                </Link>
              </nav>
              <div className="mt-2 space-y-2">
                <Link
                  to="/account"
                  onClick={() => setOpen(false)}
                  className="btn-critical-sm focus-key flex w-full items-center justify-center gap-2"
                >
                  <User className="size-4" />
                  האזור האישי
                </Link>
                <Link
                  to="/affiliate"
                  onClick={() => setOpen(false)}
                  className="focus-key flex w-full items-center justify-center rounded-md border px-4 py-2 text-sm font-bold"
                >
                  חבר מביא חבר
                </Link>
              </div>
            </SheetContent>
          </Sheet>
          <Logo />
        </div>

        <form onSubmit={onSearch} className="mx-auto flex w-full max-w-xl items-center">
          <div className="flex w-full items-center rounded-full border-2 border-primary bg-background ps-5 pe-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("search_placeholder")}
              className="h-10 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              aria-label={t("search_placeholder")}
            />
            <button
              type="submit"
              className="focus-key grid size-9 place-items-center rounded-full text-primary hover:bg-secondary"
              aria-label="search"
            >
              <Search className="size-5" />
            </button>
          </div>
        </form>

        <div className="flex items-center gap-5">
          <Link
            to="/tracking"
            className="focus-key hidden items-center gap-1.5 rounded px-1 text-xs font-medium hover:underline md:flex"
          >
            <PackageSearch className="size-4" />
            פרטי ההזמנה
          </Link>
          <Link
            to="/account"
            className="focus-key hidden items-center gap-1.5 rounded px-1 text-xs font-medium hover:underline md:flex"
          >
            <User className="size-4" />
            האזור האישי
          </Link>
          <Link to="/cart" className="focus-key relative rounded-md p-1" aria-label={t("cart")}>
            <ShoppingCart className="size-6" />
            <span className="absolute -top-2 -end-2 grid size-4.5 min-w-4.5 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">
              {count}
            </span>
          </Link>
        </div>
      </div>

      {/* Nav row */}
      <div className="border-y">
        <nav className="mx-auto hidden max-w-7xl flex-wrap items-center justify-center gap-x-6 gap-y-2 px-4 py-2 text-sm font-bold lg:flex">
          {PRIMARY_NAV.map((item) => (
            <Link key={item.label} to="/browse" search={item.search} className="nav-key my-1 flex items-center gap-1.5">
              {item.label}
            </Link>
          ))}

          <Link
            to="/mystery-box"
            className="mystery-glow my-1 flex items-center gap-2 rounded-full bg-gold px-4 py-2 text-sm font-extrabold text-navy"
          >
            <span className="relative">
              <Package className="size-4" />
              <HelpCircle className="absolute -bottom-1 -end-1 size-2.5 text-navy" />
            </span>
            {t("mystery_box")}
          </Link>

          <Link to="/shoes" className="nav-key my-1 flex items-center gap-1.5">
            <Footprints className="size-3.5" />
            {t("shoes")}
          </Link>

          <Link to="/browse" search={{ sport: "basketball" }} className="nav-key my-1">
            NBA
          </Link>
        </nav>
      </div>
    </header>
  );
}
