'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Heart, Calendar, Eye, Edit, Trash2 } from 'lucide-react';
import {
  useBlogPost,
  useLikeBlogPost,
  useDeleteBlogPost,
} from '@/lib/hooks/useBlog';
import { Badge } from '@/components/ui/Badge';
import { RecipeCard } from '@/components/RecipeCard';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

export default function BlogPostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const blogPostId = id ? Number(id) : 0;

  const { data: blogPostData, isLoading, error } = useBlogPost(blogPostId);
  const likeMutation = useLikeBlogPost();
  const deleteMutation = useDeleteBlogPost();

  const blogPost = blogPostData?.data;

  const handleLike = () => {
    if (!blogPost) return;
    likeMutation.mutate(blogPost.id);
  };

  const handleDelete = async () => {
    if (!blogPost) return;
    
    if (
      window.confirm(
        'Are you sure you want to delete this blog post? This action cannot be undone.'
      )
    ) {
      try {
        await deleteMutation.mutateAsync(blogPost.id);
        router.push('/blog');
      } catch (error) {
        console.error('Failed to delete blog post:', error);
        alert('Failed to delete blog post. Please try again.');
      }
    }
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Handle both legacy full URLs and new relative paths
  const getFeaturedImageUrl = (url: string) => {
    // If it's already a full URL (starts with http), use it directly
    if (url.startsWith('http')) {
      return url;
    }
    // Otherwise, it's a relative path - construct the full URL
    return `${BASE_URL}/api${url}`;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-forest-600"></div>
          <p className="mt-4 text-gray-600">Loading blog post...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !blogPost) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-700">
            Failed to load blog post. It may have been deleted or doesn&apos;t exist.
          </p>
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 mt-4 text-forest-600 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back button */}
      <button
        onClick={() => router.push('/blog')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Blog
      </button>

      {/* Header */}
      <article className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Featured Image */}
        {blogPost.featured_image_url && (
          <div className="w-full h-96 overflow-hidden">
            <img
              src={getFeaturedImageUrl(blogPost.featured_image_url)}
              alt={blogPost.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="p-8">
          {/* Draft Badge */}
          {!blogPost.published && (
            <div className="mb-4">
              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                Draft
              </Badge>
            </div>
          )}

          {/* Title */}
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {blogPost.title}
          </h1>

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-6 pb-6 border-b border-gray-200">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{formatDate(blogPost.created_at)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" />
              <span>{blogPost.view_count} views</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart className="w-4 h-4" />
              <span>{blogPost.likes_count} likes</span>
            </div>
          </div>

          {/* Categories */}
          {blogPost.categories && blogPost.categories.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {blogPost.categories.map((category) => (
                <Badge
                  key={category.id}
                  className="bg-forest-600/10 text-forest-600 border-forest-600/20"
                >
                  {category.name}
                </Badge>
              ))}
            </div>
          )}

          {/* Excerpt */}
          {blogPost.excerpt && (
            <p className="text-xl text-gray-600 mb-8 italic">
              {blogPost.excerpt}
            </p>
          )}

          {/* Content */}
          <div
            className="prose prose-lg max-w-none mb-8"
            dangerouslySetInnerHTML={{ __html: blogPost.content }}
          />

          {/* Linked Recipes */}
          {blogPost.recipes && blogPost.recipes.length > 0 && (
            <div className="mt-12 pt-8 border-t border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Related Recipes
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {blogPost.recipes.map((recipe) => (
                  <RecipeCard key={recipe.id} recipe={recipe} />
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="mt-8 pt-6 border-t border-gray-200 flex items-center justify-between">
            <button
              onClick={handleLike}
              disabled={likeMutation.isPending}
              className={`flex items-center gap-2 px-6 py-3 rounded-md transition-colors ${
                blogPost.is_liked
                  ? 'bg-peach text-white hover:bg-peach-dark'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Heart
                className={`w-5 h-5 ${blogPost.is_liked ? 'fill-current' : ''}`}
              />
              {blogPost.is_liked ? 'Liked' : 'Like'}
            </button>

            <div className="flex gap-3">
              <Link
                href={`/blog/${blogPost.id}/edit`}
                className="flex items-center gap-2 px-4 py-2 text-forest-600 hover:bg-forest-600/10 rounded-md transition-colors"
              >
                <Edit className="w-4 h-4" />
                Edit
              </Link>
              <button
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
