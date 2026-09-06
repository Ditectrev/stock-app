import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CompareArticle } from "@/components/CompareArticle";
import { JsonLd } from "@/components/JsonLd";
import { getCompetitor, listComparisons } from "@/lib/compare-competitors";
import {
  buildComparePageJsonLd,
  comparisonDescription,
  comparisonTitle,
} from "@/lib/compare-json-ld";
import { buildPageMetadata } from "@/lib/site-seo";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return listComparisons().map((item) => ({ slug: item.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const competitor = getCompetitor(slug);
  if (!competitor) {
    return buildPageMetadata({
      title: "Comparison not found",
      description: "That comparison page does not exist.",
      path: `/compare/${slug}`,
      noIndex: true,
    });
  }

  return buildPageMetadata({
    title: comparisonTitle(competitor.name),
    description: comparisonDescription(competitor),
    path: `/compare/${competitor.slug}`,
    keywords: [
      `${competitor.name} alternative`,
      `The Open Stock vs ${competitor.name}`,
      ...competitor.alsoKnownAs,
    ],
  });
}

export default async function CompareSlugPage({ params }: PageProps) {
  const { slug } = await params;
  const competitor = getCompetitor(slug);
  if (!competitor) {
    notFound();
  }

  return (
    <>
      <JsonLd data={buildComparePageJsonLd(competitor)} />
      <CompareArticle competitor={competitor} />
    </>
  );
}
