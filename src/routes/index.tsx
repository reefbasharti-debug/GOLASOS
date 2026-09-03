import { createFileRoute, Link, getRouteApi } from "@tanstack/react-router";
import { ProductCard } from "@/components/ProductCard";
import { imageUrl } from "@/lib/img";
import { groupCategories } from "@/lib/catalog";

const rootApi = getRouteApi("__root__");

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "גולאסוס | חולצות כדורגל ונעליים במשלוח לכל הארץ" },
      {
        name: "description",
        content:
          "אלפי חולצות כדורגל של כל הקבוצות והנבחרות ב-65 ₪ ואלפי דגמי נעלי כדורגל ב-350 ₪. הזמנה מהירה באתר.",
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

const PER_GROUP = 8;

function Index() {
  const { categories, featured, settings } = rootApi.useLoaderData();
  const jerseyGroups = groupCategories(categories.filter((c) => c.kind !== "shoes"));
  const shoeGroups = groupCategories(categories.filter((c) => c.kind === "shoes"));
  const shoes = shoeGroups.flatMap((g) => g.items);

  return (
    <div className="mx-auto max-w-7xl px-4 py-6">
      <h1 className="sr-only">גולאסוס - חולצות ונעלי כדורגל</h1>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border bg-card px-4 py-3 text-sm">
        <span className="font-bold">
          חולצות <span className="text-primary">{settings["jersey_price"] ?? "65"} ₪</span>
        </span>
        <span className="font-bold">
          נעליים <span className="text-primary">{settings["shoe_price"] ?? "350"} ₪</span>
        </span>
        <span className="text-muted-foreground">משלוח לכל הארץ</span>
        <nav className="mr-auto flex flex-wrap gap-2 text-xs font-semibold">
          {jerseyGroups.map((g) => (
            <a key={g.name} href={`#g-${encodeURIComponent(g.name)}`} className="rounded-full border px-2.5 py-1 hover:bg-secondary">
              {g.name}
            </a>
          ))}
          <a href="#shoes" className="rounded-full surface-gold px-2.5 py-1">
            נעלי כדורגל
          </a>
        </nav>
      </div>

      {jerseyGroups.map((g) => (
        <section key={g.name} id={`g-${encodeURIComponent(g.name)}`} className="mt-8 scroll-mt-20">
          <div className="mb-3 flex items-end justify-between">
            <h2 className="text-lg font-bold">{g.name}</h2>
            {g.items.length > PER_GROUP ? (
              <Link
                to="/categories"
                hash={`g-${encodeURIComponent(g.name)}`}
                className="text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                כל {g.items.length} הקבוצות
              </Link>
            ) : null}
          </div>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8">
            {g.items.slice(0, PER_GROUP).map((c) => (
              <CategoryTile key={c.slug} slug={c.slug} name={c.name} image={c.image_url} />
            ))}
          </div>
        </section>
      ))}

      {shoes.length > 0 ? (
        <section id="shoes" className="mt-8 scroll-mt-20">
          <div className="mb-3 flex items-end justify-between">
            <h2 className="text-lg font-bold">נעלי כדורגל</h2>
            <Link to="/shoes" className="text-xs font-semibold text-muted-foreground hover:text-foreground">
              כל {shoes.length} הסדרות
            </Link>
          </div>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-8">
            {shoes.slice(0, 16).map((c) => (
              <CategoryTile key={c.slug} slug={c.slug} name={c.name} image={c.image_url} />
            ))}
          </div>
        </section>
      ) : null}

      {featured.length > 0 ? (
        <section className="mt-10">
          <h2 className="mb-3 text-lg font-bold">מוצרים נבחרים</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function CategoryTile({ slug, name, image }: { slug: string; name: string; image: string | null }) {
  return (
    <Link
      to="/category/$slug"
      params={{ slug }}
      className="card-hover overflow-hidden rounded-lg border bg-card text-center"
    >
      <div className="aspect-square bg-muted">
        {image ? (
          <img src={imageUrl(image)} alt={name} loading="lazy" className="h-full w-full object-cover" />
        ) : null}
      </div>
      <p className="line-clamp-2 px-1 py-1.5 text-xs font-semibold leading-4">{name}</p>
    </Link>
  );
}
