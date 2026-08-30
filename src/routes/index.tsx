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
  const { categories, featured, settings } = rootApi.useLoaderData();
  const clubs = categories.filter((c) => c.kind === "club").slice(0, 12);
  const others = categories.filter((c) => c.kind !== "club");

  return (
    <div>
      <section className="surface-navy">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 py-14 md:grid-cols-2 md:py-20">
          <div>
            <span className="inline-block rounded-full surface-gold px-3 py-1 text-xs font-bold">
              משלוח לכל הארץ
            </span>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight md:text-5xl">
              {settings["hero_title"] ?? "חולצות ונעלי כדורגל של כל הקבוצות"}
            </h1>
            <p className="mt-4 max-w-lg text-sm opacity-85 md:text-base">
              {settings["hero_subtitle"] ??
                "קטלוג ענק של חולצות מועדונים ונבחרות, כולל דגמי רטרו ונעלי כדורגל מקצועיות."}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                to="/categories"
                className="rounded-md surface-gold px-6 py-3 text-sm font-bold shadow-md transition-transform hover:scale-[1.03]"
              >
                לקטלוג המלא
              </Link>
              <Link
                to="/category/$slug"
                params={{ slug: "football-boots" }}
                className="rounded-md border border-white/30 px-6 py-3 text-sm font-bold transition-colors hover:bg-white/10"
              >
                נעלי כדורגל
              </Link>
            </div>
            <div className="mt-8 flex gap-6 text-sm">
              <div>
                <p className="text-2xl font-extrabold text-accent">65 ₪</p>
                <p className="opacity-75">כל החולצות</p>
              </div>
              <div>
                <p className="text-2xl font-extrabold text-accent">350 ₪</p>
                <p className="opacity-75">כל הנעליים</p>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {featured.slice(0, 4).map((p) => (
              <Link
                key={p.id}
                to="/product/$id"
                params={{ id: p.id }}
                className="overflow-hidden rounded-lg bg-white/10"
              >
                {p.image_url ? (
                  <img
                    src={imageUrl(p.image_url)}
                    alt={p.name}
                    className="aspect-square w-full object-cover"
                  />
                ) : null}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12">
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
