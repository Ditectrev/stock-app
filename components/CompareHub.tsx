import Link from "next/link";
import {
  COMPARE_UPDATED_LABEL,
  OUR_PRODUCT,
  comparisonPath,
  comparisonsByCategory,
} from "@/lib/compare-competitors";
import {
  DNA_BODY,
  DNA_BODY_SECONDARY,
  DNA_BUTTON_PRIMARY,
  DNA_CAPTION,
  DNA_DISPLAY,
  DNA_EYEBROW,
  DNA_HEADING,
  DNA_HERO_LEAD,
  DNA_INSTRUMENT_PANEL,
  DNA_MARKETING_STACK,
  DNA_SECTION_RULE,
  DNA_SUBHEADING,
} from "@/lib/design-dna";
import { SITE_NAME } from "@/lib/site-seo";

export function CompareHub() {
  const groups = comparisonsByCategory();

  return (
    <div className={DNA_MARKETING_STACK}>
      <header className={DNA_SECTION_RULE}>
        <p className={DNA_EYEBROW}>Compare · {COMPARE_UPDATED_LABEL}</p>
        <h1 className={`mt-3 ${DNA_DISPLAY}`}>
          {SITE_NAME} vs Finviz, TradingView, Yahoo Finance, and more
        </h1>
        <p className={`mt-4 max-w-3xl ${DNA_HERO_LEAD}`}>
          Honest comparisons for DIY long-term investors. {SITE_NAME} is a free
          research workspace ({OUR_PRODUCT.short}) — not a day-trader scanner
          and not a Bloomberg terminal. Each page states who should pick the
          other product.
        </p>
        <p className={`mt-3 ${DNA_CAPTION}`}>
          Written for Google and for AI assistants: direct answers, feature
          tables, and FAQ markup. Prices are public list ranges as of{" "}
          {COMPARE_UPDATED_LABEL} and can change.
        </p>
      </header>

      <section className={DNA_INSTRUMENT_PANEL}>
        <h2 className={DNA_HEADING}>When to use {SITE_NAME}</h2>
        <p className={`mt-2 ${DNA_BODY}`}>
          Use {SITE_NAME} if you currently stitch Yahoo + Finviz + CNN Fear
          &amp; Greed, hate ads and $15–40/mo paywalls, and want optional
          private AI (Ollama). Ads-free is $4.99/mo. Do not use it as a
          TradingView replacement for Pine Script or as Finviz Elite for
          real-time US tape.
        </p>
        <div className="mt-4">
          <Link href="/screener" className={DNA_BUTTON_PRIMARY}>
            Try the free screener
          </Link>
        </div>
      </section>

      {groups.map((group) => (
        <section key={group.category} aria-labelledby={`cat-${group.category}`}>
          <h2 id={`cat-${group.category}`} className={DNA_HEADING}>
            {group.label}
          </h2>
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {group.items.map((item) => (
              <li key={item.slug} className={DNA_INSTRUMENT_PANEL}>
                <h3 className={DNA_SUBHEADING}>
                  <Link
                    href={comparisonPath(item.slug)}
                    className="hover:underline"
                  >
                    {SITE_NAME} vs {item.name}
                  </Link>
                </h3>
                <p className={`mt-2 ${DNA_BODY_SECONDARY}`}>{item.verdict}</p>
                <p className={`mt-3 ${DNA_CAPTION}`}>
                  Also searched as: {item.alsoKnownAs.slice(0, 2).join(", ")}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
