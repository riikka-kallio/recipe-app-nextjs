'use client';

import React from 'react';
import Link from 'next/link';
import { useTrendingRecipes } from '@/lib/hooks/useRecipes';
import { useBlogPosts } from '@/lib/hooks/useBlog';
import { RecipeCard } from '@/components/RecipeCard';
import { BlogPostCard } from '@/components/BlogPostCard';
import { RecipeCardLoader } from '@/components/ui/LoadingPlaceholder';
import { Filter, ArrowRight } from 'lucide-react';

export default function HomePage() {
  const { data, isLoading, error } = useTrendingRecipes({ page: 1, limit: 20 });
  const { data: blogData, isLoading: blogLoading } = useBlogPosts({
    published: true,
  });

  const blogPosts = Array.isArray(blogData?.data) 
    ? blogData.data.slice(0, 3) 
    : [];

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-neutral-heading mb-2">
            Oops! Something went wrong
          </h2>
          <p className="text-neutral-text">
            We couldn&apos;t load the recipes. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-neutral-heading mb-2">
            Trending Recipes
          </h1>
          <p className="text-neutral-text">
            Discover the most popular recipes shared by our community
          </p>
        </div>
        <Link
          href="/recipes"
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-neutral-light hover:bg-neutral-light transition-colors"
        >
          <Filter className="w-4 h-4" />
          <span className="hidden sm:inline">Filter & Search</span>
        </Link>
      </div>

      {/* Recipe Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <RecipeCardLoader key={i} />
          ))}
        </div>
      ) : data?.data?.data && Array.isArray(data.data.data) && data.data.data.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {data.data.data.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-neutral-text text-lg mb-4">
            No recipes yet. Be the first to share one!
          </p>
          <Link
            href="/recipes/new"
            className="inline-block px-6 py-3 bg-forest-600 text-white rounded-lg hover:bg-forest-700 transition-colors"
          >
            Create Recipe
          </Link>
        </div>
      )}

      {/* Blog Section */}
      {blogPosts.length > 0 && (
        <div className="mt-16 pt-12 border-t border-gray-200">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-neutral-heading mb-2">
                From Our Blog
              </h2>
              <p className="text-neutral-text">
                Stories, tips, and inspiration from our kitchen
              </p>
            </div>
            <Link
              href="/blog"
            className="flex items-center gap-2 px-4 py-2 text-forest-600 hover:bg-forest-600/10 rounded-lg transition-colors"
            >
              <span>View All</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {blogLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-64 bg-gray-200 rounded-md animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogPosts.map((post) => (
                <BlogPostCard key={post.id} blogPost={post} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
