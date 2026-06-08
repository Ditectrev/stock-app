"use client";

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { Navigation } from "@/components/Navigation";
import { HOME_PAGE_BACKGROUND } from "@/lib/home-ui";

const Footer = dynamic(
  () => import("@/components/Footer").then((m) => m.Footer),
  { ssr: false }
);

function NavigationFallback() {
  return (
    <nav
      className="border-b border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-950"
      aria-hidden
    >
      <div className="mx-auto h-16 max-w-7xl px-4 xl:max-w-[1400px] sm:px-6" />
    </nav>
  );
}

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={`min-h-screen ${HOME_PAGE_BACKGROUND}`}>
      <Suspense fallback={<NavigationFallback />}>
        <Navigation />
      </Suspense>

      <div className="mx-auto max-w-7xl p-4 sm:p-6 md:p-8 lg:p-10 xl:max-w-[1400px] xl:p-12">
        {children}
      </div>

      <Footer />
    </div>
  );
}
