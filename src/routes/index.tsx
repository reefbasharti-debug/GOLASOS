import { createFileRoute } from "@tanstack/react-router";

import { DEFAULT_SLIDES, HeroSlider } from "@/components/HeroSlider";
import { getHomeData } from "@/lib/store.functions";
import { getRequestOrigin } from "@/lib/origin.functions";
import { useLang } from "@/lib/i18n";
import { Advantages, BestsellersStrip, Testimonials, TopTeams } from "@/components/HomeSections";

export const Route = createFileRoute("/")({
  loader: async () => {
    const [home, origin] = await Promise.all([getHomeData(), getRequestOrigin()]);
    return { ...home, origin };
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: "גולאסוס | חולצות כדורגל ונעליים במשלוח לכל הארץ" },
      {
        name: "description",
        content:
          "חולצות כדורגל וכדורסל של כל הקבוצות והנבחרות, נעלי כדורגל ומיסטרי בוקס — הזמנה מהירה באתר עם משלוח לכל הארץ.",
      },
      { property: "og:title", content: "גולאסוס | חולצות כדורגל ונעליים" },
      {
        property: "og:description",
        content: "חולצות הקבוצות הפופולריות בעולם, נעלי כדורגל ומיסטרי בוקס — הזמנה ישירה באתר.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/" },
      ...(loaderData?.origin
        ? [
            { property: "og:image", content: `${loaderData.origin}/og-image.jpg` },
            { name: "twitter:image", content: `${loaderData.origin}/og-image.jpg` },
          ]
        : []),
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Index,
});

function Index() {
  const home = Route.useLoaderData();
  const { lang } = useLang();

  return (
    <div className="mx-auto max-w-7xl px-4">
      <h1 className="sr-only">גולאסוס - חולצות ונעלי כדורגל</h1>

      <HeroSlider slides={DEFAULT_SLIDES[lang]} />

      <TopTeams teams={home.topTeams} />

      <BestsellersStrip products={home.bestsellers} />

      <Testimonials items={home.testimonials} />

      <Advantages />
    </div>
  );
}
