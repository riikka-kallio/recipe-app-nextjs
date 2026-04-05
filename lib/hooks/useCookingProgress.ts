'use client';

import { useState } from 'react';

interface CookingProgress {
  recipeId: number;
  completedSteps: number[];
  completedIngredients: number[];
  lastUpdated: string;
}

export const useCookingProgress = (recipeId: number) => {
  const storageKey = `cooking-progress-${recipeId}`;

  const loadProgress = (): CookingProgress => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (err) {
      console.error('Failed to load cooking progress:', err);
    }
    return {
      recipeId,
      completedSteps: [],
      completedIngredients: [],
      lastUpdated: new Date().toISOString(),
    };
  };

  const [progress, setProgress] = useState<CookingProgress>(loadProgress);

  const saveProgress = (newProgress: CookingProgress) => {
    try {
      const updated = {
        ...newProgress,
        lastUpdated: new Date().toISOString(),
      };
      localStorage.setItem(storageKey, JSON.stringify(updated));
      setProgress(updated);
    } catch (err) {
      console.error('Failed to save cooking progress:', err);
    }
  };

  const toggleStep = (stepNumber: number) => {
    const completedSteps = progress.completedSteps.includes(stepNumber)
      ? progress.completedSteps.filter((s) => s !== stepNumber)
      : [...progress.completedSteps, stepNumber];

    saveProgress({
      ...progress,
      completedSteps,
    });
  };

  const toggleIngredient = (ingredientId: number) => {
    const completedIngredients = progress.completedIngredients.includes(ingredientId)
      ? progress.completedIngredients.filter((i) => i !== ingredientId)
      : [...progress.completedIngredients, ingredientId];

    saveProgress({
      ...progress,
      completedIngredients,
    });
  };

  const resetProgress = () => {
    const emptyProgress: CookingProgress = {
      recipeId,
      completedSteps: [],
      completedIngredients: [],
      lastUpdated: new Date().toISOString(),
    };
    localStorage.removeItem(storageKey);
    setProgress(emptyProgress);
  };

  const isStepCompleted = (stepNumber: number) => {
    return progress.completedSteps.includes(stepNumber);
  };

  const isIngredientCompleted = (ingredientId: number) => {
    return progress.completedIngredients.includes(ingredientId);
  };

  const getCompletionStats = (totalSteps: number, totalIngredients: number) => {
    return {
      completedSteps: progress.completedSteps.length,
      totalSteps,
      completedIngredients: progress.completedIngredients.length,
      totalIngredients,
      stepsPercentage: totalSteps > 0 ? Math.round((progress.completedSteps.length / totalSteps) * 100) : 0,
      ingredientsPercentage: totalIngredients > 0 ? Math.round((progress.completedIngredients.length / totalIngredients) * 100) : 0,
    };
  };

  return {
    progress,
    toggleStep,
    toggleIngredient,
    resetProgress,
    isStepCompleted,
    isIngredientCompleted,
    getCompletionStats,
  };
};
