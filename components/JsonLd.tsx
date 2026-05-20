import { buildWebSiteJsonLd } from "@/lib/site-seo";

export function JsonLd() {
  const data = buildWebSiteJsonLd();

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
