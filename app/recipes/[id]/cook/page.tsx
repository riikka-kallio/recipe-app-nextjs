'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useRecipe } from '@/lib/hooks/useRecipes';
import { useWakeLock } from '@/lib/hooks/useWakeLock';
import { useCookingProgress } from '@/lib/hooks/useCookingProgress';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Sun, Moon, ChevronDown, ChevronUp, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function CookingModePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const recipeId = Number(id);

  const { data, isLoading, error } = useRecipe(recipeId);
  const { isActive: isWakeLockActive, isSupported: isWakeLockSupported, toggleWakeLock } = useWakeLock();
  const {
    toggleStep,
    toggleIngredient,
    resetProgress,
    isStepCompleted,
    isIngredientCompleted,
    getCompletionStats,
  } = useCookingProgress(recipeId);

  const [showIngredients, setShowIngredients] = useState(true);
  const nextStepRef = useRef<HTMLDivElement>(null);

  const recipe = data?.data;
  const stats = recipe
    ? getCompletionStats(recipe.instructions?.length || 0, recipe.ingredients?.length || 0)
    : null;

  // Auto-scroll to next uncompleted step
  useEffect(() => {
    if (nextStepRef.current) {
      nextStepRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [stats?.completedSteps]);

  const handleResetProgress = () => {
    resetProgress();
    toast.success('Progress reset');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forest-600 mx-auto mb-4" />
          <p className="text-neutral-text">Loading recipe...</p>
        </div>
      </div>
    );
  }

  if (error || !recipe) {
    return (
      <div className="min-h-screen bg-neutral-background flex items-center justify-center px-4">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-neutral-heading mb-2">Recipe not found</h2>
          <p className="text-neutral-text mb-4">The recipe you&apos;re looking for doesn&apos;t exist.</p>
          <Button onClick={() => router.push('/')}>Back to Home</Button>
        </div>
      </div>
    );
  }

  const nextUncompletedStep = recipe.instructions?.find((inst) => !isStepCompleted(inst.step_number));

  return (
    <div className="min-h-screen bg-neutral-background">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-neutral-light shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <button
              onClick={() => router.push(`/recipes/${id}`)}
              className="flex items-center gap-2 text-neutral-text hover:text-neutral-heading transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Exit Cooking Mode</span>
            </button>

            <h1 className="text-lg sm:text-xl font-bold text-neutral-heading truncate flex-1 text-center">
              {recipe.title}
            </h1>

            <div className="flex items-center gap-2 flex-shrink-0">
              {isWakeLockSupported && (
                <Button
                  variant={isWakeLockActive ? 'secondary' : 'ghost'}
                  onClick={toggleWakeLock}
                  className="flex items-center gap-2"
                  title={isWakeLockActive ? 'Screen stays awake' : 'Enable keep awake'}
                >
                  {isWakeLockActive ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                  <span className="hidden sm:inline">{isWakeLockActive ? 'Awake' : 'Sleep'}</span>
                </Button>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          {stats && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-sm text-neutral-text mb-2">
                <span>
                  {stats.completedSteps} / {stats.totalSteps} steps completed
                </span>
                <span>{stats.stepsPercentage}%</span>
              </div>
              <div className="w-full bg-neutral-light rounded-full h-2">
                <div
                  className="bg-forest-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${stats.stepsPercentage}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6 sm:py-8 space-y-6">
        {/* Ingredients Section (Collapsible) */}
        {recipe.ingredients && recipe.ingredients.length > 0 && (
          <section className="bg-white rounded-xl border border-neutral-light p-4 sm:p-6">
            <button
              onClick={() => setShowIngredients(!showIngredients)}
              className="w-full flex items-center justify-between text-left"
            >
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-heading">Ingredients</h2>
              <div className="flex items-center gap-2">
                {stats && (
                  <span className="text-sm text-neutral-text">
                    {stats.completedIngredients}/{stats.totalIngredients}
                  </span>
                )}
                {showIngredients ? (
                  <ChevronUp className="w-5 h-5 text-neutral-text" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-neutral-text" />
                )}
              </div>
            </button>

            {showIngredients && (
              <ul className="mt-4 space-y-3">
                {recipe.ingredients.filter(ing => !ing.is_garnish).map((ingredient) => {
                  const isCompleted = isIngredientCompleted(ingredient.id);
                  return (
                    <li key={ingredient.id} className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id={`ingredient-${ingredient.id}`}
                        checked={isCompleted}
                        onChange={() => toggleIngredient(ingredient.id)}
                        className="mt-1.5 w-5 h-5 text-forest-600 border-neutral-light rounded focus:ring-forest-500 cursor-pointer flex-shrink-0"
                      />
                      <label
                        htmlFor={`ingredient-${ingredient.id}`}
                        className={cn(
                          'flex-1 text-base sm:text-lg cursor-pointer select-none',
                          isCompleted ? 'line-through text-neutral-text opacity-60' : 'text-neutral-heading'
                        )}
                      >
                        {ingredient.quantity && ingredient.unit && (
                          <span className="font-medium">
                            {ingredient.quantity} {ingredient.unit}
                          </span>
                        )}{' '}
                        {ingredient.item}
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        )}

        {/* Instructions Section */}
        {recipe.instructions && recipe.instructions.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-heading">Instructions</h2>
              <Button variant="ghost" size="sm" onClick={handleResetProgress} className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4" />
                <span className="hidden sm:inline">Reset</span>
              </Button>
            </div>

            <div className="space-y-4">
              {recipe.instructions.map((instruction) => {
                const isCompleted = isStepCompleted(instruction.step_number);
                const isNextStep = nextUncompletedStep?.id === instruction.id;

                return (
                  <div
                    key={instruction.id}
                    ref={isNextStep ? nextStepRef : null}
                    className={cn(
                      'bg-white rounded-xl border-2 transition-all duration-200',
                      isCompleted
                        ? 'border-neutral-light opacity-60'
                        : isNextStep
                        ? 'border-forest-600 shadow-md'
                        : 'border-neutral-light'
                    )}
                  >
                    <div className="p-4 sm:p-6 flex gap-4">
                      <input
                        type="checkbox"
                        id={`step-${instruction.step_number}`}
                        checked={isCompleted}
                        onChange={() => toggleStep(instruction.step_number)}
                        className="mt-1.5 w-6 h-6 text-forest-600 border-neutral-light rounded focus:ring-forest-500 cursor-pointer flex-shrink-0"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div
                            className={cn(
                              'w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm flex-shrink-0',
                              isCompleted
                                ? 'bg-neutral-light text-neutral-text'
                                : 'bg-forest-600 text-white'
                            )}
                          >
                            {instruction.step_number}
                          </div>
                          {isNextStep && (
                            <span className="text-xs font-semibold text-forest-600 bg-forest-50 px-2 py-1 rounded">
                              NEXT
                            </span>
                          )}
                        </div>
                        <label
                          htmlFor={`step-${instruction.step_number}`}
                          className={cn(
                            'block text-base sm:text-xl cursor-pointer select-none leading-relaxed',
                            isCompleted ? 'line-through text-neutral-text' : 'text-neutral-heading'
                          )}
                        >
                          {instruction.instruction}
                        </label>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Completion Message */}
            {stats && stats.completedSteps === stats.totalSteps && stats.totalSteps > 0 && (
              <div className="mt-8 space-y-4">
                <div className="bg-forest-50 border-2 border-forest-600 rounded-xl p-6 text-center">
                  <p className="text-2xl font-bold text-forest-600 mb-2">🎉 All done!</p>
                  <p className="text-neutral-text mb-4">
                    You&apos;ve completed all the steps. Enjoy your {recipe.title}!
                  </p>
                  <Button onClick={() => router.push(`/recipes/${id}`)}>View Recipe</Button>
                </div>

                {/* Garnish Reminder */}
                {recipe.ingredients?.some(ing => ing.is_garnish) && (
                  <div className="bg-peachy-50 border-2 border-peachy-500 rounded-xl p-6">
                    <h3 className="text-lg font-bold text-neutral-heading mb-3">For Serving</h3>
                    <ul className="space-y-2">
                      {recipe.ingredients.filter(ing => ing.is_garnish).map((ingredient) => (
                        <li key={ingredient.id} className="flex items-start gap-2 text-neutral-heading">
                          <span className="text-peachy-500 mt-1">•</span>
                          <span>
                            {ingredient.quantity && ingredient.unit && (
                              <span className="font-medium">
                                {ingredient.quantity} {ingredient.unit}
                              </span>
                            )}{' '}
                            {ingredient.item}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
