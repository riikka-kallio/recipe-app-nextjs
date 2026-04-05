'use client';

import React from 'react';
import { Heart, Calendar, Eye } from 'lucide-react';
import type { BlogPost } from '@/lib/types';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { useLikeBlogPost } from '@/lib/hooks/useBlog';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface BlogPostCardProps {
  blogPost: BlogPost;
}

export const BlogPostCard: React.FC<BlogPostCardProps> = ({ blogPost }) => {
  const likeMutation = useLikeBlogPost();

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    likeMutation.mutate(blogPost.id);
  };

  // Images will be served from Supabase Storage or API routes
  const imageUrl = blogPost.featured_image_url 
    ? blogPost.featured_image_url
    : 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600';

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Extract plain text from HTML content for excerpt
  const getExcerpt = () => {
    if (blogPost.excerpt) return blogPost.excerpt;
    
    if (typeof document !== 'undefined') {
      const div = document.createElement('div');
      div.innerHTML = blogPost.content;
      const text = div.textContent || div.innerText || '';
      return text.slice(0, 150) + (text.length > 150 ? '...' : '');
    }
    
    // Fallback for SSR
    return blogPost.content.slice(0, 150) + '...';
  };

  return (
    <Link href={`/blog/${blogPost.id}`}>
      <Card hover className="group h-full flex flex-col">
        {/* Image */}
        <div className="relative aspect-video overflow-hidden bg-neutral-light rounded-t-lg">
          <img
            src={imageUrl}
            alt={`${blogPost.title} - Blog post with ${blogPost.view_count} views and ${blogPost.likes_count} likes`}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.src = 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600';
            }}
          />

          {/* Like button */}
          <button
            onClick={handleLike}
            aria-label={blogPost.is_liked ? `Unlike ${blogPost.title}` : `Like ${blogPost.title}`}
            aria-pressed={blogPost.is_liked}
            className={cn(
              'absolute bottom-3 right-3 p-2 rounded-full backdrop-blur-sm',
              'transition-all duration-200 hover:scale-110',
              'focus:outline-none focus:ring-2 focus:ring-peach-400',
              blogPost.is_liked
                ? 'bg-peach-400 text-white'
                : 'bg-white/90 text-neutral-text hover:bg-white'
            )}
          >
            <Heart
              className={cn(
                'w-5 h-5 transition-all',
                blogPost.is_liked && 'fill-current'
              )}
              aria-hidden="true"
            />
          </button>

          {/* Published badge */}
          {!blogPost.published && (
            <div className="absolute top-3 left-3">
              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                Draft
              </Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5 space-y-3 flex-1 flex flex-col">
          {/* Categories */}
          {blogPost.categories && blogPost.categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {blogPost.categories.slice(0, 2).map((category) => (
                <Badge key={category.id} className="text-xs">
                  {category.name}
                </Badge>
              ))}
            </div>
          )}

          {/* Title */}
          <h3 className="text-xl font-semibold text-neutral-heading line-clamp-2 group-hover:text-forest-600 transition-colors">
            {blogPost.title}
          </h3>

          {/* Excerpt */}
          <p className="text-sm text-neutral-text line-clamp-3 flex-1">
            {getExcerpt()}
          </p>

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-neutral-text pt-3 border-t border-neutral-light">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" aria-hidden="true" />
              <span>{formatDate(blogPost.created_at)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Eye className="w-4 h-4" aria-hidden="true" />
              <span>{blogPost.view_count} views</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart className="w-4 h-4" aria-hidden="true" />
              <span>{blogPost.likes_count}</span>
            </div>
          </div>

          {/* Author */}
          {blogPost.user && (
            <p className="text-xs text-neutral-text">
              by {blogPost.user.username}
            </p>
          )}
        </div>
      </Card>
    </Link>
  );
};
