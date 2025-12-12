/**
 * useStarsProducts Hook
 * Fetches and caches Stars products with TanStack Query
 */

import { useQuery } from '@tanstack/react-query';
import { getProducts, getFeaturedProducts, getProductsByType } from '@/services/starsPaymentService';
import type { StarsProduct, GroupedProducts } from '@/types/starsPayment';

// Query key factory
export const starsProductsKeys = {
  all: ['stars-products'] as const,
  lists: () => [...starsProductsKeys.all, 'list'] as const,
  list: (filter: string) => [...starsProductsKeys.lists(), filter] as const,
  featured: () => [...starsProductsKeys.all, 'featured'] as const,
  byType: (type: 'credits' | 'subscription') => [...starsProductsKeys.all, 'type', type] as const,
};

/**
 * Fetch all active products
 */
export function useStarsProducts() {
  return useQuery({
    queryKey: starsProductsKeys.list('all'),
    queryFn: getProducts,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });
}

/**
 * Fetch featured products only
 */
export function useFeaturedProducts() {
  return useQuery({
    queryKey: starsProductsKeys.featured(),
    queryFn: getFeaturedProducts,
    staleTime: 30 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

/**
 * Fetch products by type (credits or subscription)
 */
export function useProductsByType(type: 'credits' | 'subscription') {
  return useQuery({
    queryKey: starsProductsKeys.byType(type),
    queryFn: () => getProductsByType(type),
    staleTime: 30 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

/**
 * Fetch all products and group them by type for UI display
 */
export function useGroupedProducts() {
  const { data: products, ...queryState } = useStarsProducts();

  const groupedProducts: GroupedProducts | undefined = products
    ? {
        credits: products.filter((p) => p.product_type === 'credits'),
        subscriptions: products.filter((p) => p.product_type === 'subscription'),
        featured: products.filter((p) => p.is_featured),
      }
    : undefined;

  return {
    ...queryState,
    data: groupedProducts,
    products,
  };
}
