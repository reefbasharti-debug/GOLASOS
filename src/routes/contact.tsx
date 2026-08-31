import { createFileRoute, getRouteApi } from "@tanstack/react-router";

const rootApi = getRouteApi("__root__");

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "צור קשר | גולאסוס" },
      { name: "description", content: "פרטי התקשרות של גולאסוס — חולצות ונעלי כדורגל, מענה מהיר." },
      { property: "og:title", content: "צור קשר | גולאסוס" },
      { property: "og:description", content: "יש שאלה על מוצר, מידה או משלוח? דברו איתנו." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const { settings } = rootApi.useLoaderData();

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold">צור קשר</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        נשמח לעזור בבחירת מידה, בדיקת זמינות דגם או מעקב על הזמנה קיימת.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {settings["whatsapp"] ? (
          <div className="rounded-lg border bg-card p-5">
            <p className="text-sm font-bold">וואטסאפ / טלפון</p>
            <p className="mt-1 text-muted-foreground">{settings["whatsapp"]}</p>
          </div>
        ) : null}
        {settings["notify_email"] ? (
          <div className="rounded-lg border bg-card p-5">
            <p className="text-sm font-bold">אימייל</p>
            <p className="mt-1 break-all text-muted-foreground">{settings["notify_email"]}</p>
          </div>
        ) : null}
        <div className="rounded-lg border bg-card p-5 sm:col-span-2">
          <p className="text-sm font-bold">משלוחים</p>
          <p className="mt-1 text-muted-foreground">
            {settings["shipping_note"] ?? "זמן אספקה משוער: 14–21 ימי עסקים, משלוח לכל הארץ."}
          </p>
        </div>
      </div>
    </div>
  );
}
