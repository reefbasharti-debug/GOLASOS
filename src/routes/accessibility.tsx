import { createFileRoute, getRouteApi } from "@tanstack/react-router";

const rootApi = getRouteApi("__root__");

export const Route = createFileRoute("/accessibility")({
  head: () => ({
    meta: [
      { title: "הצהרת נגישות | גולאסוס" },
      {
        name: "description",
        content:
          "הצהרת הנגישות של אתר גולאסוס: התאמות שבוצעו לפי תקן ישראלי 5568 ורמת AA, ניווט מקלדת, ניגודיות צבעים ודרכי פנייה לרכז הנגישות.",
      },
      { property: "og:title", content: "הצהרת נגישות | גולאסוס" },
      { property: "og:description", content: "כך אנחנו דואגים שהאתר יהיה נגיש לכולם, ואיך מדווחים על בעיה." },
      { property: "og:type", content: "article" },
      { property: "og:url", content: "/accessibility" },
    ],
    links: [{ rel: "canonical", href: "/accessibility" }],
  }),
  component: AccessibilityPage,
});

function AccessibilityPage() {
  const { settings } = rootApi.useLoaderData();
  const email = settings["notify_email"] || settings["support_email"] || "";
  const phone = settings["whatsapp"] || "";

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold">הצהרת נגישות</h1>
      <p className="mt-2 text-xs text-muted-foreground">עדכון אחרון: ספטמבר 2026</p>

      <div className="mt-6 space-y-3 text-sm leading-relaxed text-foreground/80">
        <p>
          אנו רואים חשיבות רבה במתן שירות שוויוני לכל הלקוחות, ופועלים להנגיש את האתר בהתאם לתקנות שוויון זכויות לאנשים עם
          מוגבלות (התאמות נגישות לשירות), התשע"ג-2013 ולתקן הישראלי 5568 המבוסס על הנחיות WCAG 2.0 ברמת AA.
        </p>

        <h2 className="pt-4 text-lg font-bold text-foreground">התאמות שבוצעו באתר</h2>
        <ul className="list-disc space-y-1 ps-5">
          <li>מבנה סמנטי עם כותרות היררכיות, כך שקוראי מסך יכולים לנווט בין אזורי הדף.</li>
          <li>אפשרות תפעול מלאה במקלדת, כולל סימון ברור של הפוקוס על כל כפתור וקישור.</li>
          <li>תיאורי טקסט חלופי לתמונות מוצרים וללוגואים.</li>
          <li>ניגודיות צבעים תקינה בין הטקסט לרקע, וטקסט הניתן להגדלה בדפדפן ללא שיבוש הפריסה.</li>
          <li>אזורי מגע נוחים בנייד וטפסים עם תוויות והודעות שגיאה מפורשות.</li>
          <li>תמיכה בכיווניות עברית מלאה ובמעבר לאנגלית.</li>
        </ul>

        <h2 className="pt-4 text-lg font-bold text-foreground">מגבלות ידועות</h2>
        <p>
          חלק מתמונות המוצרים מגיעות מקטלוג הספק ואיכות התיאור שלהן מוגבלת. אנו משפרים אותן באופן שוטף. אם נתקלתם בתוכן שאינו
          נגיש, נשמח לדעת ונטפל בכך בהקדם.
        </p>

        <h2 className="pt-4 text-lg font-bold text-foreground">פנייה לרכז הנגישות</h2>
        <p>
          נתקלתם בבעיית נגישות באתר? נשמח לקבל פירוט של הדף והתקלה:
          {email ? <> דוא"ל: <span dir="ltr">{email}</span>.</> : null}
          {phone ? <> טלפון / וואטסאפ: <span dir="ltr">{phone}</span>.</> : null}
          {!email && !phone ? " דרך עמוד צור קשר באתר." : null}
        </p>
        <p>נשיב לפנייה בהקדם ונעשה כל מאמץ לספק פתרון או חלופה נגישה.</p>
      </div>
    </div>
  );
}
