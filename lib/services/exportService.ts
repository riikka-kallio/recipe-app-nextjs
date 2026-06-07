import type { Recipe } from '@/lib/types';
import type { ExportFormat } from '@/lib/types/import';
import type { TranslatedRecipe } from '@/lib/types/translation';
import { getLanguageName } from '@/lib/types/translation';

export const exportService = {
  /**
   * Export recipe as JSON
   */
  exportAsJSON(recipe: Recipe | TranslatedRecipe): string {
    const data = {
      title: recipe.title,
      description: recipe.description,
      difficulty: recipe.difficulty,
      prep_time: recipe.prep_time,
      cook_time: recipe.cook_time,
      servings: recipe.servings,
      language: (recipe as Recipe).language || 'en',
      ingredients: recipe.ingredients,
      instructions: recipe.instructions,
      tags: recipe.tags,
      image_url: recipe.image_url,
      // Include translation metadata if available
      ...(('translation_metadata' in recipe) && {
        translation_metadata: recipe.translation_metadata,
      }),
    };

    return JSON.stringify(data, null, 2);
  },

  /**
   * Export recipe as Markdown
   */
  exportAsMarkdown(recipe: Recipe | TranslatedRecipe): string {
    let md = `# ${recipe.title}\n\n`;

    // Add translation notice if available
    if ('translation_metadata' in recipe && recipe.translation_metadata) {
      const { source_language, target_language, translated_at } = recipe.translation_metadata;
      md += `> **Translation Notice:** This recipe was translated from ${getLanguageName(source_language)} to ${getLanguageName(target_language)} on ${new Date(translated_at).toLocaleDateString()}.\n\n`;
    }

    if (recipe.description) {
      md += `${recipe.description}\n\n`;
    }

    md += `## Details\n\n`;
    md += `- **Difficulty:** ${recipe.difficulty}\n`;
    md += `- **Prep Time:** ${recipe.prep_time} minutes\n`;
    md += `- **Cook Time:** ${recipe.cook_time} minutes\n`;
    md += `- **Total Time:** ${recipe.prep_time + recipe.cook_time} minutes\n`;
    md += `- **Servings:** ${recipe.servings}\n`;
    
    // Add language info
    const language = (recipe as Recipe).language || 
      ('translation_metadata' in recipe ? recipe.translation_metadata?.target_language : 'en');
    md += `- **Language:** ${getLanguageName(language)}\n\n`;

    if (recipe.tags && recipe.tags.length > 0) {
      md += `**Tags:** ${recipe.tags.map((t) => t.name).join(', ')}\n\n`;
    }

    md += `## Ingredients\n\n`;
    recipe.ingredients?.forEach((ing) => {
      const qty = ing.quantity ? `${ing.quantity} ` : '';
      const unit = ing.unit ? `${ing.unit} ` : '';
      md += `- ${qty}${unit}${ing.item}\n`;
    });

    md += `\n## Instructions\n\n`;
    recipe.instructions?.forEach((inst, index) => {
      md += `${index + 1}. ${inst.instruction}\n`;
    });

    md += `\n---\n\n`;
    md += `*Recipe by ${recipe.user?.username || 'Unknown'}*\n`;

    return md;
  },

  /**
   * Get filename for export
   */
  getFilename(recipe: Recipe | TranslatedRecipe, format: ExportFormat): string {
    const slug = recipe.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    
    // Add language suffix if translated
    const langSuffix = ('translation_metadata' in recipe && recipe.translation_metadata) 
      ? `_${recipe.translation_metadata.target_language}` 
      : '';
    
    const ext = format === 'json' ? 'json' : format === 'pdf' ? 'pdf' : 'md';
    return `${slug}${langSuffix}.${ext}`;
  },
};
