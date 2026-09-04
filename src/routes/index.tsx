import { createFileRoute, Link, getRouteApi } from "@tanstack/react-router";
import { useState } from "react";
import { Package } from "lucide-react";

import { ProductCard, type ProductCardData } from "@/components/ProductCard";
import { CategoryTile, GroupBadge } from "@/components/CategoryTile";
import { DEFAULT_SLIDES, HeroSlider } from "@/components/HeroSlider";
import { groupCategories } from "@/lib/catalog";
import { getHomeData } from "@/lib/store.functions";
import { useLang, type TKey } from "@/lib/i18n";

const rootApi = getRouteApi("__root__");

export const Route = createFileRoute("/")({
  loader: () => getHomeData(),
  head: () => ({
    meta: [
      { title: "גולאסוס | חולצות כדורגל ונעליים במשלוח לכל הארץ" },
      {
        name: "description",
        content:
          "אלפי חולצות כדורגל של כל הקבוצות והנבחרות ב-65 ₪ ואלפי דגמי נעלי כדורגל מ-300 ₪. הזמנה מהירה באתר.",
      },
      { property: "og:title", content: "גולאסוס | חולצות כדורגל ונעליים" },
      {
        property: "og:description",
        content: "חולצות כדורגל ב-65 ₪ ונעלי כדורגל מ-300 ₪ — הזמנה ישירה באתר.",
      },
    ],
  }),
  component: Index,
});

type Tab = { key: TKey; items: ProductCardData[]; to: string };

function TabbedProducts({ tabs }: { tabs: Tab[] }) {
  const { t } = useLang();
  const [active, setActive] = useState(0);
  const visible = tabs.filter((tb) => tb.items.length > 0);
  if (visible.length === 0) return null;
  const cur = visible[Math.min(active, visible.length - 1)]!;

  return (
    <section className="mt-12">
      <div className="flex flex-wrap justify-center gap-x-10 gap-y-2 text-2xl font-light md:text-3xl">
        {visible.map((tb, i) => (
          <button
            key={tb.key}
            onClick={() => setActive(i)}
            className={`border-b-2 pb-1 transition-colors ${
              i === active ? "border-foreground text-foreground" : "border-transparent text-foreground/80 hover:text-foreground"
            }`}
          >
            {t(tb.key)}
          </button>
        ))}
        <Link
          to="/mystery-box"
          className="btn-critical-sm focus-key inline-flex items-center gap-2 rounded-full px-5 py-1.5 text-base font-semibold md:text-lg"
        >
          <Package className="size-4" aria-hidden />
          {t("mystery_box")}
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
        {cur.items.slice(0, 15).map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
      <div className="mt-6 text-center">
        <Link to={cur.to} className="inline-block border border-foreground px-8 py-2 text-sm font-semibold hover:bg-foreground hover:text-background">
          {t("view_all")}
        </Link>
      </div>
    </section>
  );
}

function Index() {
  const { categories, groups: groupMeta } = rootApi.useLoaderData();
  const home = Route.useLoaderData();
  const { lang, t } = useLang();
  const jerseyGroups = groupCategories(
    categories.filter((c) => c.kind !== "shoes"),
    groupMeta,
  );

  return (
    <div className="mx-auto max-w-7xl px-4">
      <h1 className="sr-only">גולאסוס - חולצות ונעלי כדורגל</h1>

      <HeroSlider slides={DEFAULT_SLIDES[lang]} />

      <TabbedProducts
        tabs={[
          { key: "new_arrivals", items: home.newest, to: "/categories" },
          { key: "national_teams", items: home.national, to: "/categories" },
          { key: "retro", items: home.retro, to: "/categories" },
          { key: "shoes", items: home.shoes, to: "/shoes" },
        ]}
      />

      {/* League tiles with crests */}
      {jerseyGroups.slice(0, 6).map((g) => (
        <section key={g.name} id={`g-${encodeURIComponent(g.name)}`} className="mt-12 scroll-mt-20">
          <div className="mb-4 flex items-center justify-center gap-3 text-2xl font-light md:text-3xl">
            <GroupBadge name={g.name} image={g.image_url} className="h-9 w-9" />
            <h2>{g.name}</h2>
          </div>
          <div className="grid grid-cols-4 gap-3 sm:grid-cols-6 lg:grid-cols-8">
            {g.items.slice(0, 8).map((c) => (
              <CategoryTile key={c.slug} slug={c.slug} name={c.name} image={c.image_url} logo={c.logo_url} />
            ))}
          </div>
          {g.items.length > 8 ? (
            <div className="mt-4 text-center">
              <Link
                to="/categories"
                hash={`g-${encodeURIComponent(g.name)}`}
                className="text-sm font-semibold underline-offset-4 hover:underline"
              >
                {t("view_all")} ({g.items.length})
              </Link>
            </div>
          ) : null}
        </section>
      ))}

      <TabbedProducts tabs={[{ key: "clubs", items: home.club, to: "/categories" }]} />

      <section className="mt-12">
        <h2 className="text-center text-2xl font-light md:text-3xl">{t("football_boots")}</h2>
        <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-5">
          {home.shoes.slice(0, 10).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
        <div className="mt-6 text-center">
          <Link to="/shoes" className="inline-block border border-foreground px-8 py-2 text-sm font-semibold hover:bg-foreground hover:text-background">
            {t("view_all")}
          </Link>
        </div>
      </section>
    </div>
  );
}
