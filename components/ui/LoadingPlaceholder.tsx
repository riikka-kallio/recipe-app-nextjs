import React from 'react';
import { cn } from '@/lib/utils';

/**
 * LoadingPlaceholder - A shimmer loading component for content placeholders
 * 
 * Also known as a "skeleton screen", this component provides visual feedback
 * to users while content is loading, improving perceived performance.
 * 
 * @example
 * ```tsx
 * <LoadingPlaceholder className="h-4 w-32" />
 * <LoadingPlaceholder variant="circular" className="w-12 h-12" />
 * ```
 */

interface LoadingPlaceholderProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
}

export const LoadingPlaceholder: React.FC<LoadingPlaceholderProps> = ({ 
  className, 
  variant = 'rectangular' 
}) => {
  const variants = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  return (
    <div
      data-testid="loading-placeholder"
      role="status"
      aria-live="polite"
      aria-label="Loading content"
      className={cn(
        'animate-pulse bg-neutral-light',
        variants[variant],
        className
      )}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

/**
 * RecipeCardLoader - Loading placeholder for recipe cards
 * 
 * Displays a skeleton layout matching the RecipeCard component structure
 * while recipe data is being fetched.
 */
export const RecipeCardLoader: React.FC = () => {
  return (
    <div data-testid="recipe-card-loader" className="bg-white rounded-xl shadow-sm border border-neutral-light overflow-hidden">
      <LoadingPlaceholder className="w-full aspect-square" />
      <div className="p-4 space-y-3">
        <LoadingPlaceholder className="h-6 w-3/4" />
        <LoadingPlaceholder className="h-4 w-1/2" />
        <div className="flex gap-2">
          <LoadingPlaceholder className="h-6 w-16" />
          <LoadingPlaceholder className="h-6 w-16" />
        </div>
      </div>
    </div>
  );
};

/**
 * BlogPostCardLoader - Loading placeholder for blog post cards
 * 
 * Displays a skeleton layout matching the BlogPostCard component structure
 * while blog post data is being fetched.
 */
export const BlogPostCardLoader: React.FC = () => {
  return (
    <div data-testid="blog-card-loader" className="bg-white rounded-xl shadow-sm border border-neutral-light overflow-hidden">
      <LoadingPlaceholder className="w-full aspect-video" />
      <div className="p-4 space-y-3">
        <LoadingPlaceholder className="h-6 w-3/4" />
        <LoadingPlaceholder className="h-4 w-full" />
        <LoadingPlaceholder className="h-4 w-5/6" />
        <div className="flex gap-2 mt-4">
          <LoadingPlaceholder className="h-6 w-20" />
          <LoadingPlaceholder className="h-6 w-24" />
        </div>
      </div>
    </div>
  );
};
