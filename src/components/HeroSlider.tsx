import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import { useLang } from "@/lib/i18n";
import hero1 from "@/assets/hero-1.jpg";
import hero2 from "@/assets/hero-2.jpg";
import hero3 from "@/assets/hero-3.jpg";

export type Slide = { image: string; title: string; subtitle: string; to: string; cta: string };

export const DEFAULT_SLIDES: { he: Slide[]; en: Slide[] } = {
  he: [
    { image: hero1, title: "חולצות כדורגל 65 ₪", subtitle: "כל הקבוצות, כל הנבחרות, כל העונות", to: "/categories", cta: "לכל הקבוצות" },
    { image: hero2, title: "נעלי כדורגל 350 ₪", subtitle: "נייקי, אדידס, פומה ועוד – בכל המידות", to: "/shoes", cta: "לנעליים" },
    { image: hero3, title: "נבחרות לאומיות", subtitle: "המדים של מונדיאל 2026 כבר כאן", to: "/categories", cta: "לנבחרות" },
  ],
  en: [
    { image: hero1, title: "Football jerseys 65 ₪", subtitle: "Every club, every national team, every season", to: "/categories", cta: "Shop teams" },
    { image: hero2, title: "Football boots 350 ₪", subtitle: "Nike, adidas, Puma and more – all sizes", to: "/shoes", cta: "Shop boots" },
    { image: hero3, title: "National teams", subtitle: "World Cup 2026 kits are here", to: "/categories", cta: "Shop national" },
  ],
};

export function HeroSlider({ slides }: { slides: Slide[] }) {
  const { dir } = useLang();
  const [i, setI] = useState(0);
  const n = slides.length;

  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % n), 6000);
    return () => clearInterval(id);
  }, [n]);

  const go = (d: number) => setI((v) => (v + d + n) % n);

  return (
    <section className="relative overflow-hidden bg-muted" aria-roledescription="carousel">
      <div className="flex transition-transform duration-500" style={{ transform: `translateX(${(dir === "rtl" ? 1 : -1) * i * 100}%)` }}>
        {slides.map((s, idx) => (
          <div key={idx} className="relative w-full shrink-0">
            <img
              src={s.image}
              alt={s.title}
              width={1600}
              height={640}
              loading={idx === 0 ? "eager" : "lazy"}
              className="aspect-[1600/640] w-full object-cover"
            />
            <div className="absolute inset-0 flex items-center bg-gradient-to-t from-navy/70 via-navy/10 to-transparent">
              <div className="px-10 text-background md:px-16">
                <h2 className="font-display text-3xl font-extrabold drop-shadow md:text-5xl">{s.title}</h2>
                <p className="mt-2 text-sm font-medium drop-shadow md:text-lg">{s.subtitle}</p>
                <Link to={s.to} className="mt-5 inline-block rounded-sm bg-accent px-6 py-2.5 text-sm font-bold text-accent-foreground shadow-md">
                  {s.cta}
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      <button onClick={() => go(-1)} className="absolute start-4 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-foreground/40 text-background hover:bg-foreground/60" aria-label="previous">
        <ChevronLeft className="size-6 rtl:rotate-180" />
      </button>
      <button onClick={() => go(1)} className="absolute end-4 top-1/2 grid size-12 -translate-y-1/2 place-items-center rounded-full bg-foreground/40 text-background hover:bg-foreground/60" aria-label="next">
        <ChevronRight className="size-6 rtl:rotate-180" />
      </button>

      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setI(idx)}
            className={`size-3 rounded-full border border-background ${idx === i ? "bg-background" : "bg-transparent"}`}
            aria-label={`slide ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
