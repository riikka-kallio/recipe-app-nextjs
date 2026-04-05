// User types
export interface User {
  id: string; // Changed from number to string (UUID)
  username: string;
  email: string;
  created_at: Date | string;
  updated_at: Date | string;
}

// Recipe types
export interface Recipe {
  id: number;
  user_id: string; // Changed from number to string (UUID)
  title: string;
  description: string | null;
  image_url: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  prep_time: number; // in minutes
  cook_time: number; // in minutes
  servings: number;
  likes_count: number;
  created_at: Date | string;
  updated_at: Date | string;
  user?: User; // Optional populated user
  ingredients?: Ingredient[];
  instructions?: Instruction[];
  tags?: Tag[];
  is_liked?: boolean; // For current user
}

export interface Ingredient {
  id: number;
  recipe_id: number;
  item: string;
  quantity: string | null;
  unit: string | null;
  order_index: number;
  is_garnish?: boolean;
}

export interface Instruction {
  id: number;
  recipe_id: number;
  step_number: number;
  instruction: string;
}

// Tag types
export type TagCategory = 'dietary' | 'cuisine' | 'meal_type';

export interface Tag {
  id: number;
  name: string;
  category: TagCategory;
}

// Like types
export interface Like {
  id: number;
  user_id: string; // Changed from number to string (UUID)
  recipe_id: number;
  created_at: Date | string;
}

// API Request/Response types
export interface CreateRecipeRequest {
  title: string;
  description?: string;
  image_url?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  prep_time: number;
  cook_time: number;
  servings: number;
  ingredients: Array<{
    item: string;
    quantity?: string;
    unit?: string;
    is_garnish?: boolean;
  }>;
  instructions: Array<{
    instruction: string;
  }>;
  tag_ids: number[];
}

export interface UpdateRecipeRequest extends Partial<CreateRecipeRequest> {}

export interface RecipeFilters {
  q?: string; // search query
  tags?: number[]; // tag IDs
  difficulty?: 'easy' | 'medium' | 'hard';
  max_prep_time?: number;
  max_cook_time?: number;
  user_id?: string; // Changed from number to string (UUID)
}

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Blog Category types
export interface BlogCategory {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  created_at: Date | string;
  updated_at: Date | string;
}

// Blog Post types
export interface BlogPost {
  id: number;
  user_id: string; // Changed from number to string (UUID)
  title: string;
  content: string; // HTML from TipTap
  excerpt: string | null;
  featured_image_url: string | null;
  published: boolean;
  likes_count: number;
  view_count: number;
  created_at: Date | string;
  updated_at: Date | string;
  // Relations
  user?: User;
  categories?: BlogCategory[];
  recipes?: Recipe[];
  media?: BlogPostMedia[];
  is_liked?: boolean; // For current user
}

export interface BlogPostMedia {
  id: number;
  blog_post_id: number;
  media_type: 'image' | 'audio';
  media_url: string;
  caption: string | null;
  order_index: number;
  created_at: Date | string;
}

export interface BlogPostLike {
  id: number;
  user_id: string; // Changed from number to string (UUID)
  blog_post_id: number;
  created_at: Date | string;
}

// Blog API Request types
export interface CreateBlogPostRequest {
  title: string;
  content: string;
  excerpt?: string;
  featured_image_url?: string;
  published?: boolean;
  category_ids?: number[];
  recipe_ids?: number[];
}

export interface UpdateBlogPostRequest extends Partial<CreateBlogPostRequest> {}

export interface BlogPostFilters {
  q?: string; // search query
  published?: boolean;
  user_id?: string; // Changed from number to string (UUID)
  category_ids?: number[];
  recipe_id?: number;
}

// Mock User ID for development (Phase 2-6)
export const MOCK_USER_ID = '550e8400-e29b-41d4-a716-446655440000';
