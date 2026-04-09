'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useRecipes, useTags } from '@/lib/hooks/useRecipes';
import { RecipeCard } from '@/components/RecipeCard';
import { RecipeCardLoader } from '@/components/ui/LoadingPlaceholder';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { X, Search } from 'lucide-react';
import type { RecipeFilters } from '@/lib/types';

function RecipesPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: tagsData } = useTags();

  const [filters, setFilters] = useState<RecipeFilters>({
    q: searchParams.get('q') || undefined,
    difficulty: (searchParams.get('difficulty') as 'easy' | 'medium' | 'hard') || undefined,
    max_prep_time: searchParams.get('max_prep_time') ? Number(searchParams.get('max_prep_time')) : undefined,
    max_cook_time: searchParams.get('max_cook_time') ? Number(searchParams.get('max_cook_time')) : undefined,
    tags: searchParams.get('tags')?.split(',').map(Number).filter(Boolean) || undefined,
  });

  const { data, isLoading, error } = useRecipes(filters, { page: 1, limit: 20 });

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.q) params.set('q', filters.q);
    if (filters.difficulty) params.set('difficulty', filters.difficulty);
    if (filters.max_prep_time) params.set('max_prep_time', String(filters.max_prep_time));
    if (filters.max_cook_time) params.set('max_cook_time', String(filters.max_cook_time));
    if (filters.tags && filters.tags.length > 0) params.set('tags', filters.tags.join(','));
    
    const queryString = params.toString();
    router.replace(queryString ? `/recipes?${queryString}` : '/recipes');
  }, [filters, router]);

  const updateFilter = (key: keyof RecipeFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value || undefined }));
  };

  const toggleTag = (tagId: number) => {
    setFilters(prev => {
      const currentTags = prev.tags || [];
      const newTags = currentTags.includes(tagId)
        ? currentTags.filter(id => id !== tagId)
        : [...currentTags, tagId];
      return { ...prev, tags: newTags.length > 0 ? newTags : undefined };
    });
  };

  const clearFilters = () => {
    setFilters({});
    router.replace('/recipes');
  };

  const hasActiveFilters = Object.values(filters).some(v => v !== undefined);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-neutral-heading mb-8">Browse Recipes</h1>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-neutral-light p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-neutral-heading">Filters</h2>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-neutral-text hover:text-neutral-heading flex items-center gap-1"
            >
              <X className="w-4 h-4" />
              Clear all
            </button>
          )}
        </div>

        <div className="space-y-6">
          {/* Search */}
          <div className="relative">
            <Input
              placeholder="Search recipes..."
              value={filters.q || ''}
              onChange={(e) => updateFilter('q', e.target.value)}
              className="pl-10"
              fullWidth
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-text/50" />
          </div>

          {/* Difficulty & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Select
              label="Difficulty"
              value={filters.difficulty || ''}
              onChange={(e) => updateFilter('difficulty', e.target.value)}
              options={[
                { value: '', label: 'Any' },
                { value: 'easy', label: 'Easy' },
                { value: 'medium', label: 'Medium' },
                { value: 'hard', label: 'Hard' },
              ]}
              fullWidth
            />

            <Input
              label="Max Prep Time (min)"
              type="number"
              value={filters.max_prep_time || ''}
              onChange={(e) => updateFilter('max_prep_time', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="e.g., 30"
              fullWidth
            />

            <Input
              label="Max Cook Time (min)"
              type="number"
              value={filters.max_cook_time || ''}
              onChange={(e) => updateFilter('max_cook_time', e.target.value ? Number(e.target.value) : undefined)}
              placeholder="e.g., 60"
              fullWidth
            />
          </div>

          {/* Tags */}
          {tagsData?.data?.grouped && (
            <div className="space-y-4">
              {Object.entries(tagsData.data.grouped).map(([category, tags]) => (
                <div key={category}>
                  <h3 className="text-sm font-medium text-neutral-text capitalize mb-2">
                    {category.replace('_', ' ')}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant={filters.tags?.includes(tag.id) ? 'active' : 'default'}
                        onClick={() => toggleTag(tag.id)}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      {error ? (
        <div className="text-center py-12">
          <p className="text-neutral-text">Failed to load recipes. Please try again.</p>
        </div>
      ) : isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <RecipeCardLoader key={i} />
          ))}
        </div>
      ) : data?.data && data.data.length > 0 ? (
        <>
          <p className="text-neutral-text mb-4">
            Found {data.pagination?.total || 0} recipe{data.pagination?.total !== 1 ? 's' : ''}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {data.data.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-neutral-text text-lg">No recipes found matching your filters.</p>
          <button
            onClick={clearFilters}
            className="mt-4 text-forest-600 hover:text-forest-700 font-medium"
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}

export default function RecipesPage() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <RecipeCardLoader key={i} />
          ))}
        </div>
      </div>
    }>
      <RecipesPageContent />
    </Suspense>
  );
}

