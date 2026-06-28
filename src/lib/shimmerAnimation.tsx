import { memo } from "react";

export interface ShimmerLoaderProps {
  variant?: "text" | "title" | "thumbnail" | "card" | "circle";
  className?: string;
}

export const ShimmerLoader = memo(function ShimmerLoader({ variant = "text", className = "" }: ShimmerLoaderProps) {
  const baseClass = "shimmer";

  const variantClass = {
    text: "shimmer-text",
    title: "shimmer-title",
    thumbnail: "shimmer-thumbnail",
    card: "shimmer-card",
    circle: "shimmer-circle",
  }[variant];

  if (variant === "card") {
    return (
      <div className={`${baseClass} ${variantClass} ${className}`}>
        <div className="shimmer-card-body">
          <div className="shimmer shimmer-title" />
          <div className="shimmer shimmer-text" />
          <div className="shimmer shimmer-text" />
        </div>
      </div>
    );
  }

  return <div className={`${baseClass} ${variantClass} ${className}`} aria-busy="true" />;
});
