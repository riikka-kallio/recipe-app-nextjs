import Anthropic from '@anthropic-ai/sdk';
import type { Recipe } from '@/lib/types';
import type { TranslatedRecipe, TranslationMetadata } from '@/lib/types/translation';
import { getLanguageName, shouldUseMetricUnits } from '@/lib/types/translation';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Unit conversion mappings
const UNIT_CONVERSIONS: Record<string, { metric: string; imperial: string }> = {
  // Volume
  'cup': { metric: 'ml', imperial: 'cup' },
  'cups': { metric: 'ml', imperial: 'cups' },
  'tablespoon': { metric: 'ml', imperial: 'tablespoon' },
  'tablespoons': { metric: 'ml', imperial: 'tablespoons' },
  'tbsp': { metric: 'ml', imperial: 'tbsp' },
  'teaspoon': { metric: 'ml', imperial: 'teaspoon' },
  'teaspoons': { metric: 'ml', imperial: 'teaspoons' },
  'tsp': { metric: 'ml', imperial: 'tsp' },
  'fluid ounce': { metric: 'ml', imperial: 'fl oz' },
  'fluid ounces': { metric: 'ml', imperial: 'fl oz' },
  'fl oz': { metric: 'ml', imperial: 'fl oz' },
  'pint': { metric: 'ml', imperial: 'pint' },
  'pints': { metric: 'ml', imperial: 'pints' },
  'quart': { metric: 'l', imperial: 'quart' },
  'quarts': { metric: 'l', imperial: 'quarts' },
  'gallon': { metric: 'l', imperial: 'gallon' },
  'gallons': { metric: 'l', imperial: 'gallons' },
  
  // Weight
  'ounce': { metric: 'g', imperial: 'oz' },
  'ounces': { metric: 'g', imperial: 'oz' },
  'oz': { metric: 'g', imperial: 'oz' },
  'pound': { metric: 'g', imperial: 'lb' },
  'pounds': { metric: 'g', imperial: 'lb' },
  'lb': { metric: 'g', imperial: 'lb' },
  'lbs': { metric: 'g', imperial: 'lbs' },
  
  // Temperature
  'fahrenheit': { metric: '°C', imperial: '°F' },
  '°f': { metric: '°C', imperial: '°F' },
  'f': { metric: '°C', imperial: '°F' },
};

// System prompt for recipe translation
function getTranslationPrompt(targetLanguage: string, sourceLanguage: string, useMetric: boolean): string {
  const metricInstructions = useMetric
    ? `IMPORTANT: Convert all imperial measurements to metric:
       - Cups to milliliters (ml) or liters (l)
       - Tablespoons/teaspoons to ml
       - Ounces/pounds to grams (g) or kilograms (kg)
       - Fahrenheit to Celsius
       - Provide approximate conversions (e.g., "1 cup (240 ml)", "350°F (175°C)")
       `
    : `Keep measurements in imperial units (cups, oz, °F) as they are commonly used in this locale.`;

  return `You are a professional culinary translator. Translate the recipe from ${sourceLanguage} to ${targetLanguage}.

TRANSLATION GUIDELINES:
1. **Title & Description**: Translate naturally and fluently
2. **Ingredients**: 
   - Translate common ingredient names (e.g., "onion" → target language)
   - Keep proper names and specific culinary terms when appropriate (e.g., "jalapeño", "pesto")
   - For regional ingredients without direct translation, provide explanation in parentheses
3. **Instructions**: Translate cooking instructions clearly and accurately
4. **Measurements**: ${metricInstructions}
5. **Cooking Terms**: Use proper culinary terminology in the target language
6. **Cultural Context**: Adapt cooking instructions for target culture when necessary (e.g., oven types, equipment)
7. **Difficulty**: Translate the difficulty level appropriately
8. **Tags**: Translate or keep as appropriate (e.g., "Vegan" might stay, "Italian" stays)

Return ONLY valid JSON in this exact format (no markdown, no explanations):
{
  "title": "translated title",
  "description": "translated description",
  "difficulty": "easy|medium|hard (translated)",
  "ingredients": [
    {
      "item": "translated ingredient name",
      "quantity": "original or converted quantity",
      "unit": "original or converted unit",
      "is_garnish": boolean
    }
  ],
  "instructions": [
    {
      "instruction": "translated instruction"
    }
  ],
  "tags": [
    {"name": "translated or original tag name"}
  ]
}

Ensure all fields are properly translated and maintain the structure exactly.`;
}

