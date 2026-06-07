'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateRecipe, useUpdateRecipe, useRecipe, useTags } from '@/lib/hooks/useRecipes';
import { useUploadImage } from '@/lib/hooks/useRecipes';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { Plus, X, Upload, ArrowLeft, FileInput } from 'lucide-react';
import type { CreateRecipeRequest } from '@/lib/types';
import { ImportDialog } from '@/components/ImportDialog';
import type { ParsedRecipe } from '@/lib/types/import';
import { downloadImageAsFile } from '@/lib/utils/imageDownloader';
import toast from 'react-hot-toast';

const recipeSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  prep_time: z.number().min(1, 'Prep time must be at least 1 minute'),
  cook_time: z.number().min(0, 'Cook time cannot be negative'),
  servings: z.number().min(1, 'Servings must be at least 1'),
  ingredients: z.array(
    z.object({
      item: z.string().min(1, 'Ingredient name is required'),
      quantity: z.string().optional(),
      unit: z.string().optional(),
      is_garnish: z.boolean().optional(),
    })
  ).min(1, 'At least one ingredient is required'),
  instructions: z.array(
    z.object({
      instruction: z.string().min(1, 'Instruction is required'),
    })
  ).min(1, 'At least one instruction is required'),
  tag_ids: z.array(z.number()).optional(),
  image_url: z.string().optional(),
});

type RecipeFormData = z.infer<typeof recipeSchema>;

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

interface RecipeFormProps {
  recipeId?: number;
}

