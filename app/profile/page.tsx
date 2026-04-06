'use client';

import React from 'react';
import { useCurrentUser, useUserRecipes } from '@/lib/hooks/useRecipes';
import { RecipeCard } from '@/components/RecipeCard';
import { RecipeCardLoader } from '@/components/ui/LoadingPlaceholder';
import { User } from 'lucide-react';

// Mock UUID for Phase 4 (will be replaced with real auth in Phase 7)
const MOCK_USER_ID = '550e8400-e29b-41d4-a716-446655440000';

export default function ProfilePage() {
  const { data: userData, isLoading: userLoading } = useCurrentUser();
  const { data: recipesData, isLoading: recipesLoading } = useUserRecipes(MOCK_USER_ID);

  if (userLoading) {
    return <div className="max-w-7xl mx-auto px-4 py-8">Loading...</div>;
  }

  const user = userData?.data;
  const recipes = recipesData?.data?.data || [];
  const totalRecipes = recipesData?.data?.pagination?.total || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="bg-white rounded-xl border border-neutral-light p-8 mb-8">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-forest-100 flex items-center justify-center">
            <User className="w-12 h-12 text-forest-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-neutral-heading mb-2">
              {user?.username || 'Guest User'}
            </h1>
            <p className="text-neutral-text">{user?.email}</p>
            <div className="mt-3 text-sm text-neutral-text">
              {totalRecipes} recipe{totalRecipes !== 1 ? 's' : ''} shared
            </div>
          </div>
        </div>
      </div>

      {/* User's Recipes */}
      <div>
        <h2 className="text-2xl font-bold text-neutral-heading mb-6">My Recipes</h2>
        
        {recipesLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <RecipeCardLoader key={i} />
            ))}
          </div>
        ) : recipes.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {recipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-xl border border-neutral-light">
            <p className="text-neutral-text text-lg">You haven&apos;t created any recipes yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
