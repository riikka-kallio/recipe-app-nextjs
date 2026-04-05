import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  createSuccessResponse,
  createErrorResponse,
  getPaginationParams,
  calculatePagination,
  getUserIdFromRequest,
  validateRequiredFields,
  withErrorHandling,
} from '@/lib/apiHelpers';

/**
 * GET /api/blog
 * Get all blog posts with optional filters and pagination
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const supabase = await createClient();
  const searchParams = request.nextUrl.searchParams;
  const userId = getUserIdFromRequest(request);

  // Get pagination params
  const { page, limit, offset } = getPaginationParams(searchParams);

  // Get filter params
  const searchQuery = searchParams.get('q');
  const category = searchParams.get('category');
  const filterUserId = searchParams.get('user_id');

  // Build the Supabase query
  let query = supabase
    .from('blog_posts')
    .select(
      `
      *,
      user:users!blog_posts_user_id_fkey (
        id,
        username,
        full_name,
        avatar_url
      ),
      categories:blog_post_categories (
        category:categories!blog_post_categories_category_id_fkey (
          id,
          name,
          slug
        )
      ),
      likes:blog_post_likes (
        user_id
      )
    `,
      { count: 'exact' }
    )
    .eq('published', true);

  // Apply filters
  if (searchQuery) {
    query = query.or(`title.ilike.%${searchQuery}%,content.ilike.%${searchQuery}%`);
  }

  if (category) {
    query = query.eq('blog_post_categories.category.slug', category);
  }

  if (filterUserId) {
    query = query.eq('user_id', filterUserId);
  }

  // Apply pagination
  query = query.range(offset, offset + limit - 1).order('created_at', { ascending: false });

  // Execute query
  const { data: blogPosts, error, count } = await query;

  if (error) {
    console.error('Error fetching blog posts:', error);
    return createErrorResponse('Failed to fetch blog posts', 500);
  }

  // Transform data to match expected format
  const transformedPosts = blogPosts?.map((post) => ({
    ...post,
    categories: post.categories?.map((c: any) => c.category) || [],
    is_liked: post.likes?.some((like: any) => like.user_id === userId) || false,
    likes_count: post.likes?.length || 0,
  }));

  // Calculate pagination metadata
  const pagination = calculatePagination(page, limit, count || 0);

  return createSuccessResponse(transformedPosts, undefined, pagination);
});

/**
 * POST /api/blog
 * Create a new blog post
 */
export const POST = withErrorHandling(async (request: NextRequest) => {
  const supabase = await createClient();
  const userId = getUserIdFromRequest(request);

  // Parse request body
  const body = await request.json();

  // Validate required fields
  const validation = validateRequiredFields(body, ['title', 'content']);

  if (!validation.valid) {
    return createErrorResponse('Validation failed', 400, validation.errors);
  }

  // Prepare blog post data
  const postData = {
    user_id: userId,
    title: body.title,
    content: body.content,
    excerpt: body.excerpt || '',
    featured_image_url: body.featured_image_url || null,
    published: body.published !== undefined ? body.published : false,
  };

  // Create blog post
  const { data: post, error } = await supabase
    .from('blog_posts')
    .insert(postData)
    .select(
      `
      *,
      user:users!blog_posts_user_id_fkey (
        id,
        username,
        full_name,
        avatar_url
      )
    `
    )
    .single();

  if (error) {
    console.error('Error creating blog post:', error);
    return createErrorResponse('Failed to create blog post', 500);
  }

  // Add categories if provided
  if (body.categories && Array.isArray(body.categories) && body.categories.length > 0) {
    const categoryInserts = body.categories.map((categoryId: string) => ({
      blog_post_id: post.id,
      category_id: categoryId,
    }));

    await supabase.from('blog_post_categories').insert(categoryInserts);
  }

  return createSuccessResponse(post, 'Blog post created successfully');
});
