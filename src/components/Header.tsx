import { Link, useNavigate } from "@tanstack/react-router";
import { ChevronDown, Home, Footprints, Star, Package, HelpCircle, Facebook, Instagram, Menu, Search, ShoppingCart, Twitter, User, Youtube, X, MessageCircle } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useCart } from "@/lib/cart";
import { useLang } from "@/lib/i18n";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { groupCategories, type CatalogCategory, type CatalogGroupMeta } from "@/lib/catalog";

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
        <span>סוס</span>
      </span>
    </Link>
  );
}

const MAIN_NAV_LIMIT = 7;
const SPECIAL_GROUP_NAME = "קולקציות מיוחדות";

export function Header({
  categories,
  groups: groupMeta,
  settings,
}: {
  categories: NavCategory[];
  groups: CatalogGroupMeta[];
  settings: Record<string, string>;
}) {
  const { count } = useCart();
  const { t, lang, setLang } = useLang();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [announceOpen, setAnnounceOpen] = useState(true);
  const [q, setQ] = useState("");

  const groups = groupCategories(categories, groupMeta);
  const jerseyGroups = groups.filter((g) => g.kind !== "shoes");
  const specialGroup = groups.find((g) => g.name === SPECIAL_GROUP_NAME);
  const mainNav = jerseyGroups.filter((g) => g.name !== SPECIAL_GROUP_NAME).slice(0, MAIN_NAV_LIMIT);

  const onSearch = (e: FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    if (term) navigate({ to: "/search", search: { q: term } });
  };

  const social = [
    { href: settings["instagram"], Icon: Instagram, label: "Instagram" },
    { href: settings["twitter"], Icon: Twitter, label: "X" },
    { href: settings["facebook"], Icon: Facebook, label: "Facebook" },
    { href: settings["whatsapp"] ? `https://wa.me/${settings["whatsapp"].replace(/\D/g, "")}` : "", Icon: MessageCircle, label: "WhatsApp" },
    { href: settings["youtube"], Icon: Youtube, label: "YouTube" },
  ];

  return (
    <header className="bg-background">
      {/* Announcement bar */}
      {announceOpen ? (
        <div className="announce relative bg-primary text-center text-xs font-bold text-primary-foreground">
          <Link to="/categories" className="block px-10 py-2.5 tracking-wide">
            {settings["announcement"] || t("announcement")}
          </Link>
          <button
            onClick={() => setAnnounceOpen(false)}
            className="absolute end-3 top-1/2 grid size-5 -translate-y-1/2 place-items-center rounded-full bg-background/90 text-primary"
            aria-label="close"
          >
            <X className="size-3" />
          </button>
        </div>
      ) : null}

      {/* Utility bar */}
      <div className="border-b">
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
              <SheetTitle>{t("all_categories")}</SheetTitle>
              <nav className="mt-4 space-y-1 pb-10">
                <div className="mb-3 flex flex-wrap gap-2">
                  <Link to="/" onClick={() => setOpen(false)} className="nav-key gap-1.5 text-sm">
                    <Home className="size-4" /> {t("home")}
                  </Link>
                  <Link to="/shoes" onClick={() => setOpen(false)} className="nav-key gap-1.5 text-sm">
                    <Footprints className="size-4" /> {t("shoes")}
                  </Link>
                </div>
                {groups.map((g) => (

                  <details key={g.name} className="group">
                    <summary className="flex cursor-pointer list-none items-center gap-2 rounded px-2 py-1.5 text-sm font-bold hover:bg-secondary">
                      {g.image_url ? <img src={g.image_url} alt="" className="size-5 object-contain" /> : null}
                      {g.name} <span className="text-xs opacity-70">({g.items.length})</span>
                    </summary>
                    <ul className="mt-1 space-y-0.5 ps-4">
                      {g.name === SPECIAL_GROUP_NAME ? (
                        <li>
                          <Link
                            to="/mystery-box"
                            onClick={() => setOpen(false)}
                            className="mystery-glow mb-2 flex items-center gap-2 rounded-lg border border-gold/60 bg-navy px-2 py-2 text-sm font-extrabold text-white"
                          >
                            <span className="relative">
                              <Package className="size-4" />
                              <HelpCircle className="absolute -bottom-1 -end-1 size-2.5 text-gold" />
                            </span>
                            {t("mystery_box")}
                          </Link>
                        </li>
                      ) : null}
                      {g.items.map((c) => (
                        <li key={c.slug}>
                          <Link
                            to="/category/$slug"
                            params={{ slug: c.slug }}
                            onClick={() => setOpen(false)}
                            className="block rounded px-2 py-1.5 text-sm hover:bg-secondary"
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
            <button type="submit" className="focus-key grid size-9 place-items-center rounded-full text-primary hover:bg-secondary" aria-label="search">
              <Search className="size-5" />
            </button>
          </div>
        </form>

        <div className="flex items-center gap-5">
          <Link to="/auth" className="focus-key hidden items-center gap-1.5 rounded px-1 text-xs font-medium hover:underline md:flex">
            <User className="size-4" />
            {t("sign_in")}
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
      <div className="mx-auto hidden max-w-7xl items-stretch px-4 lg:flex">
        <div className="group relative w-56 shrink-0">
          <button className="focus-key flex h-12 w-full items-center justify-between bg-primary px-4 text-sm font-bold uppercase text-primary-foreground">
            {t("all_categories")}
            <Menu className="size-5" />
          </button>
          <div className="invisible absolute start-0 top-full z-40 w-56 border bg-popover opacity-0 shadow-elevated transition-opacity group-hover:visible group-hover:opacity-100">
            <ul className="max-h-[70vh] overflow-y-auto py-1">
              {groups.map((g) => (
                <li key={g.name} className="group/item relative">
                  <Link
                    to="/categories"
                    hash={`g-${encodeURIComponent(g.name)}`}
                    className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-secondary"
                  >
                    {g.image_url ? <img src={g.image_url} alt="" className="size-5 object-contain" /> : <span className="size-5" />}
                    <span className="flex-1">{g.name}</span>
                    <ChevronDown className="size-3 -rotate-90 rtl:rotate-90" />
                  </Link>
                  <div className="absolute start-full top-0 z-50 hidden w-[36rem] border bg-popover p-4 shadow-elevated group-hover/item:block">
                    <p className="mb-2 text-sm font-bold">{g.name}</p>
                    <div className="grid grid-cols-3 gap-x-4 gap-y-1">
                      {g.items.slice(0, 36).map((c) => (
                        <Link
                          key={c.slug}
                          to="/category/$slug"
                          params={{ slug: c.slug }}
                          className="flex items-center gap-1.5 truncate py-0.5 text-xs hover:text-primary hover:underline"
                        >
                          {c.logo_url ? <img src={c.logo_url} alt="" className="size-4 object-contain" /> : null}
                          {c.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <nav className="flex flex-1 flex-wrap items-center gap-x-6 ps-6 text-sm font-bold">
          <Link to="/" className="nav-key my-1.5 flex items-center gap-1.5">
            <Home className="size-3.5" />
            {t("home")}
          </Link>

          <Link to="/shoes" className="nav-key my-1.5 flex items-center gap-1.5">
            <Footprints className="size-3.5" />
            {t("shoes")}
          </Link>

          {specialGroup ? (
            <div key={specialGroup.name} className="group relative py-3">
              <Link
                to="/categories"
                hash={`g-${encodeURIComponent(specialGroup.name)}`}
                className="nav-key -my-1.5 flex items-center gap-1"
              >
                <Star className="size-3.5" />
                {specialGroup.name} <ChevronDown className="size-3.5" />
              </Link>
              <div className="absolute start-0 top-full z-40 hidden w-[34rem] border bg-popover p-4 shadow-elevated group-hover:block">
                <Link
                  to="/mystery-box"
                  className="mystery-glow mb-3 flex items-center justify-center gap-2 rounded-lg bg-navy px-4 py-2.5 text-sm font-extrabold text-white"
                >
                  <span className="relative">
                    <Package className="size-4" />
                    <HelpCircle className="absolute -bottom-1 -end-1 size-2.5 text-gold" />
                  </span>
                  {t("mystery_box")}
                </Link>
                <div className="grid grid-cols-3 gap-x-4 gap-y-1">
                  {specialGroup.items.slice(0, 30).map((c) => (
                    <Link
                      key={c.slug}
                      to="/category/$slug"
                      params={{ slug: c.slug }}
                      className="flex items-center gap-1.5 truncate py-0.5 text-xs font-medium hover:text-primary hover:underline"
                    >
                      {c.logo_url ? <img src={c.logo_url} alt="" className="size-4 object-contain" /> : null}
                      {c.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {mainNav.map((g) => (
            <div key={g.name} className="group relative py-3">
              <Link
                to="/categories"
                hash={`g-${encodeURIComponent(g.name)}`}
                className="flex items-center gap-1 hover:text-primary/70"
              >
                {g.name} <ChevronDown className="size-3.5" />
              </Link>
              <div className="absolute start-0 top-full z-40 hidden w-[34rem] border bg-popover p-4 shadow-elevated group-hover:block">
                <div className="grid grid-cols-3 gap-x-4 gap-y-1">
                  {g.items.slice(0, 30).map((c) => (
                    <Link
                      key={c.slug}
                      to="/category/$slug"
                      params={{ slug: c.slug }}
                      className="flex items-center gap-1.5 truncate py-0.5 text-xs font-medium hover:text-primary hover:underline"
                    >
                      {c.logo_url ? <img src={c.logo_url} alt="" className="size-4 object-contain" /> : null}
                      {c.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </nav>
      </div>
    </header>
  );
}
