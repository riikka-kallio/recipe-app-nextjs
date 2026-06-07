import type { Recipe } from './index';

export interface SupportedLanguage {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
  region: 'europe' | 'asia' | 'americas' | 'other';
  usesMetric: boolean; // For unit conversion
}

export interface TranslationMetadata {
  source_language: string;
  target_language: string;
  translated_at: string;
}

export interface TranslatedRecipe extends Omit<Recipe, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'likes_count' | 'is_liked'> {
  translation_metadata: TranslationMetadata;
}

export interface TranslationRequest {
  recipe_id: number;
  target_language: string;
  source_language?: string;
}

export interface TranslationResponse {
  success: boolean;
  data?: TranslatedRecipe;
  error?: string;
  cached?: boolean;
}

// Supported languages with metadata
export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  // European languages
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧', region: 'europe', usesMetric: false },
  { code: 'fi', name: 'Finnish', nativeName: 'Suomi', flag: '🇫🇮', region: 'europe', usesMetric: true },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪', region: 'europe', usesMetric: true },
  { code: 'no', name: 'Norwegian', nativeName: 'Norsk', flag: '🇳🇴', region: 'europe', usesMetric: true },
  { code: 'da', name: 'Danish', nativeName: 'Dansk', flag: '🇩🇰', region: 'europe', usesMetric: true },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪', region: 'europe', usesMetric: true },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷', region: 'europe', usesMetric: true },
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸', region: 'europe', usesMetric: true },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹', region: 'europe', usesMetric: true },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇵🇹', region: 'europe', usesMetric: true },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱', region: 'europe', usesMetric: true },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺', region: 'europe', usesMetric: true },
  
  // Asian languages
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳', region: 'asia', usesMetric: true },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵', region: 'asia', usesMetric: true },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷', region: 'asia', usesMetric: true },
];

// Helper functions
export function getLanguageByCode(code: string): SupportedLanguage | undefined {
  return SUPPORTED_LANGUAGES.find(lang => lang.code === code);
}

export function getLanguageName(code: string): string {
  const lang = getLanguageByCode(code);
  return lang ? lang.name : code.toUpperCase();
}

export function getLanguageNativeName(code: string): string {
  const lang = getLanguageByCode(code);
  return lang ? lang.nativeName : code.toUpperCase();
}

export function getLanguageFlag(code: string): string {
  const lang = getLanguageByCode(code);
  return lang ? lang.flag : '🌐';
}

export function shouldUseMetricUnits(languageCode: string): boolean {
  const lang = getLanguageByCode(languageCode);
  return lang ? lang.usesMetric : true; // Default to metric
}

// Group languages by region for UI
export function getLanguagesByRegion() {
  const grouped: Record<string, SupportedLanguage[]> = {
    europe: [],
    asia: [],
    americas: [],
    other: [],
  };

  SUPPORTED_LANGUAGES.forEach(lang => {
    grouped[lang.region].push(lang);
  });

  return grouped;
}
