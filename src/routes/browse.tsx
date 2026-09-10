import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { getBrowse } from "@/lib/store.functions";
import { ProductCard } from "@/components/ProductCard";

type Search = {
  audience?: string;
  sport?: string;
  item?: string;
  league?: string;
  team?: string;
  color?: string;
  size?: string;
  min?: number;
  max?: number;
  q?: string;
  sort?: string;
};

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim().slice(0, 120) : undefined);
const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : undefined;
};

const AUDIENCES = [
  { value: "men", label: "גברים" },
  { value: "kids", label: "ילדים" },
  { value: "women", label: "נשים" },
];
const ITEMS = [
  { value: "jersey", label: "חולצה" },
  { value: "kit", label: "סט חולצה + מכנס" },
  { value: "shorts", label: "מכנסיים" },
  { value: "long_sleeve", label: "שרוול ארוך" },
  { value: "sweatshirt", label: "סווטשירט" },
  { value: "jacket", label: "אימונית / ג'קט" },
  { value: "shoes", label: "נעליים" },
];
const SIZES = ["S", "M", "L", "XL", "2XL", "3XL"];
const PRICES = [
  { label: "עד 70 ₪", min: undefined, max: 70 },
  { label: "70–120 ₪", min: 70, max: 120 },
  { label: "120–320 ₪", min: 120, max: 320 },
  { label: "320 ₪ ומעלה", min: 320, max: undefined },
];
const SORTS = [
  { value: "popular", label: "הפופולריים ביותר" },
  { value: "newest", label: "החדשים ביותר" },
  { value: "price_asc", label: "מחיר: מהזול ליוקר" },
  { value: "price_desc", label: "מחיר: מהיוקר לזול" },
];

export const Route = createFileRoute("/browse")({
  validateSearch: (search: Record<string, unknown>): Search => ({
    ...(str(search["audience"]) ? { audience: str(search["audience"])! } : {}),
    ...(str(search["sport"]) ? { sport: str(search["sport"])! } : {}),
    ...(str(search["item"]) ? { item: str(search["item"])! } : {}),
    ...(str(search["league"]) ? { league: str(search["league"])! } : {}),
    ...(str(search["team"]) ? { team: str(search["team"])! } : {}),
    ...(str(search["color"]) ? { color: str(search["color"])! } : {}),
    ...(str(search["size"]) ? { size: str(search["size"])! } : {}),
    ...(num(search["min"]) !== undefined ? { min: num(search["min"])! } : {}),
    ...(num(search["max"]) !== undefined ? { max: num(search["max"])! } : {}),
    ...(str(search["q"]) ? { q: str(search["q"])! } : {}),
    ...(str(search["sort"]) ? { sort: str(search["sort"])! } : {}),
  }),
  loaderDeps: ({ search }) => search,
  loader: ({ deps }) => getBrowse({ data: deps }),
  head: () => ({
    meta: [
      { title: "חיפוש וסינון מוצרים | גולאסוס" },
      {
        name: "description",
        content: "סינון חולצות, סטים, מכנסיים ונעלי כדורגל לפי ליגה, קבוצה, סוג פריט, צבע, מידה ומחיר.",
      },
      { property: "og:title", content: "חיפוש וסינון מוצרים | גולאסוס" },
      { property: "og:description", content: "מצאו בדיוק את הפריט שחיפשתם — לפי ליגה, קבוצה, מידה ומחיר." },
    ],
  }),
  component: BrowsePage,
});

function BrowsePage() {
  const { products, categories } = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = useNavigate();

  const set = (patch: Partial<Search>) =>
    navigate({ to: "/browse", search: { ...search, ...patch } as Search });

  const leagues = Array.from(new Set(categories.map((c) => c.group_name).filter(Boolean))).sort();
  const teams = categories.filter((c) => c.kind !== "shoes");
  const colors = Array.from(
    new Set(products.map((p) => p.color).filter((c): c is string => Boolean(c))),
  ).sort();

  const chip = (active: boolean) =>
    `rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
      active ? "border-navy bg-navy text-white" : "hover:border-navy"
    }`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold md:text-3xl">חיפוש מוצרים</h1>

      <div className="mt-5 space-y-4 rounded-xl border bg-card p-4">
        <div className="flex flex-wrap items-center gap-2">
          <input
            defaultValue={search.q ?? ""}
            onKeyDown={(e) => {
              if (e.key === "Enter") set({ q: (e.target as HTMLInputElement).value || undefined });
            }}
            placeholder="חיפוש חופשי: קבוצה, שחקן, עונה"
            className="h-10 min-w-56 flex-1 rounded-md border px-3 text-sm"
            maxLength={80}
          />
          <select
            value={search.sort ?? "popular"}
            onChange={(e) => set({ sort: e.target.value })}
            className="h-10 rounded-md border px-2 text-sm"
            aria-label="מיון"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <Link to="/browse" search={{}} className="text-xs font-semibold underline">
            איפוס סינון
          </Link>
        </div>

        <Facet label="קהל">
          {AUDIENCES.map((a) => (
            <button
              key={a.value}
              className={chip(search.audience === a.value)}
              onClick={() => set({ audience: search.audience === a.value ? undefined : a.value })}
            >
              {a.label}
            </button>
          ))}
          <button
            className={chip(search.sport === "basketball")}
            onClick={() => set({ sport: search.sport === "basketball" ? undefined : "basketball" })}
          >
            NBA
          </button>
        </Facet>

        <Facet label="סוג הפריט">
          {ITEMS.map((i) => (
            <button
              key={i.value}
              className={chip(search.item === i.value)}
              onClick={() => set({ item: search.item === i.value ? undefined : i.value })}
            >
              {i.label}
            </button>
          ))}
        </Facet>

        <Facet label="מידה">
          {SIZES.map((s) => (
            <button
              key={s}
              className={chip(search.size === s)}
              onClick={() => set({ size: search.size === s ? undefined : s })}
            >
              {s}
            </button>
          ))}
        </Facet>

        <Facet label="טווח מחירים">
          {PRICES.map((p) => (
            <button
              key={p.label}
              className={chip(search.min === p.min && search.max === p.max)}
              onClick={() =>
                set(
                  search.min === p.min && search.max === p.max
                    ? { min: undefined, max: undefined }
                    : { min: p.min, max: p.max },
                )
              }
            >
              {p.label}
            </button>
          ))}
        </Facet>

        {colors.length > 1 ? (
          <Facet label="צבע">
            {colors.slice(0, 16).map((c) => (
              <button
                key={c}
                className={chip(search.color === c)}
                onClick={() => set({ color: search.color === c ? undefined : c })}
              >
                {c}
              </button>
            ))}
          </Facet>
        ) : null}

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-xs font-bold">
            ליגה
            <select
              value={search.league ?? ""}
              onChange={(e) => set({ league: e.target.value || undefined })}
              className="mt-1 h-10 w-full rounded-md border px-2 text-sm font-normal"
            >
              <option value="">כל הליגות</option>
              {leagues.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-bold">
            קבוצה
            <select
              value={search.team ?? ""}
              onChange={(e) => set({ team: e.target.value || undefined })}
              className="mt-1 h-10 w-full rounded-md border px-2 text-sm font-normal"
            >
              <option value="">כל הקבוצות</option>
              {teams.map((c) => (
                <option key={c.slug} value={c.slug}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <p className="mt-6 text-sm text-muted-foreground">{products.length} מוצרים</p>
      {products.length === 0 ? (
        <p className="mt-10 text-center text-muted-foreground">לא נמצאו מוצרים בסינון הזה.</p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function Facet({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-bold">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}
