import { Link } from "@tanstack/react-router";

export function Footer({ settings }: { settings: Record<string, string> }) {
  return (
    <footer className="mt-16 surface-navy">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-3">
        <div>
          <h2 className="text-lg font-extrabold">גולאסוס</h2>
          <p className="mt-2 text-sm opacity-80">
            {settings["footer_text"] ??
              "חולצות כדורגל ונעלי כדורגל של כל הקבוצות והנבחרות הגדולות, במשלוח לכל הארץ."}
          </p>
        </div>
        <div>
          <h3 className="text-sm font-bold text-accent">קישורים</h3>
          <ul className="mt-2 space-y-1 text-sm">
            <li>
              <Link to="/categories" className="hover:text-accent">
                כל הקטגוריות
              </Link>
            </li>
            <li>
              <Link to="/cart" className="hover:text-accent">
                עגלת קניות
              </Link>
            </li>
            <li>
              <Link to="/contact" className="hover:text-accent">
                צור קשר
              </Link>
            </li>
            <li>
              <Link to="/admin" className="hover:text-accent">
                ניהול האתר
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-bold text-accent">פרטי התקשרות</h3>
          <ul className="mt-2 space-y-1 text-sm opacity-90">
            {settings["whatsapp"] ? <li>וואטסאפ: {settings["whatsapp"]}</li> : null}
            {settings["notify_email"] ? <li>אימייל: {settings["notify_email"]}</li> : null}
            <li>{settings["shipping_note"] ?? "זמן אספקה משוער: 14–21 ימי עסקים"}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-sidebar-border py-4 text-center text-xs opacity-70">
        © {new Date().getFullYear()} גולאסוס. כל הזכויות שמורות.
      </div>
    </footer>
  );
}
