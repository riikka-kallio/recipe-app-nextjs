'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { X, Search, Languages } from 'lucide-react';
import { SUPPORTED_LANGUAGES, getLanguagesByRegion } from '@/lib/types/translation';
import type { SupportedLanguage } from '@/lib/types/translation';

interface LanguageSelectorProps {
  currentLanguage?: string;
  onSelectLanguage: (languageCode: string) => void;
  onClose: () => void;
  isOpen: boolean;
  remainingTranslations?: number | null;
}

export function LanguageSelector({
  currentLanguage = 'en',
  onSelectLanguage,
  onClose,
  isOpen,
  remainingTranslations,
}: LanguageSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const languagesByRegion = getLanguagesByRegion();

  if (!isOpen) return null;

  // Filter languages by search query
  const filteredLanguages = SUPPORTED_LANGUAGES.filter(lang => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      lang.name.toLowerCase().includes(query) ||
      lang.nativeName.toLowerCase().includes(query) ||
      lang.code.toLowerCase().includes(query)
    );
  });

  const handleLanguageClick = (code: string) => {
    if (code !== currentLanguage) {
      onSelectLanguage(code);
    }
    onClose();
  };

  const renderLanguageButton = (lang: SupportedLanguage) => {
    const isSelected = lang.code === currentLanguage;
    
    return (
      <button
        key={lang.code}
        onClick={() => handleLanguageClick(lang.code)}
        disabled={isSelected}
        className={`
          flex items-center gap-3 w-full px-4 py-3 rounded-lg text-left transition-colors
          ${isSelected
            ? 'bg-primary-light text-primary-dark cursor-not-allowed'
            : 'hover:bg-neutral-surface text-neutral-heading'
          }
        `}
      >
        <span className="text-2xl">{lang.flag}</span>
        <div className="flex-1">
          <div className="font-medium">{lang.name}</div>
          <div className="text-sm text-neutral-text">{lang.nativeName}</div>
        </div>
        {isSelected && (
          <span className="text-xs bg-primary text-white px-2 py-1 rounded">
            Current
          </span>
        )}
      </button>
    );
  };

  const renderRegionSection = (region: string, languages: SupportedLanguage[]) => {
    const filtered = languages.filter(lang =>
      filteredLanguages.some(fl => fl.code === lang.code)
    );

    if (filtered.length === 0) return null;

    const regionNames: Record<string, string> = {
      europe: 'European Languages',
      asia: 'Asian Languages',
      americas: 'Americas',
      other: 'Other Languages',
    };

    return (
      <div key={region} className="mb-6">
        <h3 className="text-sm font-semibold text-neutral-text uppercase tracking-wide mb-3">
          {regionNames[region]}
        </h3>
        <div className="space-y-2">
          {filtered.map(renderLanguageButton)}
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-neutral-border">
            <div className="flex items-center gap-3">
              <Languages className="w-6 h-6 text-primary" />
              <div>
                <h2 className="text-xl font-bold text-neutral-heading">
                  Translate Recipe
                </h2>
                {remainingTranslations !== null && remainingTranslations !== undefined && (
                  <p className="text-sm text-neutral-text mt-1">
                    {remainingTranslations} translations remaining this month
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-neutral-text hover:text-neutral-heading transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Search */}
          <div className="p-6 border-b border-neutral-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-text" />
              <input
                type="text"
                placeholder="Search languages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-neutral-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          {/* Language List */}
          <div className="flex-1 overflow-y-auto p-6">
            {searchQuery ? (
              // Show flat filtered list when searching
              <div className="space-y-2">
                {filteredLanguages.length > 0 ? (
                  filteredLanguages.map(renderLanguageButton)
                ) : (
                  <div className="text-center py-8 text-neutral-text">
                    No languages found matching "{searchQuery}"
                  </div>
                )}
              </div>
            ) : (
              // Show grouped by region when not searching
              <>
                {renderRegionSection('europe', languagesByRegion.europe)}
                {renderRegionSection('asia', languagesByRegion.asia)}
                {renderRegionSection('americas', languagesByRegion.americas)}
                {renderRegionSection('other', languagesByRegion.other)}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-neutral-border bg-neutral-surface">
            <div className="flex items-center justify-between text-sm text-neutral-text">
              <span>{SUPPORTED_LANGUAGES.length} languages supported</span>
              <Button variant="secondary" onClick={onClose}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
