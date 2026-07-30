"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

export interface ProductCardProps {
  image: string;
  name: string;
  price: number;
  slug: string;
}

export default function ProductCard({ image, name, price, slug }: ProductCardProps) {
  return (
    <article
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border
        bg-surface shadow-sm transition-all duration-300
        hover:-translate-y-1 hover:shadow-lg hover:shadow-primary/10"
    >
      {/* ── Product Image ── */}
      <div className="relative aspect-square w-full overflow-hidden bg-muted">
        <Image
          src={image}
          alt={name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      {/* ── Card Body ── */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        {/* Product name */}
        <h3
          className="line-clamp-2 text-base font-semibold leading-snug text-foreground
            transition-colors duration-200 group-hover:text-primary"
        >
          {name}
        </h3>

        {/* Price */}
        <p className="text-lg font-extrabold text-primary">
          ₹{price.toLocaleString("en-IN")}
        </p>

        {/* View Product button */}
        <Link
          href={`/products/${slug}`}
          id={`product-card-btn-${slug}`}
          aria-label={`View ${name}`}
          className="group/btn mt-auto inline-flex items-center justify-center gap-2
            rounded-full bg-primary px-5 py-2.5 text-sm font-semibold
            text-primary-foreground shadow-md shadow-primary/25
            transition-all duration-200
            hover:brightness-110 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/35
            focus-visible:outline-none focus-visible:ring-2
            focus-visible:ring-primary focus-visible:ring-offset-2"
        >
          View Product
          <ArrowRight
            size={15}
            aria-hidden="true"
            className="transition-transform duration-200 group-hover/btn:translate-x-1"
          />
        </Link>
      </div>
    </article>
  );
}
