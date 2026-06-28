/**
 * SkeletonPage — Full-page skeleton loader
 * Sprint 038-A: Foundation — replaces skeleton.tsx, skeleton-loader.tsx, skeleton-components.tsx
 *
 * Three variants:
 * - default: header + card grid
 * - detail: header + hero + text blocks
 * - profile: header + avatar + list items
 */
import React from "react";
import { cn } from "@/lib/utils";
import { Shimmer } from "./Shimmer";

export interface SkeletonPageProps {
    variant?: "default" | "detail" | "profile";
    className?: string;
}

/** Matches the page header height for consistent layout */
function PageHeader() {
    return (
        <div className="h-14 border-b border-border px-4 flex items-center gap-3">
            <Shimmer className="w-6 h-6 rounded-md" />
            <Shimmer className="w-48 h-5 rounded-md" />
            <div className="flex-1" />
            <Shimmer className="w-24 h-9 rounded-xl" />
        </div>
    );
}

export function SkeletonPage({ variant = "default", className }: SkeletonPageProps) {
    return (
        <div className={cn("flex flex-col min-h-screen", className)}>
            <PageHeader />

            {variant === "default" && (
                <div className="flex-1 p-4 md:p-6 space-y-6">
                    {/* Section header */}
                    <div className="flex items-center gap-3">
                        <Shimmer className="w-8 h-5 rounded-md" />
                        <Shimmer className="w-32 h-4 rounded-md" />
                    </div>
                    {/* Card grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {Array.from({ length: 8 }).map((_, i) => (
                            <div key={i} className="space-y-3">
                                <Shimmer className="w-full aspect-square rounded-xl" />
                                <Shimmer className="w-3/4 h-4 rounded-md" />
                                <Shimmer className="w-1/2 h-3 rounded-md" />
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {variant === "detail" && (
                <div className="flex-1 p-4 md:p-6 space-y-6">
                    {/* Hero */}
                    <Shimmer className="w-full h-48 md:h-64 rounded-2xl" />
                    {/* Title + meta */}
                    <div className="space-y-3 max-w-2xl">
                        <Shimmer className="w-3/4 h-8 rounded-lg" />
                        <div className="flex gap-3">
                            <Shimmer className="w-24 h-4 rounded-md" />
                            <Shimmer className="w-16 h-4 rounded-md" />
                            <Shimmer className="w-20 h-4 rounded-md" />
                        </div>
                    </div>
                    {/* Actions */}
                    <div className="flex gap-3">
                        <Shimmer className="w-32 h-11 rounded-xl" />
                        <Shimmer className="w-11 h-11 rounded-xl" />
                        <Shimmer className="w-11 h-11 rounded-xl" />
                    </div>
                    {/* Text blocks */}
                    <div className="space-y-3 max-w-2xl">
                        <Shimmer className="w-full h-4 rounded-md" />
                        <Shimmer className="w-full h-4 rounded-md" />
                        <Shimmer className="w-2/3 h-4 rounded-md" />
                    </div>
                </div>
            )}

            {variant === "profile" && (
                <div className="flex-1 p-4 md:p-6 space-y-6">
                    {/* Avatar + name */}
                    <div className="flex items-center gap-4">
                        <Shimmer className="w-20 h-20 rounded-full" />
                        <div className="space-y-2">
                            <Shimmer className="w-40 h-6 rounded-md" />
                            <Shimmer className="w-56 h-4 rounded-md" />
                        </div>
                    </div>
                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4">
                        {Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} className="space-y-2">
                                <Shimmer className="w-12 h-6 rounded-md" />
                                <Shimmer className="w-20 h-3 rounded-md" />
                            </div>
                        ))}
                    </div>
                    {/* List */}
                    <div className="space-y-3">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <Shimmer className="w-10 h-10 rounded-lg" />
                                <div className="flex-1 space-y-1.5">
                                    <Shimmer className="w-40 h-4 rounded-md" />
                                    <Shimmer className="w-24 h-3 rounded-md" />
                                </div>
                                <Shimmer className="w-8 h-4 rounded-md" />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default SkeletonPage;