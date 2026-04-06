'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ArrowLeft, Upload, X } from 'lucide-react';
import {
  useBlogPost,
  useCreateBlogPost,
  useUpdateBlogPost,
  useCategories,
} from '@/lib/hooks/useBlog';
import { useRecipes } from '@/lib/hooks/useRecipes';
import { uploadService } from '@/lib/services/recipeService';

// Dynamically import TipTapEditor with no SSR
const TipTapEditor = dynamic(() => import('@/components/TipTapEditor'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 border border-gray-300 rounded-md flex items-center justify-center">
      <p className="text-gray-500">Loading editor...</p>
    </div>
  ),
});

interface BlogPostFormProps {
  blogPostId?: number;
}

export function BlogPostForm({ blogPostId }: BlogPostFormProps) {
  const router = useRouter();
  const isEditing = !!blogPostId;

  // Fetch data
  const { data: blogPostData } = useBlogPost(blogPostId || 0);
  const { data: categoriesData } = useCategories();
  const { data: recipesData } = useRecipes({});

  const categories = categoriesData?.data || [];
  const recipes = Array.isArray(recipesData?.data?.data)
    ? recipesData.data.data
    : [];

  // Mutations
  const createBlogPost = useCreateBlogPost();
  const updateBlogPost = useUpdateBlogPost();

  // Form state
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [featuredImage, setFeaturedImage] = useState<string | null>(null);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);
  const [selectedRecipeIds, setSelectedRecipeIds] = useState<number[]>([]);
  const [published, setPublished] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load existing blog post data
  useEffect(() => {
    if (blogPostData?.data) {
      const post = blogPostData.data;
      setTitle(post.title);
      setContent(post.content);
      setExcerpt(post.excerpt || '');
      setFeaturedImage(post.featured_image_url || null);
      setSelectedCategoryIds(post.categories?.map((c) => c.id) || []);
      setSelectedRecipeIds(post.recipes?.map((r) => r.id) || []);
      setPublished(post.published);
    }
  }, [blogPostData]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = 'Title is required';
    }
    if (!content.trim() || content === '<p></p>') {
      newErrors.content = 'Content is required';
    }
    if (selectedCategoryIds.length === 0) {
      newErrors.categories = 'Please select at least one category';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent, shouldPublish: boolean) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const blogPostPayload = {
      title,
      content,
      excerpt: excerpt || undefined,
      featured_image_url: featuredImage || undefined,
      category_ids: selectedCategoryIds,
      recipe_ids: selectedRecipeIds.length > 0 ? selectedRecipeIds : undefined,
      published: shouldPublish,
    };

    try {
      if (isEditing && blogPostId) {
        await updateBlogPost.mutateAsync({
          id: blogPostId,
          data: blogPostPayload,
        });
      } else {
        await createBlogPost.mutateAsync(blogPostPayload);
      }
      router.push('/blog');
    } catch (error) {
      console.error('Failed to save blog post:', error);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    try {
      const response = await uploadService.uploadImage(file);
      if (response.data) {
        // Store relative path only (e.g., /uploads/image-xxx.jpeg)
        setFeaturedImage(response.data.url);
      }
    } catch (error) {
      console.error('Failed to upload image:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const toggleCategory = (categoryId: number) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const toggleRecipe = (recipeId: number) => {
    setSelectedRecipeIds((prev) =>
      prev.includes(recipeId)
        ? prev.filter((id) => id !== recipeId)
        : [...prev, recipeId]
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => router.push('/blog')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Blog
        </button>
        <h1 className="text-4xl font-bold text-gray-900">
          {isEditing ? 'Edit Blog Post' : 'Create New Blog Post'}
        </h1>
      </div>

      <form className="space-y-8">
        {/* Title */}
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Title *
          </label>
          <input
            type="text"
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={`w-full px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-forest-600 text-lg ${
              errors.title ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter blog post title..."
          />
          {errors.title && (
            <p className="mt-1 text-sm text-red-600">{errors.title}</p>
          )}
        </div>

        {/* Excerpt */}
        <div>
          <label
            htmlFor="excerpt"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Excerpt
          </label>
          <textarea
            id="excerpt"
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-forest-600"
            placeholder="Brief summary of your post (optional)..."
          />
          <p className="mt-1 text-sm text-gray-500">
            If not provided, an excerpt will be generated from the content.
          </p>
        </div>

        {/* Featured Image */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Featured Image
          </label>
          {featuredImage ? (
            <div className="relative">
              <img
                src={featuredImage}
                alt="Featured"
                className="w-full h-64 object-cover rounded-md"
              />
              <button
                type="button"
                onClick={() => setFeaturedImage(null)}
                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:border-forest-600 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={isUploadingImage}
              />
              {isUploadingImage ? (
                <div className="text-center">
                  <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-forest-600 mb-2"></div>
                  <p className="text-gray-600">Uploading...</p>
                </div>
              ) : (
                <div className="text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-600">Click to upload featured image</p>
                  <p className="text-sm text-gray-500 mt-1">PNG, JPG up to 5MB</p>
                </div>
              )}
            </label>
          )}
        </div>

        {/* Categories */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Categories *
          </label>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => toggleCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategoryIds.includes(category.id)
                    ? 'bg-forest-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
          {errors.categories && (
            <p className="mt-2 text-sm text-red-600">{errors.categories}</p>
          )}
        </div>

        {/* Linked Recipes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Link to Recipes (Optional)
          </label>
          <div className="border border-gray-300 rounded-md p-4 max-h-64 overflow-y-auto">
            {recipes.length === 0 ? (
              <p className="text-gray-500">No recipes available</p>
            ) : (
              <div className="space-y-2">
                {recipes.map((recipe) => (
                  <label
                    key={recipe.id}
                    className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                  >
                    <input
                      type="checkbox"
                      checked={selectedRecipeIds.includes(recipe.id)}
                      onChange={() => toggleRecipe(recipe.id)}
                      className="w-4 h-4 text-forest-600 border-gray-300 rounded focus:ring-forest-600"
                    />
                    <span className="text-gray-700">{recipe.title}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Content Editor */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Content *
          </label>
          <TipTapEditor content={content} onChange={setContent} />
          {errors.content && (
            <p className="mt-2 text-sm text-red-600">{errors.content}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => router.push('/blog')}
            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={(e) => handleSubmit(e, false)}
              disabled={createBlogPost.isPending || updateBlogPost.isPending}
              className="px-6 py-3 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors disabled:opacity-50"
            >
              Save as Draft
            </button>
            <button
              type="button"
              onClick={(e) => handleSubmit(e, true)}
              disabled={createBlogPost.isPending || updateBlogPost.isPending}
              className="px-6 py-3 bg-forest-600 text-white rounded-md hover:bg-forest-700 transition-colors disabled:opacity-50"
            >
              {createBlogPost.isPending || updateBlogPost.isPending
                ? 'Saving...'
                : published
                ? 'Update & Publish'
                : 'Publish'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
