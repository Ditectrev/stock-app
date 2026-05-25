"use client";

import dynamic from "next/dynamic";
import { Navigation } from "@/components/Navigation";

const Footer = dynamic(
  () => import("@/components/Footer").then((m) => m.Footer),
  { ssr: false }
);

export default function MainLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navigation />

      <div className="max-w-7xl xl:max-w-[1400px] mx-auto p-4 sm:p-6 md:p-8 lg:p-10 xl:p-12">
        {children}
      </div>

      <Footer />
    </div>
  );
}
