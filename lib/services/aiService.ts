import Anthropic from '@anthropic-ai/sdk';
import type { ParsedRecipe } from '@/lib/types/import';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// System prompt for recipe extraction
const RECIPE_EXTRACTION_PROMPT = `You are a recipe extraction assistant. Extract recipe information from the provided text and return a structured JSON object.

Return ONLY valid JSON in this exact format (no markdown, no explanations):
{
  "title": "Recipe name",
  "description": "Brief description",
  "difficulty": "easy|medium|hard",
  "prep_time": <number in minutes>,
  "cook_time": <number in minutes>,
  "servings": <number>,
  "ingredients": [
    {"item": "name", "quantity": "1", "unit": "cup", "is_garnish": false}
  ],
  "instructions": [
    {"instruction": "Step description"}
  ],
  "image_url": "URL if found",
  "tags": ["tag1", "tag2"]
}

If a field is not found, omit it or use null. Ensure ingredients and instructions arrays are never empty.
Infer reasonable values for difficulty (easy/medium/hard) based on complexity and cooking time.
For tags, include cuisine type (e.g., Italian, Mexican), dietary restrictions (e.g., Vegetarian, Vegan), and meal type (e.g., Breakfast, Lunch, Dinner, Dessert).`;

export const aiService = {
  /**
   * Parse recipe from plain text or HTML
   */
  async parseRecipeFromText(text: string): Promise<ParsedRecipe> {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: `${RECIPE_EXTRACTION_PROMPT}\n\nText to extract recipe from:\n\n${text}`,
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    const textContent = content.text;
    
    // Parse JSON response
    try {
      // Remove markdown code blocks if present
      let jsonStr = textContent.trim();
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/```json\n?/, '').replace(/\n?```$/, '');
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/```\n?/, '').replace(/\n?```$/, '');
      }
      
      const parsed = JSON.parse(jsonStr);
      return this.normalizeRecipe(parsed);
    } catch (e) {
      console.error('Failed to parse Claude response:', textContent);
      throw new Error('Invalid response format from AI');
    }
  },

  /**
   * Extract text from image using Claude Vision
   */
  async extractTextFromImage(imageUrl: string): Promise<string> {
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'url',
                url: imageUrl,
              },
            },
            {
              type: 'text',
              text: 'Extract all text from this image. Include recipe title, ingredients, instructions, and any other relevant information. Format it clearly.',
            },
          ],
        },
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    return content.text;
  },

  /**
   * Normalize AI response to our ParsedRecipe format
   */
  normalizeRecipe(data: any): ParsedRecipe {
    return {
      title: data.title || 'Untitled Recipe',
      description: data.description || undefined,
      difficulty: ['easy', 'medium', 'hard'].includes(data.difficulty)
        ? data.difficulty
        : 'medium',
      prep_time: Number(data.prep_time) || 15,
      cook_time: Number(data.cook_time) || 30,
      servings: Number(data.servings) || 4,
      ingredients: Array.isArray(data.ingredients)
        ? data.ingredients.map((ing: any) => ({
            item: String(ing.item || ing.name || '').trim(),
            quantity: ing.quantity ? String(ing.quantity).trim() : undefined,
            unit: ing.unit ? String(ing.unit).trim() : undefined,
            is_garnish: Boolean(ing.is_garnish),
          }))
        : [],
      instructions: Array.isArray(data.instructions)
        ? data.instructions.map((inst: any, index: number) => ({
            instruction: String(inst.instruction || inst.step || inst).trim(),
          }))
        : [],
      image_url: typeof data.image_url === 'string' 
        ? data.image_url 
        : (data.image_url as any)?.url || undefined,
      tags: Array.isArray(data.tags) ? data.tags : undefined,
    };
  },
};
