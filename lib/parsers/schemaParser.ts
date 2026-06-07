import * as cheerio from 'cheerio';
import type { ParsedRecipe } from '@/lib/types/import';

export const schemaParser = {
  /**
   * Try to extract recipe from schema.org/JSON-LD markup
   */
  async parseFromHTML(html: string): Promise<ParsedRecipe | null> {
    const $ = cheerio.load(html);

    // Try JSON-LD first
    const jsonLd = this.extractJsonLd($);
    if (jsonLd) {
      return jsonLd;
    }

    // Try schema.org microdata
    const microdata = this.extractMicrodata($);
    if (microdata) {
      return microdata;
    }

    return null;
  },

  /**
   * Extract JSON-LD Recipe schema
   */
  extractJsonLd($: cheerio.CheerioAPI): ParsedRecipe | null {
    const scripts = $('script[type="application/ld+json"]');
    
    for (const script of scripts) {
      try {
        const content = $(script).html();
        if (!content) continue;
        
        const data = JSON.parse(content);
        const recipe = Array.isArray(data) 
          ? data.find((item: any) => item['@type'] === 'Recipe')
          : data['@type'] === 'Recipe' ? data : null;

        if (recipe) {
          return this.normalizeSchemaRecipe(recipe);
        }
      } catch (e) {
        continue;
      }
    }
    
    return null;
  },

  /**
   * Extract schema.org microdata
   */
  extractMicrodata($: cheerio.CheerioAPI): ParsedRecipe | null {
    const recipeEl = $('[itemtype*="schema.org/Recipe"]');
    if (!recipeEl.length) return null;

    const getProp = (prop: string) => {
      const el = recipeEl.find(`[itemprop="${prop}"]`);
      return el.attr('content') || el.text().trim();
    };

    const ingredients = recipeEl.find('[itemprop="recipeIngredient"]')
      .map((_, el) => ({ item: $(el).text().trim() }))
      .get();

    const instructions = recipeEl.find('[itemprop="recipeInstructions"]')
      .map((_, el) => ({ instruction: $(el).text().trim() }))
      .get();

    return {
      title: getProp('name') || 'Untitled Recipe',
      description: getProp('description') || undefined,
      prep_time: this.parseTime(getProp('prepTime')),
      cook_time: this.parseTime(getProp('cookTime')),
      servings: parseInt(getProp('recipeYield')) || undefined,
      ingredients: ingredients.length > 0 ? ingredients : [],
      instructions: instructions.length > 0 ? instructions : [],
      image_url: getProp('image') || undefined,
    };
  },

  /**
   * Normalize schema.org Recipe to our format
   */
  normalizeSchemaRecipe(recipe: any): ParsedRecipe {
    // Extract ingredients
    const ingredients = Array.isArray(recipe.recipeIngredient)
      ? recipe.recipeIngredient.map((ing: string) => ({ item: ing }))
      : [];

    // Extract instructions
    let instructions: any[] = [];
    if (Array.isArray(recipe.recipeInstructions)) {
      instructions = recipe.recipeInstructions.map((inst: any) => {
        if (typeof inst === 'string') {
          return { instruction: inst };
        }
        return { instruction: inst.text || inst.name || '' };
      });
    } else if (typeof recipe.recipeInstructions === 'string') {
      instructions = [{ instruction: recipe.recipeInstructions }];
    }

    // Extract image URL
    let imageUrl: string | undefined;
    if (typeof recipe.image === 'string') {
      imageUrl = recipe.image;
    } else if (Array.isArray(recipe.image) && recipe.image.length > 0) {
      // If array element is an object with url property, extract it
      const firstImage = recipe.image[0];
      imageUrl = typeof firstImage === 'string' ? firstImage : firstImage?.url;
    } else if (recipe.image?.url) {
      imageUrl = recipe.image.url;
    }

    return {
      title: recipe.name || 'Untitled Recipe',
      description: recipe.description || undefined,
      prep_time: this.parseTime(recipe.prepTime),
      cook_time: this.parseTime(recipe.cookTime),
      servings: parseInt(recipe.recipeYield) || undefined,
      ingredients,
      instructions,
      image_url: imageUrl,
    };
  },

  /**
   * Parse ISO 8601 duration to minutes
   */
  parseTime(duration?: string): number | undefined {
    if (!duration) return undefined;
    
    // ISO 8601: PT15M or PT1H30M
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    if (!match) return undefined;
    
    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    return hours * 60 + minutes;
  },
};
