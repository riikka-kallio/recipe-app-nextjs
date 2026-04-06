'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useRecipe, useLikeRecipe, useDeleteRecipe } from '@/lib/hooks/useRecipes';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Heart, Clock, Users, ChefHat, Edit, Trash2, ArrowLeft, CookingPot } from 'lucide-react';
import { cn } from '@/lib/utils';

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

export default function RecipeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { data, isLoading, error } = useRecipe(Number(id));
  const likeMutation = useLikeRecipe();
  const deleteMutation = useDeleteRecipe();

  const handleLike = () => {
    if (id) {
      likeMutation.mutate(Number(id));
    }
  };

  const handleDelete = () => {
    if (id && window.confirm('Are you sure you want to delete this recipe?')) {
      deleteMutation.mutate(Number(id), {
        onSuccess: () => {
          router.push('/');
        },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-96 bg-neutral-light rounded-xl" />
          <div className="h-8 bg-neutral-light rounded w-3/4" />
          <div className="h-4 bg-neutral-light rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center">
        <h2 className="text-2xl font-bold text-neutral-heading mb-2">Recipe not found</h2>
        <p className="text-neutral-text mb-4">The recipe you&apos;re looking for doesn&apos;t exist.</p>
        <Link href="/">
          <Button>Back to Home</Button>
        </Link>
      </div>
    );
  }

  const recipe = data.data;
  const totalTime = recipe.prep_time + recipe.cook_time;
  // Images are served at /api/uploads, stored as /uploads in DB
  const imageUrl = recipe.image_url
    ? `${BASE_URL}/api${recipe.image_url}`
    : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200';

  const difficultyColors = {
    easy: 'text-green-600 bg-green-50',
    medium: 'text-yellow-600 bg-yellow-50',
    hard: 'text-red-600 bg-red-50',
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Back Button */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-neutral-text hover:text-neutral-heading mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Back
      </button>

      {/* Hero Image */}
      <div className="relative w-full rounded-xl overflow-hidden mb-8">
        <img
          src={imageUrl}
          alt={recipe.title}
          className="w-full h-auto max-h-[400px] md:max-h-[600px] lg:max-h-[800px] object-cover"
          onError={(e) => {
            e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200';
          }}
        />
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-neutral-heading mb-2">{recipe.title}</h1>
            {recipe.user && (
              <p className="text-neutral-text">by {recipe.user.username}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              onClick={() => router.push(`/recipes/${id}/cook`)}
              className="flex items-center gap-2"
            >
              <CookingPot className="w-5 h-5" />
              <span className="hidden sm:inline">Start Cooking</span>
            </Button>

            <Button
              variant={recipe.is_liked ? 'secondary' : 'ghost'}
              onClick={handleLike}
              className="flex items-center gap-2"
            >
              <Heart className={cn('w-5 h-5', recipe.is_liked && 'fill-current')} />
              <span>{recipe.likes_count}</span>
            </Button>

            <Button variant="ghost" onClick={() => router.push(`/recipes/${id}/edit`)}>
              <Edit className="w-5 h-5" />
            </Button>

            <Button variant="danger" onClick={handleDelete}>
              <Trash2 className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Description */}
        {recipe.description && (
          <p className="text-lg text-neutral-text mb-6">{recipe.description}</p>
        )}

        {/* Metadata */}
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-neutral-light">
            <Clock className="w-5 h-5 text-forest-600" />
            <div>
              <div className="text-sm text-neutral-text">Total Time</div>
              <div className="font-semibold">{totalTime} min</div>
            </div>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-neutral-light">
            <Users className="w-5 h-5 text-forest-600" />
            <div>
              <div className="text-sm text-neutral-text">Servings</div>
              <div className="font-semibold">{recipe.servings}</div>
            </div>
          </div>

          <div className={cn('flex items-center gap-2 px-4 py-2 rounded-lg border capitalize', difficultyColors[recipe.difficulty])}>
            <ChefHat className="w-5 h-5" />
            <div>
              <div className="text-sm">Difficulty</div>
              <div className="font-semibold">{recipe.difficulty}</div>
            </div>
          </div>
        </div>

        {/* Tags */}
        {recipe.tags && recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {recipe.tags.map((tag) => (
              <Badge key={tag.id}>{tag.name}</Badge>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="grid md:grid-cols-2 gap-8">
        {/* Ingredients */}
        <div>
          <h2 className="text-2xl font-bold text-neutral-heading mb-4">Ingredients</h2>
          <div className="bg-white rounded-lg border border-neutral-light p-6">
            <ul className="space-y-3">
              {recipe.ingredients?.filter(ing => !ing.is_garnish).map((ingredient) => (
                <li key={ingredient.id} className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    className="mt-1 w-4 h-4 text-forest-600 border-neutral-light rounded focus:ring-forest-500"
                  />
                  <span className="flex-1">
                    {ingredient.quantity && ingredient.unit && (
                      <span className="font-medium">{ingredient.quantity} {ingredient.unit}</span>
                    )}{' '}
                    {ingredient.item}
                  </span>
                </li>
              ))}
            </ul>

            {/* Garnish Section */}
            {recipe.ingredients?.some(ing => ing.is_garnish) && (
              <div className="mt-6 pt-6 border-t border-neutral-light">
                <h3 className="text-sm font-semibold text-neutral-heading mb-3">For Serving</h3>
                <ul className="space-y-3">
                  {recipe.ingredients?.filter(ing => ing.is_garnish).map((ingredient) => (
                    <li key={ingredient.id} className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        className="mt-1 w-4 h-4 text-forest-600 border-neutral-light rounded focus:ring-forest-500"
                      />
                      <span className="flex-1">
                        {ingredient.quantity && ingredient.unit && (
                          <span className="font-medium">{ingredient.quantity} {ingredient.unit}</span>
                        )}{' '}
                        {ingredient.item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div>
          <h2 className="text-2xl font-bold text-neutral-heading mb-4">Instructions</h2>
          <div className="space-y-4">
            {recipe.instructions?.map((instruction) => (
              <div key={instruction.id} className="flex gap-4">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-forest-600 text-white flex items-center justify-center font-semibold">
                  {instruction.step_number}
                </div>
                <p className="flex-1 text-neutral-text pt-1">{instruction.instruction}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
