import { Link } from "@tanstack/react-router";

/** Black scrolling bar above the nav: charity note + referral teaser. */
export function MarqueeBar() {
  const messages = [
    <span key="charity">
      10% מכל רכישה מועבר לתרומה ל־
      <a
        href="https://www.achimlachaim.org/"
        target="_blank"
        rel="noreferrer"
        className="font-extrabold text-gold underline decoration-gold/70 underline-offset-2"
      >
        אחים לחיים
      </a>
    </span>,
    <Link key="ref" to="/affiliate" className="font-extrabold text-gold underline decoration-gold/70 underline-offset-2">
      חבר מביא חבר: הבאת חבר שרכש? הרווחת כסף
    </Link>,
  ];

  const strip = (
    <div className="flex shrink-0 items-center gap-16 px-8">
      {messages}
      {messages}
    </div>
  );

  return (
    <div className="relative overflow-hidden bg-black py-2 text-xs font-bold text-white sm:text-sm">
      <div className="marquee-track flex w-max">
        {strip}
        {strip}
      </div>
    </div>
  );
}
