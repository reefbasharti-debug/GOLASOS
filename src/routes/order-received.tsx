import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";

export const Route = createFileRoute("/order-received")({
  validateSearch: z.object({ n: z.string().max(20).optional() }),
  head: () => ({
    meta: [
      { title: "ההזמנה נשלחה | גולאסוס" },
      { name: "description", content: "ההזמנה שלכם התקבלה בגולאסוס ואנחנו חוזרים אליכם בהקדם." },
      { property: "og:title", content: "ההזמנה נשלחה | גולאסוס" },
      { property: "og:description", content: "תודה על ההזמנה — ניצור קשר לתיאום תשלום ומשלוח." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrderReceived,
});

function OrderReceived() {
  const { n } = Route.useSearch();

  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <div className="mx-auto grid size-16 place-items-center rounded-full surface-gold text-2xl font-extrabold">
        ✓
      </div>
      <h1 className="mt-6 text-3xl font-bold">ההזמנה התקבלה!</h1>
      {n ? <p className="mt-2 text-muted-foreground">מספר ההזמנה שלך: #{n}</p> : null}
      <p className="mt-4 text-sm text-muted-foreground">
        קיבלנו את ההזמנה וניצור איתך קשר בהקדם לתיאום תשלום ומשלוח.
      </p>
      <Link to="/categories" className="mt-8 inline-block rounded-md surface-gold px-6 py-3 font-bold">
        להמשך קניות
      </Link>
    </div>
  );
}
