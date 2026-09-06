import { buildWebSiteJsonLd } from "@/lib/site-seo";

export function JsonLd({ data }: { data?: unknown } = {}) {
  const payload = data ?? buildWebSiteJsonLd();

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(payload) }}
    />
  );
}
