import { useState, useEffect } from 'react';
import type { Recipe } from '@/lib/types';
import type { TranslatedRecipe } from '@/lib/types/translation';

interface TranslationState {
  translatedRecipe: TranslatedRecipe | null;
  isTranslating: boolean;
  error: string | null;
  cached: boolean;
  remainingTranslations: number | null;
}

interface UseTranslationReturn extends TranslationState {
  translateRecipe: (recipeId: number, targetLanguage: string, sourceLanguage?: string) => Promise<void>;
  clearTranslation: () => void;
  isTranslated: boolean;
}

// Session storage cache key
const CACHE_KEY_PREFIX = 'translation_cache_';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

interface CachedTranslation {
  data: TranslatedRecipe;
  timestamp: number;
}

function getSessionCache(recipeId: number, targetLang: string, sourceLang: string): TranslatedRecipe | null {
  if (typeof window === 'undefined') return null;
  
  const key = `${CACHE_KEY_PREFIX}${recipeId}_${sourceLang}_${targetLang}`;
  const cached = sessionStorage.getItem(key);
  
  if (!cached) return null;
  
  try {
    const parsed: CachedTranslation = JSON.parse(cached);
    const age = Date.now() - parsed.timestamp;
    
    if (age > CACHE_DURATION) {
      sessionStorage.removeItem(key);
      return null;
    }
    
    return parsed.data;
  } catch {
    return null;
  }
}

function setSessionCache(recipeId: number, targetLang: string, sourceLang: string, data: TranslatedRecipe): void {
  if (typeof window === 'undefined') return;
  
  const key = `${CACHE_KEY_PREFIX}${recipeId}_${sourceLang}_${targetLang}`;
  const cached: CachedTranslation = {
    data,
    timestamp: Date.now(),
  };
  
  try {
    sessionStorage.setItem(key, JSON.stringify(cached));
  } catch (error) {
    console.warn('Failed to cache translation in sessionStorage:', error);
  }
}

export function useTranslation(initialRecipe?: Recipe): UseTranslationReturn {
  const [state, setState] = useState<TranslationState>({
    translatedRecipe: null,
    isTranslating: false,
    error: null,
    cached: false,
    remainingTranslations: null,
  });

  const translateRecipe = async (
    recipeId: number,
    targetLanguage: string,
    sourceLanguage: string = 'en'
  ) => {
    // Check session storage first
    const cachedData = getSessionCache(recipeId, targetLanguage, sourceLanguage);
    if (cachedData) {
      setState({
        translatedRecipe: cachedData,
        isTranslating: false,
        error: null,
        cached: true,
        remainingTranslations: null,
      });
      return;
    }

    setState(prev => ({ ...prev, isTranslating: true, error: null }));

    try {
      const response = await fetch(`/api/recipes/${recipeId}/translate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target_language: targetLanguage,
          source_language: sourceLanguage,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Translation failed');
      }

      const translatedRecipe = result.data;
      
      // Cache in session storage
      setSessionCache(recipeId, targetLanguage, sourceLanguage, translatedRecipe);

      setState({
        translatedRecipe,
        isTranslating: false,
        error: null,
        cached: result.data.cached || false,
        remainingTranslations: result.data.remaining_translations,
      });
    } catch (error: any) {
      setState({
        translatedRecipe: null,
        isTranslating: false,
        error: error.message || 'Failed to translate recipe',
        cached: false,
        remainingTranslations: null,
      });
    }
  };

  const clearTranslation = () => {
    setState({
      translatedRecipe: null,
      isTranslating: false,
      error: null,
      cached: false,
      remainingTranslations: null,
    });
  };

  return {
    ...state,
    translateRecipe,
    clearTranslation,
    isTranslated: state.translatedRecipe !== null,
  };
}

// Hook to check rate limit status
export function useTranslationRateLimit() {
  const [limit, setLimit] = useState<{
    max: number;
    remaining: number;
    resetDate: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const checkRateLimit = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/recipes/0/translate', {
        method: 'GET',
      });
      
      if (response.ok) {
        const result = await response.json();
        setLimit({
          max: result.data.limit,
          remaining: result.data.remaining,
          resetDate: result.data.reset_date,
        });
      }
    } catch (error) {
      console.error('Failed to check rate limit:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkRateLimit();
  }, []);

  return { limit, loading, refresh: checkRateLimit };
}
