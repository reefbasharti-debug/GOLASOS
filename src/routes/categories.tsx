import { createFileRoute, Link, getRouteApi } from "@tanstack/react-router";
import { imageUrl } from "@/lib/img";
import { groupCategories } from "@/lib/catalog";

const rootApi = getRouteApi("__root__");

export const Route = createFileRoute("/categories")({
  head: () => ({
    meta: [
      { title: "כל הקטגוריות | גולאסוס" },
      {
        name: "description",
        content: "קטגוריות חולצות כדורגל לפי ליגות, קבוצות, נבחרות, דגמי רטרו ונעלי כדורגל.",
      },
      { property: "og:title", content: "כל הקטגוריות | גולאסוס" },
      { property: "og:description", content: "בחרו ליגה, קבוצה, נבחרת או נעליים והזמינו ישירות באתר." },
    ],
  }),
  component: CategoriesPage,
});

function CategoriesPage() {
  const { categories } = rootApi.useLoaderData();
  const groups = groupCategories(categories);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="text-2xl font-bold">כל הקטגוריות</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {categories.length} קטגוריות ב-{groups.length} ליגות וקולקציות.
      </p>

      <nav className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
        {groups.map((g) => (
          <a key={g.name} href={`#g-${encodeURIComponent(g.name)}`} className="rounded-full border px-3 py-1 hover:bg-secondary">
            {g.name}
          </a>
        ))}
      </nav>

      {groups.map((g) => (
        <section key={g.name} id={`g-${encodeURIComponent(g.name)}`} className="mt-10 scroll-mt-20">
          <h2 className="mb-3 text-lg font-bold">{g.name}</h2>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
            {g.items.map((c) => (
              <Link
                key={c.slug}
                to="/category/$slug"
                params={{ slug: c.slug }}
                className="card-hover overflow-hidden rounded-lg border bg-card text-center"
              >
                <div className="aspect-square bg-muted">
                  {c.image_url ? (
                    <img
                      src={imageUrl(c.image_url)}
                      alt={c.name}
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                </div>
                <p className="line-clamp-2 p-1.5 text-xs font-semibold leading-4">{c.name}</p>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