export const translationService = {
  /**
   * Translate a complete recipe to target language
   */
  async translateRecipe(
    recipe: Recipe,
    targetLanguage: string,
    sourceLanguage: string = 'en'
  ): Promise<TranslatedRecipe> {
    const useMetric = shouldUseMetricUnits(targetLanguage);
    const prompt = getTranslationPrompt(
      getLanguageName(targetLanguage),
      getLanguageName(sourceLanguage),
      useMetric
    );

    // Prepare recipe data for translation
    const recipeData = {
      title: recipe.title,
      description: recipe.description,
      difficulty: recipe.difficulty,
      ingredients: recipe.ingredients?.map(ing => ({
        item: ing.item,
        quantity: ing.quantity,
        unit: ing.unit,
        is_garnish: ing.is_garnish,
      })) || [],
      instructions: recipe.instructions?.map(inst => ({
        instruction: inst.instruction,
      })) || [],
      tags: recipe.tags?.map(tag => ({
        name: tag.name,
      })) || [],
    };

    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 3000,
      messages: [
        {
          role: 'user',
          content: `${prompt}\n\nRecipe to translate:\n\n${JSON.stringify(recipeData, null, 2)}`,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Parse response and clean markdown if present
    let jsonText = content.text.trim();
    
    // Remove markdown code blocks if present
    const codeBlockMatch = jsonText.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
    if (codeBlockMatch) {
      jsonText = codeBlockMatch[1];
    }

    const translated = JSON.parse(jsonText);

    // Create translated recipe with metadata
    const translatedRecipe: TranslatedRecipe = {
      title: translated.title,
      description: translated.description,
      image_url: recipe.image_url, // Keep original image
      difficulty: translated.difficulty,
      prep_time: recipe.prep_time, // Keep original times
      cook_time: recipe.cook_time,
      servings: recipe.servings, // Keep original servings
      language: targetLanguage, // Set to target language
      ingredients: translated.ingredients.map((ing: any, index: number) => ({
        id: recipe.ingredients?.[index]?.id || 0,
        recipe_id: recipe.id,
        item: ing.item,
        quantity: ing.quantity || null,
        unit: ing.unit || null,
        order_index: index,
        is_garnish: ing.is_garnish || false,
      })),
      instructions: translated.instructions.map((inst: any, index: number) => ({
        id: recipe.instructions?.[index]?.id || 0,
        recipe_id: recipe.id,
        step_number: index + 1,
        instruction: inst.instruction,
      })),
      tags: translated.tags?.map((tag: any, index: number) => ({
        id: recipe.tags?.[index]?.id || 0,
        name: tag.name,
        category: recipe.tags?.[index]?.category || 'cuisine',
      })) || recipe.tags,
      user: recipe.user,
      translation_metadata: {
        source_language: sourceLanguage,
        target_language: targetLanguage,
        translated_at: new Date().toISOString(),
      },
    };

    return translatedRecipe;
  },

  /**
   * Detect the language of a text (optional, for future use)
   */
  async detectLanguage(text: string): Promise<string> {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 50,
      messages: [
        {
          role: 'user',
          content: `Detect the language of this text and respond with ONLY the ISO 639-1 language code (e.g., "en", "fi", "es"):\n\n${text.slice(0, 500)}`,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      return 'en'; // Default to English
    }

    return content.text.trim().toLowerCase();
  },
};
