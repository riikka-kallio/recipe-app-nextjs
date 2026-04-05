import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { recipeService, tagService, uploadService, userService } from '@/lib/services/recipeService';
import type { CreateRecipeRequest, UpdateRecipeRequest, RecipeFilters, PaginationParams } from '@/lib/types';
import toast from 'react-hot-toast';

// Query Keys
export const queryKeys = {
  recipes: ['recipes'] as const,
  recipesTrending: ['recipes', 'trending'] as const,
  recipe: (id: number) => ['recipes', id] as const,
  tags: ['tags'] as const,
  currentUser: ['user', 'me'] as const,
  userRecipes: (userId: string) => ['users', userId, 'recipes'] as const,
};

// Recipes
export const useRecipes = (filters?: RecipeFilters, pagination?: PaginationParams) => {
  return useQuery({
    queryKey: [...queryKeys.recipes, filters, pagination],
    queryFn: () => recipeService.getAll(filters, pagination),
  });
};

export const useTrendingRecipes = (pagination?: PaginationParams) => {
  return useQuery({
    queryKey: [...queryKeys.recipesTrending, pagination],
    queryFn: () => recipeService.getTrending(pagination),
  });
};

export const useRecipe = (id: number) => {
  return useQuery({
    queryKey: queryKeys.recipe(id),
    queryFn: () => recipeService.getById(id),
    enabled: !!id,
  });
};

export const useCreateRecipe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateRecipeRequest) => recipeService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recipes });
      queryClient.invalidateQueries({ queryKey: queryKeys.recipesTrending });
      toast.success('Recipe created successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create recipe');
    },
  });
};

export const useUpdateRecipe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateRecipeRequest }) =>
      recipeService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recipe(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.recipes });
      toast.success('Recipe updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update recipe');
    },
  });
};

export const useDeleteRecipe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => recipeService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recipes });
      queryClient.invalidateQueries({ queryKey: queryKeys.recipesTrending });
      toast.success('Recipe deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete recipe');
    },
  });
};

export const useLikeRecipe = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => recipeService.toggleLike(id),
    onMutate: async (id) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: queryKeys.recipe(id) });

      const previousRecipe = queryClient.getQueryData(queryKeys.recipe(id));

      queryClient.setQueryData(queryKeys.recipe(id), (old: any) => {
        if (!old) return old;
        return {
          ...old,
          data: {
            ...old.data,
            is_liked: !old.data.is_liked,
            likes_count: old.data.is_liked ? old.data.likes_count - 1 : old.data.likes_count + 1,
          },
        };
      });

      return { previousRecipe };
    },
    onError: (_err, id, context) => {
      if (context?.previousRecipe) {
        queryClient.setQueryData(queryKeys.recipe(id), context.previousRecipe);
      }
      toast.error('Failed to update like');
    },
    onSettled: (_data, _error, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recipe(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.recipes });
    },
  });
};

// Tags
export const useTags = () => {
  return useQuery({
    queryKey: queryKeys.tags,
    queryFn: () => tagService.getAll(),
    staleTime: 1000 * 60 * 60, // Tags don't change often, cache for 1 hour
  });
};

// Upload
export const useUploadImage = () => {
  return useMutation({
    mutationFn: (file: File) => uploadService.uploadImage(file),
    onError: (error: any) => {
      toast.error(error.message || 'Failed to upload image');
    },
  });
};

// Users
export const useCurrentUser = () => {
  return useQuery({
    queryKey: queryKeys.currentUser,
    queryFn: () => userService.getCurrentUser(),
  });
};

export const useUserRecipes = (userId: string, pagination?: PaginationParams) => {
  return useQuery({
    queryKey: [...queryKeys.userRecipes(userId), pagination],
    queryFn: () => userService.getUserRecipes(userId, pagination),
    enabled: !!userId,
  });
};
