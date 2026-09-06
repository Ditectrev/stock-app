import {
  COMPARE_UPDATED,
  OUR_PRODUCT,
  type CompetitorComparison,
} from "@/lib/compare-competitors";
import { SITE_NAME, getSiteUrl } from "@/lib/site-seo";

export function buildCompareHubJsonLd() {
  const siteUrl = getSiteUrl();
  const compareUrl = `${siteUrl}/compare`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${compareUrl}#page`,
        url: compareUrl,
        name: `${SITE_NAME} vs Finviz, TradingView, Yahoo Finance and more`,
        description: OUR_PRODUCT.short,
        isPartOf: { "@id": `${siteUrl}/#website` },
        dateModified: COMPARE_UPDATED,
      },
      {
        "@type": "ItemList",
        "@id": `${compareUrl}#list`,
        name: `${SITE_NAME} comparison pages`,
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: `${SITE_NAME} vs Finviz`,
            url: `${siteUrl}/compare/finviz`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: `${SITE_NAME} vs TradingView`,
            url: `${siteUrl}/compare/tradingview`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: `${SITE_NAME} vs Yahoo Finance`,
            url: `${siteUrl}/compare/yahoo-finance`,
          },
        ],
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: siteUrl,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Compare",
            item: compareUrl,
          },
        ],
      },
    ],
  };
}

export function buildComparePageJsonLd(competitor: CompetitorComparison) {
  const siteUrl = getSiteUrl();
  const pageUrl = `${siteUrl}/compare/${competitor.slug}`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${pageUrl}#page`,
        url: pageUrl,
        name: `${SITE_NAME} vs ${competitor.name}`,
        description: competitor.verdict,
        dateModified: COMPARE_UPDATED,
        isPartOf: { "@id": `${siteUrl}/#website` },
        about: [
          { "@type": "SoftwareApplication", name: SITE_NAME, url: siteUrl },
          {
            "@type": "SoftwareApplication",
            name: competitor.name,
            url: competitor.website,
          },
        ],
      },
      {
        "@type": "FAQPage",
        "@id": `${pageUrl}#faq`,
        mainEntity: competitor.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: siteUrl,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Compare",
            item: `${siteUrl}/compare`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: `vs ${competitor.name}`,
            item: pageUrl,
          },
        ],
      },
    ],
  };
}

export function comparisonTitle(name: string): string {
  return `${SITE_NAME} vs ${name}`;
}

export function comparisonDescription(
  competitor: CompetitorComparison
): string {
  return competitor.verdict.slice(0, 158);
}
