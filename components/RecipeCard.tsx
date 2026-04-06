'use client';

import React from 'react';
import { Heart, Clock, Users, ChefHat } from 'lucide-react';
import type { Recipe } from '@/lib/types';
import { Card } from './ui/Card';
import { useLikeRecipe } from '@/lib/hooks/useRecipes';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface RecipeCardProps {
  recipe: Recipe;
}

export const RecipeCard: React.FC<RecipeCardProps> = ({ recipe }) => {
  const likeMutation = useLikeRecipe();

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    likeMutation.mutate(recipe.id);
  };

  const totalTime = recipe.prep_time + recipe.cook_time;
  // Images will be served from Supabase Storage or API routes
  const imageUrl = recipe.image_url 
    ? recipe.image_url
    : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400';

  const difficultyColors = {
    easy: 'text-green-600',
    medium: 'text-yellow-600',
    hard: 'text-red-600',
  };

  return (
    <Link href={`/recipes/${recipe.id}`} data-testid={`recipe-card-${recipe.id}`}>
      <Card hover className="group">
        {/* Image */}
        <div className="relative aspect-square overflow-hidden bg-neutral-light">
          <img
            src={imageUrl}
            alt={`${recipe.title} - A ${recipe.difficulty} recipe that serves ${recipe.servings} and takes ${totalTime} minutes to prepare`}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
            onError={(e) => {
              e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400';
            }}
          />
          
          {/* Like button */}
          <button
            onClick={handleLike}
            data-testid={`recipe-like-button-${recipe.id}`}
            aria-label={recipe.is_liked ? `Unlike ${recipe.title}` : `Like ${recipe.title}`}
            aria-pressed={recipe.is_liked}
            className={cn(
              'absolute bottom-3 right-3 p-2 rounded-full backdrop-blur-sm',
              'transition-all duration-200 hover:scale-110',
              'focus:outline-none focus:ring-2 focus:ring-peach-400',
              recipe.is_liked
                ? 'bg-peach-400 text-white'
                : 'bg-white/90 text-neutral-text hover:bg-white'
            )}
          >
            <Heart
              className={cn(
                'w-5 h-5 transition-all',
                recipe.is_liked && 'fill-current animate-heart-pop'
              )}
              aria-hidden="true"
            />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Title */}
          <h3 className="text-lg font-semibold text-neutral-heading line-clamp-2 group-hover:text-forest-600 transition-colors">
            {recipe.title}
          </h3>

          {/* User */}
          {recipe.user && (
            <p className="text-sm text-neutral-text">
              by {recipe.user.username}
            </p>
          )}

          {/* Metadata */}
          <div className="flex flex-wrap gap-3 text-sm text-neutral-text">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" aria-hidden="true" />
              <span>{totalTime} min</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" aria-hidden="true" />
              <span>{recipe.servings} servings</span>
            </div>
            <div className={cn('flex items-center gap-1 capitalize', difficultyColors[recipe.difficulty])}>
              <ChefHat className="w-4 h-4" aria-hidden="true" />
              <span>{recipe.difficulty}</span>
            </div>
          </div>

          {/* Likes */}
          <div className="flex items-center gap-1 text-sm text-neutral-text pt-2 border-t border-neutral-light">
            <Heart className="w-4 h-4" aria-hidden="true" />
            <span>{recipe.likes_count} {recipe.likes_count === 1 ? 'like' : 'likes'}</span>
          </div>
        </div>
      </Card>
    </Link>
  );
};
