import api, { type ApiResponse } from './api';
import type {
  BlogPost,
  CreateBlogPostRequest,
  UpdateBlogPostRequest,
  BlogPostFilters,
  PaginationParams,
  PaginatedResponse,
  BlogCategory,
} from '@/lib/types';

// Blog Posts
export const blogService = {
  getAll: async (filters?: BlogPostFilters, pagination?: PaginationParams) => {
    const params = { ...filters, ...pagination };
    return api.get<PaginatedResponse<BlogPost>>('/blog', params);
  },

  getById: async (id: number) => {
    return api.get<BlogPost>(`/blog/${id}`);
  },

  create: async (data: CreateBlogPostRequest) => {
    return api.post<BlogPost>('/blog', data);
  },

  update: async (id: number, data: UpdateBlogPostRequest) => {
    return api.put<BlogPost>(`/blog/${id}`, data);
  },

  delete: async (id: number) => {
    return api.delete<void>(`/blog/${id}`);
  },

  toggleLike: async (id: number) => {
    return api.post<{ isLiked: boolean }>(`/blog/${id}/like`);
  },
};

// Blog Categories
export const categoryService = {
  getAll: async () => {
    return api.get<BlogCategory[]>('/categories');
  },

  getById: async (id: number) => {
    return api.get<BlogCategory>(`/categories/${id}`);
  },

  getBySlug: async (slug: string) => {
    return api.get<BlogCategory>(`/categories/slug/${slug}`);
  },
};

// Upload (extended for blog media)
export const uploadServiceExtended = {
  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return api.post<{ url: string; filename: string }>('/upload', formData);
  },

  uploadAudio: async (file: File) => {
    const formData = new FormData();
    formData.append('audio', file);
    return api.post<{ url: string; filename: string }>('/upload/audio', formData);
  },
};
