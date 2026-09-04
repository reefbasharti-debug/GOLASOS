import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { ProductCard } from "@/components/ProductCard";
import { getCategoryPage } from "@/lib/store.functions";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/category/$slug")({
  loader: async ({ params }) => {
    const data = await getCategoryPage({ data: { slug: params.slug } });
    if (!data.category) throw notFound();
    return data;
  },
  head: ({ loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "הקטגוריה לא נמצאה | גולאסוס" }, { name: "robots", content: "noindex" }] };
    }
    const title = `${loaderData.category!.name} | גולאסוס`;
    const description = `${loaderData.products.length} מוצרים בקטגוריה ${loaderData.category!.name} — הזמנה ישירה באתר גולאסוס.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
      ],
    };
  },
  component: CategoryPage,
  notFoundComponent: () => (
    <div className="mx-auto max-w-3xl px-4 py-20 text-center">
      <h1 className="text-2xl font-bold">הקטגוריה לא נמצאה</h1>
      <Link to="/categories" className="mt-4 inline-block font-semibold text-muted-foreground">
        חזרה לכל הקטגוריות
      </Link>
    </div>
  ),
});

type Sort = "newest" | "oldest" | "name";

function CategoryPage() {
  const { category, products, siblings } = Route.useLoaderData();
  const { t } = useLang();
  const [sort, setSort] = useState<Sort>("newest");
  const [size, setSize] = useState("");
  const [refineOpen, setRefineOpen] = useState(false);

  const sizes = useMemo(() => [...new Set(products.flatMap((p) => p.sizes))], [products]);

  const list = useMemo(() => {
    let out = size ? products.filter((p) => p.sizes.includes(size)) : [...products];
    if (sort === "name") out.sort((a, b) => a.name.localeCompare(b.name, "he"));
    else if (sort === "newest") out.sort((a, b) => b.created_at.localeCompare(a.created_at));
    else out.sort((a, b) => a.created_at.localeCompare(b.created_at));
    return out;
  }, [products, sort, size]);

  const c = category!;

  return (
    <div className="mx-auto max-w-7xl px-4 py-4">
      <nav className="text-sm text-muted-foreground">
        <Link to="/" className="hover:underline">{t("home")}</Link>
        {c.group_name ? (
          <>
            {" > "}
            <Link to="/categories" hash={`g-${encodeURIComponent(c.group_name)}`} className="hover:underline">
              {c.group_name}
            </Link>
          </>
        ) : null}
        {" > "}
        <span className="text-foreground">{c.name}</span>
      </nav>

      <h1 className="mt-4 flex items-center justify-center gap-3 text-center text-2xl font-bold md:text-3xl">
        {c.logo_url ? <img src={c.logo_url} alt={`סמל ${c.name}`} className="h-12 w-12 object-contain" /> : null}
        {c.name} ({products.length})
      </h1>
      {c.description ? <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-muted-foreground">{c.description}</p> : null}

      {siblings.length > 1 ? (
        <ul className="mx-auto mt-6 flex max-w-6xl flex-wrap justify-center gap-x-7 gap-y-4 text-sm">
          {siblings.map((s) => (
            <li key={s.slug}>
              <Link
                to="/category/$slug"
                params={{ slug: s.slug }}
                className={`underline underline-offset-4 hover:text-primary ${s.slug === c.slug ? "font-bold text-primary" : "text-foreground/70"}`}
              >
                {s.name}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-8 flex items-center justify-between border-b pb-3">
        <div className="relative">
          <button
            onClick={() => setRefineOpen((v) => !v)}
            className="flex items-center gap-2 border px-4 py-2 text-sm hover:bg-secondary"
          >
            {t("refine")} <SlidersHorizontal className="size-4" />
          </button>
          {refineOpen ? (
            <div className="absolute start-0 top-full z-20 mt-1 w-64 border bg-popover p-3 shadow-elevated">
              <p className="mb-2 text-xs font-bold">{t("size")}</p>
              <div className="flex flex-wrap gap-1.5">
                <button onClick={() => setSize("")} className={`rounded border px-2 py-1 text-xs ${size === "" ? "bg-primary text-primary-foreground" : ""}`}>
                  {t("all_sizes")}
                </button>
                {sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={`rounded border px-2 py-1 text-xs ${size === s ? "bg-primary text-primary-foreground" : ""}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
        <label className="flex items-center gap-2 border px-3 py-1.5 text-sm">
          <span className="sr-only">{t("sort_by")}</span>
          <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} className="bg-transparent text-sm outline-none">
            <option value="newest">{t("sort_by")}: {t("sort_newest")}</option>
            <option value="oldest">{t("sort_oldest")}</option>
            <option value="name">{t("sort_name")}</option>
          </select>
        </label>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-4">
        {list.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
      {list.length === 0 ? <p className="mt-10 text-center text-muted-foreground">{t("no_products")}</p> : null}
    </div>
  );
}
