import { Link } from "@tanstack/react-router";
import { BadgeCheck, MessageSquareDashed, Shirt } from "lucide-react";
import { imageUrl } from "@/lib/img";
import type { ProductCardData } from "@/components/ProductCard";

export type TopTeam = { slug: string; name: string; logo_url: string | null; image_url: string | null };
export type Testimonial = {
  id: string;
  customer_name: string;
  message: string;
  reply: string | null;
  image_url: string | null;
};

/** The ten biggest clubs and national teams, as crest tiles. */
export function TopTeams({ teams }: { teams: TopTeam[] }) {
  if (teams.length === 0) return null;
  return (
    <section className="mt-14">
      <h2 className="text-center text-2xl font-light md:text-3xl">הקבוצות הפופולריות בעולם</h2>
      <div className="mt-6 grid grid-cols-5 gap-4 sm:gap-6 lg:grid-cols-10">
        {teams.map((team) => (
          <Link
            key={team.slug}
            to="/category/$slug"
            params={{ slug: team.slug }}
            className="focus-key group flex flex-col items-center gap-2"
            title={team.name}
          >
            <span className="grid size-16 place-items-center rounded-full border bg-card p-2 transition-transform group-hover:scale-105 sm:size-20">
              <img
                src={imageUrl(team.logo_url || team.image_url)}
                alt={team.name}
                loading="lazy"
                className="h-full w-full object-contain"
              />
            </span>
            <span className="text-center text-[11px] font-semibold leading-tight sm:text-xs">{team.name}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

/** Bestsellers strip that scrolls itself from right to left. */
export function BestsellersStrip({ products }: { products: ProductCardData[] }) {
  if (products.length === 0) return null;
  const row = (
    <div className="flex shrink-0 gap-4">
      {products.map((p) => (
        <Link
          key={p.id}
          to="/product/$id"
          params={{ id: p.id }}
          className="focus-key w-40 shrink-0 sm:w-48"
          title={p.name}
        >
          <div className="aspect-square overflow-hidden rounded-lg border bg-muted">
            {p.image_url ? (
              <img src={imageUrl(p.image_url)} alt={p.name} loading="lazy" className="h-full w-full object-cover" />
            ) : null}
          </div>
          <p className="mt-1.5 truncate text-xs font-semibold">{p.name}</p>
          <p className="text-xs font-bold text-primary">{Number(p.price_ils)} ₪</p>
        </Link>
      ))}
    </div>
  );

  return (
    <section className="mt-14">
      <h2 className="text-center text-2xl font-light md:text-3xl">הנמכרים ביותר באתר</h2>
      <div className="mt-6 overflow-hidden">
        <div className="ticker-track flex w-max gap-4">
          {row}
          {row}
        </div>
      </div>
    </section>
  );
}

/** Customer screenshots / quotes. Only shows entries the shop owner added. */
export function Testimonials({ items }: { items: Testimonial[] }) {
  if (items.length === 0) return null;
  return (
    <section className="mt-14">
      <h2 className="text-center text-2xl font-light md:text-3xl">לקוחות ממליצים</h2>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((tItem) => (
          <figure key={tItem.id} className="rounded-xl border bg-card p-4">
            {tItem.image_url ? (
              <img
                src={imageUrl(tItem.image_url)}
                alt={`צילום מסך של שיחה עם ${tItem.customer_name}`}
                loading="lazy"
                className="mb-3 w-full rounded-lg border object-cover"
              />
            ) : null}
            <blockquote className="rounded-2xl rounded-se-sm bg-secondary px-3 py-2 text-sm">
              {tItem.message}
            </blockquote>
            {tItem.reply ? (
              <blockquote className="mt-2 rounded-2xl rounded-es-sm bg-navy px-3 py-2 text-sm text-white">
                {tItem.reply}
              </blockquote>
            ) : null}
            <figcaption className="mt-2 text-xs font-semibold text-muted-foreground">
              {tItem.customer_name}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

/** Short, elegant advantages strip. */
export function Advantages() {
  const items = [
    { icon: <BadgeCheck className="size-4" />, title: "קנייה מאובטחת" },
    { icon: <MessageSquareDashed className="size-4" />, title: "מענה מהיר ויעיל" },
    { icon: <Shirt className="size-4" />, title: "הזמנה בהתאמה אישית" },
  ];
  return (
    <section className="mt-10 rounded-xl border bg-card px-4 py-3">
      <ul className="flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-xs font-semibold sm:text-sm">
        {items.map((i) => (
          <li key={i.title} className="flex items-center gap-2">
            <span className="text-primary">{i.icon}</span>
            {i.title}
          </li>
        ))}
      </ul>
    </section>
  );
}
