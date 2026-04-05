import api, { type ApiResponse } from './api';
import type {
  Recipe,
  CreateRecipeRequest,
  UpdateRecipeRequest,
  RecipeFilters,
  PaginationParams,
  PaginatedResponse,
  Tag,
  User,
} from '@/lib/types';

// Recipes
export const recipeService = {
  getAll: async (filters?: RecipeFilters, pagination?: PaginationParams) => {
    const params = { ...filters, ...pagination };
    return api.get<PaginatedResponse<Recipe>>('/recipes', params);
  },

  getTrending: async (pagination?: PaginationParams) => {
    return api.get<PaginatedResponse<Recipe>>('/recipes/trending', pagination);
  },

  getById: async (id: number) => {
    return api.get<Recipe>(`/recipes/${id}`);
  },

  create: async (data: CreateRecipeRequest) => {
    return api.post<Recipe>('/recipes', data);
  },

  update: async (id: number, data: UpdateRecipeRequest) => {
    return api.put<Recipe>(`/recipes/${id}`, data);
  },

  delete: async (id: number) => {
    return api.delete<void>(`/recipes/${id}`);
  },

  toggleLike: async (id: number) => {
    return api.post<{ is_liked: boolean }>(`/recipes/${id}/like`);
  },
};

// Tags
export const tagService = {
  getAll: async () => {
    return api.get<{ all: Tag[]; grouped: Record<string, Tag[]> }>('/tags');
  },
};

// Upload
export const uploadService = {
  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post<{ url: string; filename: string }>('/upload', formData);
  },
};

// Users
export const userService = {
  getCurrentUser: async () => {
    return api.get<User>('/users/me');
  },

  getUserRecipes: async (userId: string, pagination?: PaginationParams) => {
    return api.get<PaginatedResponse<Recipe>>(`/users/${userId}/recipes`, pagination);
  },
};
