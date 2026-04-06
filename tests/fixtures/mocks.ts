import { Page, Route } from '@playwright/test';

/**
 * API Mocking Utilities
 * 
 * Provides utilities for mocking API responses in tests.
 * Use for error scenarios, loading states, and edge cases.
 * For happy path E2E tests, use real Supabase API.
 */

export interface MockRecipe {
  id: number;
  title: string;
  description: string;
  prep_time: number;
  cook_time: number;
  servings: number;
  difficulty: 'easy' | 'medium' | 'hard';
  image_url?: string;
  user_id: number;
  created_at: string;
  likes_count?: number;
  user?: {
    id: number;
    username: string;
    email: string;
  };
}

export interface MockBlogPost {
  id: number;
  title: string;
  content: string;
  excerpt?: string;
  featured_image_url?: string;
  user_id: number;
  published: boolean;
  created_at: string;
  views_count?: number;
  likes_count?: number;
  category?: {
    id: number;
    name: string;
  };
}

/**
 * API Mock Class
 * Provides methods to mock Next.js API routes for testing error states, loading states, and edge cases
 */
export class ApiMock {
  constructor(private page: Page) {}

  /**
   * Mock recipe list endpoint with custom data
   */
  async mockRecipeList(recipes: MockRecipe[]) {
    await this.page.route('**/api/recipes?*', async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: recipes,
          pagination: {
            page: 1,
            limit: 12,
            total: recipes.length,
            total_pages: 1
          }
        })
      });
    });
  }

  /**
   * Mock recipe detail endpoint
   */
  async mockRecipeDetail(recipe: MockRecipe) {
    await this.page.route('**/api/recipes/*', async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(recipe)
      });
    });
  }

  /**
   * Mock blog post list endpoint
   */
  async mockBlogPostList(posts: MockBlogPost[]) {
    await this.page.route('**/api/blog?*', async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: posts,
          pagination: {
            page: 1,
            limit: 12,
            total: posts.length,
            total_pages: 1
          }
        })
      });
    });
  }

  /**
   * Mock network error - simulates network failure
   */
  async mockNetworkError(urlPattern: string) {
    await this.page.route(urlPattern, (route: Route) => {
      route.abort('failed');
    });
  }

  /**
   * Mock 500 server error
   */
  async mock500Error(urlPattern: string) {
    await this.page.route(urlPattern, async (route: Route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ 
          error: 'Internal Server Error',
          message: 'Something went wrong on the server'
        })
      });
    });
  }

  /**
   * Mock 404 not found error
   */
  async mock404Error(urlPattern: string) {
    await this.page.route(urlPattern, async (route: Route) => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({ 
          error: 'Not Found',
          message: 'The requested resource was not found'
        })
      });
    });
  }

  /**
   * Mock empty results for empty state testing
   */
  async mockEmptyResults(endpoint: string) {
    await this.page.route(`**/api/${endpoint}*`, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: [],
          pagination: { 
            page: 1, 
            limit: 12, 
            total: 0, 
            total_pages: 0 
          }
        })
      });
    });
  }

  /**
   * Mock slow response to test loading states
   */
  async mockSlowResponse(urlPattern: string, delayMs: number) {
    await this.page.route(urlPattern, async (route: Route) => {
      await new Promise(resolve => setTimeout(resolve, delayMs));
      await route.continue();
    });
  }

  /**
   * Mock authentication error (401 Unauthorized)
   */
  async mockAuthError(urlPattern: string) {
    await this.page.route(urlPattern, async (route: Route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ 
          error: 'Unauthorized',
          message: 'Authentication required'
        })
      });
    });
  }

  /**
   * Clear all mocks
   */
  async clearMocks() {
    await this.page.unroute('**/*');
  }
}

/**
 * Mock Data Factories
 */

export function createMockRecipe(overrides?: Partial<MockRecipe>): MockRecipe {
  return {
    id: 1,
    title: 'Test Recipe',
    description: 'A delicious test recipe',
    prep_time: 15,
    cook_time: 30,
    servings: 4,
    difficulty: 'easy',
    image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400',
    user_id: 1,
    created_at: new Date().toISOString(),
    likes_count: 5,
    user: {
      id: 1,
      username: 'guest_user',
      email: 'guest@recipeapp.com'
    },
    ...overrides
  };
}

export function createMockBlogPost(overrides?: Partial<MockBlogPost>): MockBlogPost {
  return {
    id: 1,
    title: 'Test Blog Post',
    content: '<p>This is a test blog post content.</p>',
    excerpt: 'This is a test excerpt',
    featured_image_url: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600',
    user_id: 1,
    published: true,
    created_at: new Date().toISOString(),
    views_count: 10,
    likes_count: 3,
    category: {
      id: 1,
      name: 'Cooking Tips'
    },
    ...overrides
  };
}

export function createMockRecipes(count: number): MockRecipe[] {
  return Array.from({ length: count }, (_, i) => 
    createMockRecipe({
      id: i + 1,
      title: `Test Recipe ${i + 1}`,
    })
  );
}

export function createMockBlogPosts(count: number): MockBlogPost[] {
  return Array.from({ length: count }, (_, i) => 
    createMockBlogPost({
      id: i + 1,
      title: `Test Blog Post ${i + 1}`,
    })
  );
}
