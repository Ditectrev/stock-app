import Link from "next/link";
import {
  COMPARE_UPDATED_LABEL,
  OUR_PRODUCT,
  comparisonPath,
  getCompetitor,
  type CompetitorComparison,
} from "@/lib/compare-competitors";
import {
  DNA_BODY,
  DNA_BODY_SECONDARY,
  DNA_BUTTON_PRIMARY,
  DNA_BUTTON_SECONDARY,
  DNA_CALLOUT,
  DNA_CAPTION,
  DNA_DISPLAY,
  DNA_EYEBROW,
  DNA_HEADING,
  DNA_HERO_LEAD,
  DNA_INSTRUMENT_PANEL,
  DNA_MARKETING_STACK,
  DNA_SECTION_RULE,
  DNA_SUBHEADING,
  DNA_TABLE_HEADER,
} from "@/lib/design-dna";
import { SITE_NAME } from "@/lib/site-seo";

function RelatedLinks({ slugs }: { slugs: string[] }) {
  const items = slugs
    .map((slug) => getCompetitor(slug))
    .filter((item): item is CompetitorComparison => Boolean(item));

  if (items.length === 0) return null;

  return (
    <ul className="mt-3 flex flex-wrap gap-2">
      {items.map((item) => (
        <li key={item.slug}>
          <Link
            href={comparisonPath(item.slug)}
            className="rounded-lg border border-stone-300 bg-white px-3 py-1.5 text-sm font-medium text-stone-800 hover:bg-stone-100 dark:border-stone-600 dark:bg-stone-800 dark:text-stone-100 dark:hover:bg-stone-700"
          >
            vs {item.name}
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function CompareArticle({
  competitor,
}: {
  competitor: CompetitorComparison;
}) {
  const h1 = `${SITE_NAME} vs ${competitor.name}`;

  return (
    <article className={DNA_MARKETING_STACK}>
      <header className={DNA_SECTION_RULE}>
        <p className={DNA_EYEBROW}>Compare · {COMPARE_UPDATED_LABEL}</p>
        <h1 className={`mt-3 ${DNA_DISPLAY}`}>{h1}</h1>
        <p className={`mt-4 max-w-3xl ${DNA_HERO_LEAD}`}>
          {competitor.verdict}
        </p>
        <p className={`mt-3 ${DNA_CAPTION}`}>
          Independent comparison of {SITE_NAME} (
          {OUR_PRODUCT.url.replace("https://", "")}) and {competitor.name}. Not
          affiliated with {competitor.name}.
        </p>
      </header>

      <section
        className={DNA_INSTRUMENT_PANEL}
        aria-labelledby="verdict-heading"
      >
        <h2 id="verdict-heading" className={DNA_HEADING}>
          Quick verdict
        </h2>
        <div className="mt-4 grid gap-6 md:grid-cols-2">
          <div>
            <h3 className={DNA_SUBHEADING}>Choose {competitor.name} if</h3>
            <p className={`mt-2 ${DNA_BODY}`}>{competitor.chooseThemIf}</p>
          </div>
          <div>
            <h3 className={DNA_SUBHEADING}>Choose {SITE_NAME} if</h3>
            <p className={`mt-2 ${DNA_BODY}`}>{competitor.chooseUsIf}</p>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/screener" className={DNA_BUTTON_PRIMARY}>
            Open the free screener
          </Link>
          <Link href="/pricing" className={DNA_BUTTON_SECONDARY}>
            View pricing
          </Link>
        </div>
      </section>

      <section aria-labelledby="features-heading">
        <h2 id="features-heading" className={DNA_HEADING}>
          Feature comparison
        </h2>
        <p className={`mt-2 ${DNA_BODY_SECONDARY}`}>
          {SITE_NAME} free tier: {OUR_PRODUCT.freeTier}. Paid from{" "}
          {OUR_PRODUCT.paidFrom}. {competitor.name} free tier:{" "}
          {competitor.freeTier}. Paid from {competitor.paidFrom}.
        </p>
        <div className="mt-4 overflow-x-auto rounded-xl border border-stone-200 dark:border-stone-700">
          <table className="min-w-full text-left text-sm">
            <caption className="sr-only">
              {SITE_NAME} versus {competitor.name} features
            </caption>
            <thead className="bg-stone-100 dark:bg-stone-900">
              <tr>
                <th scope="col" className={`px-4 py-3 ${DNA_TABLE_HEADER}`}>
                  Feature
                </th>
                <th scope="col" className={`px-4 py-3 ${DNA_TABLE_HEADER}`}>
                  {SITE_NAME}
                </th>
                <th scope="col" className={`px-4 py-3 ${DNA_TABLE_HEADER}`}>
                  {competitor.name}
                </th>
              </tr>
            </thead>
            <tbody>
              {competitor.features.map((row, index) => (
                <tr
                  key={row.label}
                  className={
                    index % 2 === 0
                      ? "bg-white dark:bg-stone-950"
                      : "bg-stone-50 dark:bg-stone-900/80"
                  }
                >
                  <th
                    scope="row"
                    className="px-4 py-3 font-medium text-stone-900 dark:text-stone-50"
                  >
                    {row.label}
                  </th>
                  <td className={`px-4 py-3 ${DNA_BODY_SECONDARY}`}>
                    {row.us}
                  </td>
                  <td className={`px-4 py-3 ${DNA_BODY_SECONDARY}`}>
                    {row.them}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className={DNA_INSTRUMENT_PANEL}>
          <h2 className={DNA_HEADING}>Where {competitor.name} wins</h2>
          <ul className={`mt-3 list-disc space-y-2 pl-5 ${DNA_BODY}`}>
            {competitor.theyWin.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div className={DNA_INSTRUMENT_PANEL}>
          <h2 className={DNA_HEADING}>Where {SITE_NAME} wins</h2>
          <ul className={`mt-3 list-disc space-y-2 pl-5 ${DNA_BODY}`}>
            {competitor.weWin.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className={DNA_CALLOUT} aria-labelledby="faq-heading">
        <h2 id="faq-heading" className={DNA_HEADING}>
          FAQ
        </h2>
        <dl className="mt-4 space-y-4">
          {competitor.faqs.map((faq) => (
            <div key={faq.question}>
              <dt className={DNA_SUBHEADING}>{faq.question}</dt>
              <dd className={`mt-1 ${DNA_BODY}`}>{faq.answer}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section>
        <h2 className={DNA_HEADING}>Related comparisons</h2>
        <RelatedLinks slugs={competitor.relatedSlugs} />
        <p className={`mt-4 ${DNA_BODY_SECONDARY}`}>
          See every comparison on the{" "}
          <Link href="/compare" className="underline underline-offset-2">
            compare hub
          </Link>
          . Official {competitor.name} site:{" "}
          <a
            href={competitor.website}
            className="underline underline-offset-2"
            rel="nofollow noopener noreferrer"
            target="_blank"
          >
            {competitor.website.replace(/^https?:\/\//, "")}
          </a>
          .
        </p>
      </section>
    </article>
  );
}
