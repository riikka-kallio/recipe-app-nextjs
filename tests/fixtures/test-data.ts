/**
 * Test Data Factories
 * Provides reusable test data for E2E tests
 */

export const testRecipe = {
  title: 'Test Pasta Carbonara E2E',
  description: 'Creamy Italian pasta dish - perfect for testing',
  prep_time: 15,
  cook_time: 20,
  servings: 4,
  difficulty: 'medium' as const,
  ingredients: [
    { item: 'Spaghetti', quantity: '400', unit: 'g', is_garnish: false },
    { item: 'Eggs', quantity: '4', unit: 'whole', is_garnish: false },
    { item: 'Pecorino Romano', quantity: '100', unit: 'g', is_garnish: false },
    { item: 'Fresh Parsley', quantity: '2', unit: 'tbsp', is_garnish: true }
  ],
  instructions: [
    { instruction: 'Boil salted water and cook pasta al dente' },
    { instruction: 'Mix eggs with grated cheese in a bowl' },
    { instruction: 'Drain pasta, combine with egg mixture, and serve hot' }
  ]
};

export const testBlogPost = {
  title: 'How to Make Perfect Pasta E2E',
  content: '<h2>Introduction</h2><p>Pasta is <strong>delicious</strong> and easy to make.</p><ul><li>Use quality ingredients</li><li>Don\'t overcook</li></ul>',
  excerpt: 'Learn the secrets of perfect pasta cooking'
};

export const editedRecipe = {
  title: 'Updated Test Pasta Carbonara',
  newIngredient: { item: 'Black Pepper', quantity: '1', unit: 'tsp', is_garnish: false }
};

export const editedBlogPost = {
  title: 'Updated: Perfect Pasta Guide',
  content: '<h2>Updated Introduction</h2><p>This guide has been updated with new tips!</p>'
};

export const searchQueries = {
  pasta: 'pasta',
  noResults: 'xyznonexistentrecipe123',
  common: 'chicken'
};

export const filters = {
  difficulty: {
    easy: 'easy',
    medium: 'medium',
    hard: 'hard'
  },
  time: {
    quick: { prep: 15, cook: 30 },
    moderate: { prep: 30, cook: 60 }
  }
};
