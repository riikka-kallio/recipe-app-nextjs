'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Download, FileJson, FileText, FileImage } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import toast from 'react-hot-toast';

interface ExportMenuProps {
  recipeId: number;
}

export function ExportMenu({ recipeId }: ExportMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleExport = async (format: 'json' | 'pdf' | 'markdown') => {
    try {
      const response = await fetch(`/api/recipes/${recipeId}/export?format=${format}`);

      if (!response.ok) {
        throw new Error('Failed to export recipe');
      }

      // Get filename from Content-Disposition header
      const contentDisposition = response.headers.get('Content-Disposition');
      const filenameMatch = contentDisposition?.match(/filename="(.+)"/);
      const filename = filenameMatch ? filenameMatch[1] : `recipe.${format}`;

      // Download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Recipe exported as ${format.toUpperCase()}`);
      setIsOpen(false);
    } catch (error) {
      toast.error('Failed to export recipe');
    }
  };

  const exportOptions = [
    { format: 'json' as const, label: 'JSON', icon: FileJson },
    { format: 'markdown' as const, label: 'Markdown', icon: FileText },
    { format: 'pdf' as const, label: 'PDF (TXT)', icon: FileImage },
  ];

  return (
    <div className="relative" ref={menuRef}>
      <Button
        variant="ghost"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2"
      >
        <Download className="w-5 h-5" />
        <span className="hidden sm:inline">Export</span>
      </Button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-neutral-light py-2 z-10">
          {exportOptions.map((option) => (
            <button
              key={option.format}
              onClick={() => handleExport(option.format)}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-neutral-text hover:bg-neutral-light transition-colors"
            >
              <option.icon className="w-4 h-4" />
              Export as {option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
