import { createFileRoute, getRouteApi, Link, useNavigate } from "@tanstack/react-router";
import { fallback, zodValidator } from "@tanstack/zod-adapter";
import { z } from "zod";
import { ProductCard } from "@/components/ProductCard";
import { getShoes } from "@/lib/store.functions";
import { useLang } from "@/lib/i18n";

const rootApi = getRouteApi("__root__");

const searchSchema = z.object({
  model: fallback(z.string(), "").default(""),
  color: fallback(z.string(), "").default(""),
  size: fallback(z.string(), "").default(""),
  tier: fallback(z.string(), "").default(""),
});

export const Route = createFileRoute("/shoes")({
  validateSearch: zodValidator(searchSchema),
  loaderDeps: ({ search }) => ({ model: search.model, color: search.color, size: search.size, tier: search.tier }),
  loader: ({ deps }) =>
    getShoes({
      data: {
        model: deps.model || undefined,
        color: deps.color || undefined,
        size: deps.size || undefined,
        tier: deps.tier || undefined,
      },
    }),
  head: () => ({
    meta: [
      { title: "נעלי כדורגל | גולאסוס" },
      {
        name: "description",
        content: "נעלי כדורגל של נייקי, אדידס, פומה ועוד — סינון לפי דגם, צבע, מידה ורמה. מקצועיות 450 ₪, חצי מקצועיות 400 ₪, רגילות 300 ₪.",
      },
      { property: "og:title", content: "נעלי כדורגל | גולאסוס" },
      { property: "og:description", content: "נעלי כדורגל לפי דגם, צבע, מידה ורמה, עם משלוח לכל הארץ." },
    ],
  }),
  component: ShoesPage,
});

const TIERS = [
  { id: "pro", he: "מקצועית", en: "Professional", price: 450 },
  { id: "semi", he: "חצי מקצועית", en: "Semi-pro", price: 400 },
  { id: "regular", he: "רגילה", en: "Regular", price: 300 },
] as const;

function ShoesPage() {
  const { categories } = rootApi.useLoaderData();
  const { products, colors, sizes, modelCounts } = Route.useLoaderData();
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/shoes" });
  const { lang } = useLang();
  const he = lang === "he";

  const models = categories.filter((c) => c.kind === "shoes" && (modelCounts[c.id] ?? 0) > 0);
  const set = (key: keyof typeof search, value: string) =>
    navigate({ search: (prev) => ({ ...prev, [key]: prev[key] === value ? "" : value }) });
  const active = Object.values(search).some(Boolean);

  const selectCls = "h-10 rounded-md border bg-background px-3 text-sm";

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <nav className="text-sm text-muted-foreground">
        <Link to="/" className="hover:underline">{he ? "דף הבית" : "Home"}</Link> {">"} <span className="text-foreground">{he ? "נעלי כדורגל" : "Football boots"}</span>
      </nav>
      <h1 className="mt-2 text-2xl font-bold">{he ? "נעלי כדורגל" : "Football boots"}</h1>

      {/* Tier cards */}
      <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
        {TIERS.map((t) => (
          <button
            key={t.id}
            onClick={() => set("tier", t.id)}
            className={`rounded-lg border p-3 text-center transition-colors ${search.tier === t.id ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary"}`}
          >
            <p className="text-sm font-bold">{he ? t.he : t.en}</p>
            <p className="text-lg font-extrabold">₪ {t.price}</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="mt-4 flex flex-wrap items-center gap-2 rounded-lg border bg-secondary/60 p-3">
        <select className={selectCls} value={search.model} onChange={(e) => navigate({ search: (p) => ({ ...p, model: e.target.value }) })}>
          <option value="">{he ? "כל הדגמים" : "All models"}</option>
          {models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} ({modelCounts[m.id]})
            </option>
          ))}
        </select>
        <select className={selectCls} value={search.color} onChange={(e) => navigate({ search: (p) => ({ ...p, color: e.target.value }) })}>
          <option value="">{he ? "כל הצבעים" : "All colours"}</option>
          {colors.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select className={selectCls} value={search.size} onChange={(e) => navigate({ search: (p) => ({ ...p, size: e.target.value }) })}>
          <option value="">{he ? "כל המידות" : "All sizes"}</option>
          {sizes.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select className={selectCls} value={search.tier} onChange={(e) => navigate({ search: (p) => ({ ...p, tier: e.target.value }) })}>
          <option value="">{he ? "כל הרמות" : "All levels"}</option>
          {TIERS.map((t) => (
            <option key={t.id} value={t.id}>{he ? t.he : t.en} — ₪{t.price}</option>
          ))}
        </select>
        {active ? (
          <Link to="/shoes" search={{ model: "", color: "", size: "", tier: "" }} className="text-sm font-semibold underline">
            {he ? "נקה סינון" : "Clear"}
          </Link>
        ) : null}
        <span className="ms-auto text-sm text-muted-foreground">
          {products.length} {he ? "דגמים" : "items"}
        </span>
      </div>

      {/* Model tiles when no model chosen */}
      {!search.model ? (
        <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
          {models.map((m) => (
            <button key={m.id} onClick={() => set("model", m.id)} className="shrink-0 rounded-full border px-3 py-1 text-xs font-semibold hover:bg-secondary">
              {m.name}
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-6 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-4 lg:grid-cols-5">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
      {products.length === 0 ? <p className="mt-10 text-center text-muted-foreground">{he ? "לא נמצאו נעליים בסינון הזה." : "No boots match these filters."}</p> : null}
    </div>
  );
}