export function RecipeForm({ recipeId }: RecipeFormProps) {
  const router = useRouter();
  const isEditMode = !!recipeId;

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [downloadingImage, setDownloadingImage] = useState(false);

  const { data: tagsData } = useTags();
  const { data: recipeData } = useRecipe(recipeId || 0);
  const createMutation = useCreateRecipe();
  const updateMutation = useUpdateRecipe();
  const uploadMutation = useUploadImage();

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RecipeFormData>({
    resolver: zodResolver(recipeSchema),
    defaultValues: {
      title: '',
      description: '',
      difficulty: 'easy',
      prep_time: 15,
      cook_time: 30,
      servings: 4,
      ingredients: [{ item: '', quantity: '', unit: '', is_garnish: false }],
      instructions: [{ instruction: '' }],
      tag_ids: [],
    },
  });

  const {
    fields: ingredientFields,
    append: appendIngredient,
    remove: removeIngredient,
  } = useFieldArray({
    control,
    name: 'ingredients',
  });

  const {
    fields: instructionFields,
    append: appendInstruction,
    remove: removeInstruction,
  } = useFieldArray({
    control,
    name: 'instructions',
  });

  // Populate form in edit mode
  useEffect(() => {
    if (isEditMode && recipeData?.data) {
      const recipe = recipeData.data;
      setValue('title', recipe.title);
      setValue('description', recipe.description || '');
      setValue('difficulty', recipe.difficulty);
      setValue('prep_time', recipe.prep_time);
      setValue('cook_time', recipe.cook_time);
      setValue('servings', recipe.servings);
      setValue('image_url', recipe.image_url || '');

      if (recipe.ingredients) {
        setValue('ingredients', recipe.ingredients.map(ing => ({
          item: ing.item,
          quantity: ing.quantity || undefined,
          unit: ing.unit || undefined,
          is_garnish: ing.is_garnish || false,
        })));
      }

      if (recipe.instructions) {
        setValue('instructions', recipe.instructions.map(inst => ({
          instruction: inst.instruction,
        })));
      }

      if (recipe.tags) {
        const tagIds = recipe.tags.map(tag => tag.id);
        setSelectedTags(tagIds);
        setValue('tag_ids', tagIds);
      }

      if (recipe.image_url) {
        // Check if image_url is already a full URL (Supabase storage) or relative path
        if (recipe.image_url.startsWith('http')) {
          setImagePreview(recipe.image_url);
        } else {
          // Legacy format: relative path stored in DB
          setImagePreview(`${BASE_URL}/api${recipe.image_url}`);
        }
      }
    }
  }, [isEditMode, recipeData, setValue, recipeId]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleTag = (tagId: number) => {
    setSelectedTags(prev => {
      const newTags = prev.includes(tagId)
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId];
      setValue('tag_ids', newTags);
      return newTags;
    });
  };

  const handleImportedRecipe = (imported: ParsedRecipe) => {
    // Pre-fill form with imported data
    setValue('title', imported.title);
    setValue('description', imported.description || '');
    
    // Ensure difficulty is valid
    const validDifficulty = ['easy', 'medium', 'hard'].includes(imported.difficulty || '')
      ? (imported.difficulty as 'easy' | 'medium' | 'hard')
      : 'medium';
    setValue('difficulty', validDifficulty);
    
    // Ensure numbers are valid and meet minimum requirements
    setValue('prep_time', Math.max(1, imported.prep_time || 15));
    setValue('cook_time', Math.max(0, imported.cook_time || 30));
    setValue('servings', Math.max(1, imported.servings || 4));
    
    // Filter and validate ingredients
    if (imported.ingredients && imported.ingredients.length > 0) {
      const validIngredients = imported.ingredients.filter(
        ing => ing.item && ing.item.trim().length > 0
      );
      
      if (validIngredients.length > 0) {
        setValue('ingredients', validIngredients);
      } else {
        // Fallback to one empty ingredient
        setValue('ingredients', [{ item: '', quantity: '', unit: '', is_garnish: false }]);
      }
    }
    
    // Filter and validate instructions
    if (imported.instructions && imported.instructions.length > 0) {
      const validInstructions = imported.instructions.filter(
        inst => inst.instruction && inst.instruction.trim().length > 0
      );
      
      if (validInstructions.length > 0) {
        setValue('instructions', validInstructions);
      } else {
        // Fallback to one empty instruction
        setValue('instructions', [{ instruction: '' }]);
      }
    }
    
    if (imported.image_url) {
      // Ensure image_url is a string, not an object
      const imageUrlString = typeof imported.image_url === 'string' 
        ? imported.image_url 
        : (imported.image_url as any)?.url || '';
      
      if (imageUrlString) {
        setValue('image_url', imageUrlString);
        setImagePreview(imageUrlString);
        
        // Download external image asynchronously and convert to File
        setDownloadingImage(true);
        
        downloadImageAsFile(imageUrlString, false)
          .then(file => {
            if (!file) {
              // Try with proxy if direct download failed
              return downloadImageAsFile(imageUrlString, true);
            }
            return file;
          })
          .then(file => {
            if (file) {
              setImageFile(file);
              toast.success('Image downloaded and ready for upload');
            } else {
              toast('Using external image URL (download failed)', { 
                icon: '⚠️',
                duration: 4000,
              });
            }
          })
          .catch(error => {
            console.error('Error downloading image:', error);
            toast.error('Failed to download image, using external URL');
          })
          .finally(() => {
            setDownloadingImage(false);
          });
      }
    }
    
    // Match tag names to tag IDs if tags exist
    if (imported.tags && imported.tags.length > 0 && tagsData?.data) {
      const matchedTagIds: number[] = [];
      imported.tags.forEach(tagName => {
        const matchedTag = tagsData.data.all.find(
          (tag: any) => tag.name.toLowerCase() === tagName.toLowerCase()
        );
        if (matchedTag) {
          matchedTagIds.push(matchedTag.id);
        }
      });
      if (matchedTagIds.length > 0) {
        setSelectedTags(matchedTagIds);
        setValue('tag_ids', matchedTagIds);
      }
    }
    
    toast.success('Recipe imported! Review and edit before saving.');
  };

  const onSubmit = async (data: RecipeFormData) => {
    try {
      let imageUrl = data.image_url;

      // Upload image if new file selected
      if (imageFile) {
        const uploadResult = await uploadMutation.mutateAsync(imageFile);
        if (uploadResult.data) {
          imageUrl = uploadResult.data.url;
        }
      }

      const recipePayload: CreateRecipeRequest = {
        ...data,
        image_url: imageUrl,
        tag_ids: selectedTags,
      };

      if (isEditMode) {
        await updateMutation.mutateAsync({
          id: recipeId,
          data: recipePayload,
        });
        router.push(`/recipes/${recipeId}`);
      } else {
        const result = await createMutation.mutateAsync(recipePayload);
        if (result.data) {
          router.push(`/recipes/${result.data.id}`);
        }
      }
    } catch (error) {
      console.error('Error saving recipe:', error);
      toast.error('Failed to save recipe. Please try again.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-neutral-text hover:text-neutral-heading mb-6 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        Back
      </button>

      <h1 className="text-3xl font-bold text-neutral-heading mb-8">
        {isEditMode ? 'Edit Recipe' : 'Create New Recipe'}
      </h1>

      {/* Import Button - Only show in create mode */}
      {!isEditMode && (
        <div className="mb-6">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setShowImportDialog(true)}
            className="flex items-center gap-2"
          >
            <FileInput className="w-5 h-5" />
            Import Recipe
          </Button>
          <p className="text-sm text-neutral-text mt-2">
            Import from URL, PDF, or image to auto-fill this form
          </p>
        </div>
      )}

      <form 
        data-testid="recipe-form" 
        onSubmit={handleSubmit(onSubmit, (errors) => {
          toast.error('Please fix the form errors before submitting');
        })} 
        className="space-y-8"
      >
        {/* Form Errors Display */}
        {Object.keys(errors).length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-red-800 font-semibold mb-2">Please fix the following errors:</h3>
            <ul className="list-disc list-inside space-y-1 text-red-700 text-sm">
              {errors.title && <li>{errors.title.message}</li>}
              {errors.difficulty && <li>{errors.difficulty.message}</li>}
              {errors.prep_time && <li>{errors.prep_time.message}</li>}
              {errors.cook_time && <li>{errors.cook_time.message}</li>}
              {errors.servings && <li>{errors.servings.message}</li>}
              {errors.ingredients && <li>Ingredients: {errors.ingredients.message || 'Invalid ingredients'}</li>}
              {errors.instructions && <li>Instructions: {errors.instructions.message || 'Invalid instructions'}</li>}
            </ul>
          </div>
        )}

        {/* Image Upload */}
        <div>
          <label className="block text-sm font-medium text-neutral-heading mb-2">
            Recipe Image
          </label>
          <div className="flex items-center gap-4">
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Preview"
                className="w-32 h-32 object-contain rounded-lg bg-neutral-light"
              />
            )}
            <label className="flex items-center gap-2 px-4 py-2 border border-neutral-light rounded-lg cursor-pointer hover:bg-neutral-light transition-colors">
              <Upload className="w-5 h-5" />
              <span>Upload Image</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* Basic Info */}
        <div className="space-y-4">
          <Input
            label="Recipe Title *"
            {...register('title')}
            error={errors.title?.message}
            fullWidth
            placeholder="e.g., Classic Margherita Pizza"
          />

          <Textarea
            label="Description"
            {...register('description')}
            error={errors.description?.message}
            fullWidth
            placeholder="A brief description of your recipe..."
          />

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Input
              label="Prep Time (min) *"
              type="number"
              {...register('prep_time', { valueAsNumber: true })}
              error={errors.prep_time?.message}
              fullWidth
            />

            <Input
              label="Cook Time (min) *"
              type="number"
              {...register('cook_time', { valueAsNumber: true })}
              error={errors.cook_time?.message}
              fullWidth
            />

            <Input
              label="Servings *"
              type="number"
              {...register('servings', { valueAsNumber: true })}
              error={errors.servings?.message}
              fullWidth
            />

            <Select
              label="Difficulty *"
              {...register('difficulty')}
              error={errors.difficulty?.message}
              fullWidth
              options={[
                { value: 'easy', label: 'Easy' },
                { value: 'medium', label: 'Medium' },
                { value: 'hard', label: 'Hard' },
              ]}
            />
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-neutral-heading mb-3">
            Tags (optional)
          </label>
          {tagsData?.data?.grouped && (
            <div className="space-y-4">
              {Object.entries(tagsData.data.grouped).map(([category, tags]) => (
                <div key={category}>
                  <h3 className="text-sm font-medium text-neutral-text capitalize mb-2">
                    {category.replace('_', ' ')}
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Badge
                        key={tag.id}
                        variant={selectedTags.includes(tag.id) ? 'active' : 'default'}
                        onClick={() => toggleTag(tag.id)}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ingredients */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-neutral-heading">
              Ingredients *
            </label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => appendIngredient({ item: '', quantity: '', unit: '', is_garnish: false })}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Ingredient
            </Button>
          </div>

          <div className="space-y-3">
            {ingredientFields.map((field, index) => {
              const isGarnish = field.is_garnish;
              if (isGarnish) return null; // Hide garnish items here
              
              return (
                <div key={field.id} className="flex gap-2">
                  <Input
                    {...register(`ingredients.${index}.quantity`)}
                    placeholder="1"
                    className="w-20"
                  />
                  <Input
                    {...register(`ingredients.${index}.unit`)}
                    placeholder="cup"
                    className="w-24"
                  />
                  <Input
                    {...register(`ingredients.${index}.item`)}
                    placeholder="Flour"
                    className="flex-1"
                  />
                  {ingredientFields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeIngredient(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
          {errors.ingredients && (
            <p className="text-sm text-red-500 mt-1">{errors.ingredients.message}</p>
          )}
        </div>

        {/* Garnish Section */}
        <div>
          <div className="border-t border-neutral-border pt-6">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-neutral-heading">
                For Serving (Optional)
              </label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => appendIngredient({ item: '', quantity: '', unit: '', is_garnish: true })}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Garnish
              </Button>
            </div>
            <p className="text-sm text-neutral-muted mb-3">
              Add garnish or toppings. Quantity and unit are optional.
            </p>

            <div className="space-y-3">
              {ingredientFields.map((field, index) => {
                const isGarnish = field.is_garnish;
                if (!isGarnish) return null; // Show only garnish items here
                
                return (
                  <div key={field.id} className="flex gap-2">
                    <Input
                      {...register(`ingredients.${index}.quantity`)}
                      placeholder="2"
                      className="w-20"
                    />
                    <Input
                      {...register(`ingredients.${index}.unit`)}
                      placeholder="sprigs"
                      className="w-24"
                    />
                    <Input
                      {...register(`ingredients.${index}.item`)}
                      placeholder="Fresh parsley, chopped"
                      className="flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => removeIngredient(index)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
          {errors.ingredients && (
            <p className="text-sm text-red-500 mt-2">{errors.ingredients.message || 'Please check your ingredients'}</p>
          )}
        </div>

        {/* Instructions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <label className="text-sm font-medium text-neutral-heading">
              Instructions *
            </label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => appendInstruction({ instruction: '' })}
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Step
            </Button>
          </div>

          <div className="space-y-3">
            {instructionFields.map((field, index) => (
              <div key={field.id} className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-forest-600 text-white flex items-center justify-center font-semibold mt-2">
                  {index + 1}
                </div>
                <Textarea
                  {...register(`instructions.${index}.instruction`)}
                  placeholder="Describe this step..."
                  className="flex-1"
                />
                {instructionFields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeInstruction(index)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors h-fit"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
          </div>
          {errors.instructions && (
            <p className="text-sm text-red-500 mt-1">{errors.instructions.message}</p>
          )}
        </div>

        {/* Submit */}
        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            variant="primary"
            loading={
              createMutation.isPending || 
              updateMutation.isPending || 
              uploadMutation.isPending ||
              downloadingImage
            }
            fullWidth
          >
            {downloadingImage 
              ? 'Downloading image...' 
              : isEditMode ? 'Update Recipe' : 'Create Recipe'
            }
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
        </div>
      </form>

      {/* Import Dialog */}
      <ImportDialog
        isOpen={showImportDialog}
        onClose={() => setShowImportDialog(false)}
        onImport={handleImportedRecipe}
      />
    </div>
  );
}
