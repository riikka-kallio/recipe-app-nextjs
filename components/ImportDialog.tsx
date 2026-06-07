'use client';

import React, { useState } from 'react';
import { X, Link as LinkIcon, FileText, Image as ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';
import type { ParsedRecipe } from '@/lib/types/import';

interface ImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (recipe: ParsedRecipe) => void;
}

type ImportTab = 'url' | 'pdf' | 'image';

export function ImportDialog({ isOpen, onClose, onImport }: ImportDialogProps) {
  const [activeTab, setActiveTab] = useState<ImportTab>('url');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  if (!isOpen) return null;

  const handleImportUrl = async () => {
    if (!url.trim()) {
      toast.error('Please enter a URL');
      return;
    }

    setLoading(true);
    setStatusMessage('Fetching content...');

    try {
      const response = await fetch('/api/import/url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to import recipe');
      }

      toast.success('Recipe imported successfully!');
      onImport(result.data);
      onClose();
      setUrl('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to import recipe');
    } finally {
      setLoading(false);
      setStatusMessage('');
    }
  };

  const handleImportFile = async (file: File, type: 'pdf' | 'image') => {
    setLoading(true);
    setStatusMessage(
      type === 'pdf' ? 'Extracting text from PDF...' : 'Analyzing image...'
    );

    try {
      const formData = new FormData();
      formData.append('file', file);

      const endpoint = type === 'pdf' ? '/api/import/pdf' : '/api/import/image';
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to import recipe');
      }

      setStatusMessage('Parsing recipe...');
      await new Promise((resolve) => setTimeout(resolve, 500));

      toast.success('Recipe imported successfully!');
      onImport(result.data);
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to import recipe');
    } finally {
      setLoading(false);
      setStatusMessage('');
    }
  };

  const tabs = [
    { id: 'url' as const, label: 'From URL', icon: LinkIcon },
    { id: 'pdf' as const, label: 'From PDF', icon: FileText },
    { id: 'image' as const, label: 'From Image', icon: ImageIcon },
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-neutral-light">
          <h2 className="text-2xl font-bold text-neutral-heading">Import Recipe</h2>
          <button
            onClick={onClose}
            className="text-neutral-text hover:text-neutral-heading transition-colors"
            disabled={loading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-neutral-light">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              disabled={loading}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-forest-600 border-b-2 border-forest-600'
                  : 'text-neutral-text hover:text-neutral-heading'
              } disabled:opacity-50`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-12 h-12 text-forest-600 animate-spin mb-4" />
              <p className="text-neutral-text">{statusMessage}</p>
            </div>
          ) : (
            <>
              {activeTab === 'url' && (
                <div className="space-y-4">
                  <p className="text-neutral-text text-sm">
                    Import recipes from popular sites like AllRecipes, Food Network, NYT
                    Cooking, and more.
                  </p>
                  <Input
                    type="url"
                    placeholder="https://www.example.com/recipe"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleImportUrl()}
                  />
                  <Button onClick={handleImportUrl} className="w-full">
                    Import from URL
                  </Button>
                </div>
              )}

              {activeTab === 'pdf' && (
                <div className="space-y-4">
                  <p className="text-neutral-text text-sm">
                    Upload a PDF file containing a recipe. We'll extract and parse the
                    recipe for you.
                  </p>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImportFile(file, 'pdf');
                    }}
                    className="block w-full text-sm text-neutral-text file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-forest-600 file:text-white hover:file:bg-forest-700"
                  />
                </div>
              )}

              {activeTab === 'image' && (
                <div className="space-y-4">
                  <p className="text-neutral-text text-sm">
                    Upload an image of a recipe card or cookbook page. We'll use OCR to
                    extract the text.
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImportFile(file, 'image');
                    }}
                    className="block w-full text-sm text-neutral-text file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-forest-600 file:text-white hover:file:bg-forest-700"
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
