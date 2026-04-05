import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { blogService, categoryService, uploadServiceExtended } from '@/lib/services/blogService';
import type { CreateBlogPostRequest, UpdateBlogPostRequest, BlogPostFilters, PaginationParams } from '@/lib/types';
import toast from 'react-hot-toast';

// Query Keys
export const blogQueryKeys = {
  blogPosts: ['blogPosts'] as const,
  blogPost: (id: number) => ['blogPosts', id] as const,
  categories: ['blogCategories'] as const,
  category: (id: number) => ['blogCategories', id] as const,
};

// Blog Posts
export const useBlogPosts = (filters?: BlogPostFilters, pagination?: PaginationParams) => {
  return useQuery({
    queryKey: [...blogQueryKeys.blogPosts, filters, pagination],
    queryFn: () => blogService.getAll(filters, pagination),
  });
};

export const useBlogPost = (id: number) => {
  return useQuery({
    queryKey: blogQueryKeys.blogPost(id),
    queryFn: () => blogService.getById(id),
    enabled: !!id,
  });
};

export const useCreateBlogPost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBlogPostRequest) => blogService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blogQueryKeys.blogPosts });
      toast.success('Blog post created successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to create blog post');
    },
  });
};

export const useUpdateBlogPost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateBlogPostRequest }) =>
      blogService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: blogQueryKeys.blogPosts });
      queryClient.invalidateQueries({ queryKey: blogQueryKeys.blogPost(variables.id) });
      toast.success('Blog post updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update blog post');
    },
  });
};

export const useDeleteBlogPost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => blogService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blogQueryKeys.blogPosts });
      toast.success('Blog post deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete blog post');
    },
  });
};

export const useLikeBlogPost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => blogService.toggleLike(id),
    onSuccess: (_, id) => {
      // Optimistic update - refetch the specific post and the list
      queryClient.invalidateQueries({ queryKey: blogQueryKeys.blogPost(id) });
      queryClient.invalidateQueries({ queryKey: blogQueryKeys.blogPosts });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to like blog post');
    },
  });
};

// Blog Categories
export const useCategories = () => {
  return useQuery({
    queryKey: blogQueryKeys.categories,
    queryFn: () => categoryService.getAll(),
  });
};

export const useCategory = (id: number) => {
  return useQuery({
    queryKey: blogQueryKeys.category(id),
    queryFn: () => categoryService.getById(id),
    enabled: !!id,
  });
};

// Upload Audio
export const useUploadAudio = () => {
  return useMutation({
    mutationFn: (file: File) => uploadServiceExtended.uploadAudio(file),
    onError: (error: any) => {
      toast.error(error.message || 'Failed to upload audio');
    },
  });
};
