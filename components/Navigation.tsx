'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search, Plus, User } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

export const Navigation: React.FC = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/recipes?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  // Keyboard shortcut for search (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      {/* Skip to main content link */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-forest-600 focus:text-white focus:rounded-lg"
      >
        Skip to main content
      </a>

      <nav aria-label="Main navigation" className="sticky top-0 z-50 bg-white border-b border-neutral-light shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="text-2xl font-bold text-forest-600">
                RecipeShare
              </div>
            </Link>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center gap-6">
              <Link
                href="/recipes"
                className="text-gray-700 hover:text-forest-green font-medium transition-colors"
              >
                Recipes
              </Link>
              <Link
                href="/blog"
                className="text-gray-700 hover:text-forest-green font-medium transition-colors"
              >
                Blog
              </Link>
            </div>

            {/* Search Bar - Desktop */}
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8" role="search">
              <div className="relative w-full">
                <Input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search recipes... (Cmd+K)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10"
                  aria-label="Search recipes"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-text/50" aria-hidden="true" />
              </div>
            </form>

            {/* Actions */}
            <div className="flex items-center gap-3">
              {/* Create Recipe Button */}
              <Link href="/recipes/new">
                <Button variant="primary" size="md" className="hidden sm:flex items-center gap-2">
                  <Plus className="w-4 h-4" aria-hidden="true" />
                  Create Recipe
                </Button>
                <Button variant="primary" size="md" className="sm:hidden p-2" aria-label="Create recipe">
                  <Plus className="w-5 h-5" aria-hidden="true" />
                </Button>
              </Link>

              {/* User Profile */}
              <Link href="/profile">
                <button 
                  className="p-2 rounded-full hover:bg-neutral-light transition-colors"
                  aria-label="View profile"
                >
                  <User className="w-6 h-6 text-neutral-text" aria-hidden="true" />
                </button>
              </Link>
            </div>
          </div>

          {/* Mobile Navigation Links */}
          <div className="md:hidden flex gap-4 pb-2">
            <Link
              href="/recipes"
              className="text-gray-700 hover:text-forest-green font-medium transition-colors"
            >
              Recipes
            </Link>
            <Link
              href="/blog"
              className="text-gray-700 hover:text-forest-green font-medium transition-colors"
            >
              Blog
            </Link>
          </div>

          {/* Search Bar - Mobile */}
          <form onSubmit={handleSearch} className="md:hidden pb-3" role="search">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search recipes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10"
                aria-label="Search recipes"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-text/50" aria-hidden="true" />
            </div>
          </form>
        </div>
      </nav>
    </>
  );
};
