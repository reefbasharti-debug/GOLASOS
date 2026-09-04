import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { ProductCard } from "@/components/ProductCard";
import { searchCatalog } from "@/lib/store.functions";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/search")({
  validateSearch: (s: Record<string, unknown>) => z.object({ q: z.string().max(80).catch("") }).parse(s),
  loaderDeps: ({ search }) => ({ q: search.q }),
  loader: ({ deps }) => searchCatalog({ data: { q: deps.q } }),
  head: () => ({
    meta: [
      { title: "חיפוש מוצרים | גולאסוס" },
      { name: "description", content: "חיפוש חולצות כדורגל, קבוצות, נבחרות ונעלי כדורגל באתר גולאסוס." },
      { property: "og:title", content: "חיפוש מוצרים | גולאסוס" },
      { property: "og:description", content: "חיפוש בקטלוג גולאסוס." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: SearchPage,
});

function SearchPage() {
  const { q } = Route.useSearch();
  const { products, categories } = Route.useLoaderData();
  const { t } = useLang();

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="text-2xl font-bold">
        {t("search_results")}: “{q}” ({products.length})
      </h1>

      {categories.length > 0 ? (
        <ul className="mt-4 flex flex-wrap gap-2">
          {categories.map((c) => (
            <li key={c.slug}>
              <Link to="/category/$slug" params={{ slug: c.slug }} className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm hover:bg-secondary">
                {c.logo_url ? <img src={c.logo_url} alt="" className="size-4 object-contain" /> : null}
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-4 lg:grid-cols-5">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
      {products.length === 0 && categories.length === 0 ? <p className="mt-10 text-center text-muted-foreground">{t("no_results")}</p> : null}
    </div>
  );
}
