'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
import { useBlogPosts, useCategories } from '@/lib/hooks/useBlog';
import { BlogPostCard } from '@/components/BlogPostCard';

export default function BlogPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(
    undefined
  );
  const [showDrafts, setShowDrafts] = useState(false);

  const { data: categoriesData } = useCategories();
  const categories = categoriesData?.data || [];

  const { data: blogPostsData, isLoading, error } = useBlogPosts({
    q: searchQuery || undefined,
    category_ids: selectedCategory ? [selectedCategory] : undefined,
    published: showDrafts ? undefined : true,
  });

  const blogPosts = Array.isArray(blogPostsData?.data) 
    ? blogPostsData.data 
    : [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900">Blog</h1>
          <p className="text-gray-600 mt-2">
            Stories, tips, and inspiration from our kitchen
          </p>
        </div>
        <Link
          href="/blog/new"
          className="inline-flex items-center gap-2 px-6 py-3 bg-forest-600 text-white rounded-md hover:bg-forest-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          New Post
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search blog posts..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-forest-600"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory || ''}
              onChange={(e) =>
                setSelectedCategory(
                  e.target.value ? Number(e.target.value) : undefined
                )
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-forest-600"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Published Filter */}
          <div className="flex items-center">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showDrafts}
                onChange={(e) => setShowDrafts(e.target.checked)}
                className="w-4 h-4 text-forest-600 border-gray-300 rounded focus:ring-forest-600"
              />
              <span className="text-gray-700">Show drafts</span>
            </label>
          </div>
        </div>

        {/* Active Filters Summary */}
        {(searchQuery || selectedCategory || showDrafts) && (
          <div className="mt-4 pt-4 border-t border-gray-200 flex items-center gap-2 text-sm text-gray-600">
            <span className="font-medium">Active filters:</span>
            {searchQuery && (
              <span className="px-2 py-1 bg-gray-100 rounded">
                Search: &quot;{searchQuery}&quot;
              </span>
            )}
            {selectedCategory && (
              <span className="px-2 py-1 bg-gray-100 rounded">
                Category:{' '}
                {categories.find((c) => c.id === selectedCategory)?.name}
              </span>
            )}
            {showDrafts && (
              <span className="px-2 py-1 bg-gray-100 rounded">
                Including drafts
              </span>
            )}
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory(undefined);
                setShowDrafts(false);
              }}
              className="ml-2 text-forest-600 hover:underline"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-forest-600"></div>
          <p className="mt-4 text-gray-600">Loading blog posts...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700">
            Failed to load blog posts. Please try again later.
          </p>
        </div>
      )}

      {/* Blog Posts Grid */}
      {!isLoading && !error && (
        <>
          {blogPosts.length === 0 ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-12 text-center">
              <p className="text-gray-600 text-lg">
                {searchQuery || selectedCategory || showDrafts
                  ? 'No blog posts found matching your filters.'
                  : 'No blog posts yet. Create your first post!'}
              </p>
              <Link
                href="/blog/new"
                className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-forest-600 text-white rounded-md hover:bg-forest-700 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create First Post
              </Link>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {blogPosts.map((post) => (
                  <BlogPostCard key={post.id} blogPost={post} />
                ))}
              </div>
              <div className="text-center text-gray-600">
                Showing {blogPosts.length} post{blogPosts.length !== 1 ? 's' : ''}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
