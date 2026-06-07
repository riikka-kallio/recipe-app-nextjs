// Import/Export types for recipe import functionality

export interface ImportSource {
  type: 'url' | 'pdf' | 'image';
  data: string | File;
}

export interface ParsedRecipe {
  title: string;
  description?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  prep_time?: number;
  cook_time?: number;
  servings?: number;
  ingredients: Array<{
    item: string;
    quantity?: string;
    unit?: string;
    is_garnish?: boolean;
  }>;
  instructions: Array<{
    instruction: string;
  }>;
  image_url?: string;
  tags?: string[]; // Tag names, we'll match to IDs later
  source_url?: string;
}

export interface ImportResult {
  success: boolean;
  data?: ParsedRecipe;
  error?: string;
  warnings?: string[];
}

export type ExportFormat = 'json' | 'pdf' | 'markdown';
