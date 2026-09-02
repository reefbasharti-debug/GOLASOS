import { createFileRoute, Link, getRouteApi } from "@tanstack/react-router";
import { ProductCard } from "@/components/ProductCard";
import { imageUrl } from "@/lib/img";

const rootApi = getRouteApi("__root__");

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "גולאסוס | חולצות כדורגל ונעליים במשלוח לכל הארץ" },
      {
        name: "description",
        content:
          "חולצות כדורגל מקוריות בסטייל של כל הקבוצות והנבחרות ב-65 ₪ ונעלי כדורגל ב-350 ₪. הזמנה מהירה באתר.",
      },
      { property: "og:title", content: "גולאסוס | חולצות כדורגל ונעליים" },
      {
        property: "og:description",
        content: "חולצות כדורגל ב-65 ₪ ונעלי כדורגל ב-350 ₪ — הזמנה ישירה באתר.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { categories, featured } = rootApi.useLoaderData();
  const clubs = categories.filter((c) => c.kind === "club").slice(0, 12);
  const others = categories.filter((c) => c.kind !== "club");

  return (
    <div>
      <h1 className="sr-only">גולאסוס - חולצות ונעלי כדורגל</h1>
      <section className="mx-auto max-w-7xl px-4 py-8">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-2xl font-bold">קבוצות מובילות</h2>
          <Link to="/categories" className="text-sm font-semibold text-muted-foreground hover:text-foreground">
            כל הקטגוריות
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {clubs.map((c) => (
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
              <p className="p-2 text-sm font-semibold">{c.name}</p>
            </Link>
          ))}
        </div>
      </section>

      {others.length > 0 ? (
        <section className="bg-secondary py-12">
          <div className="mx-auto max-w-7xl px-4">
            <h2 className="mb-6 text-2xl font-bold">קולקציות נוספות</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {others.map((c) => (
                <Link
                  key={c.slug}
                  to="/category/$slug"
                  params={{ slug: c.slug }}
                  className="card-hover overflow-hidden rounded-lg border bg-card"
                >
                  <div className="aspect-video bg-muted">
                    {c.image_url ? (
                      <img
                        src={imageUrl(c.image_url)}
                        alt={c.name}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    ) : null}
                  </div>
                  <p className="p-3 font-semibold">{c.name}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-7xl px-4 py-12">
        <h2 className="mb-6 text-2xl font-bold">מוצרים נבחרים</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {featured.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  );
}
