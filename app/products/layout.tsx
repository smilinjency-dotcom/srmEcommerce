import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shop All Products",
  description:
    "Browse our full catalogue — search, filter by category, and find exactly what you need.",
};

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
