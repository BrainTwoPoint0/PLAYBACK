'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search as SearchIcon, X, Users, Video } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent } from './ui/card';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { cn } from '../utils/cn';

interface SearchProps {
  onResultSelect?: (result: any) => void;
  placeholder?: string;
  className?: string;
}

interface UserResult {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string;
  sport: string;
  highlights_count: number;
  achievements_count: number;
}

interface HighlightResult {
  id: string;
  title: string;
  user_profile: { full_name: string };
  sport_name: string;
  views_count: number;
  likes_count: number;
  duration: number;
}

type SearchResult = UserResult | HighlightResult;

export default function Search({
  onResultSelect,
  placeholder = 'Search athletes, highlights...',
  className,
}: SearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'highlights'>('users');
  const [loading, setLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mock results for demonstration
  const mockUsers: UserResult[] = [
    {
      id: '1',
      full_name: 'Alex Johnson',
      username: 'alexj',
      avatar_url: '/team/karim.jpeg',
      sport: 'Football',
      highlights_count: 12,
      achievements_count: 5,
    },
    {
      id: '2',
      full_name: 'Sarah Williams',
      username: 'sarahw',
      avatar_url: '/team/jeff.jpg',
      sport: 'Basketball',
      highlights_count: 8,
      achievements_count: 3,
    },
  ];

  const mockHighlights: HighlightResult[] = [
    {
      id: '1',
      title: 'Amazing Goal from 30 yards',
      user_profile: { full_name: 'Alex Johnson' },
      sport_name: 'Football',
      views_count: 1250,
      likes_count: 89,
      duration: 45,
    },
    {
      id: '2',
      title: 'Perfect Three-Pointer',
      user_profile: { full_name: 'Sarah Williams' },
      sport_name: 'Basketball',
      views_count: 890,
      likes_count: 67,
      duration: 32,
    },
  ];

  // Type guards
  const isUserResult = (result: SearchResult): result is UserResult => {
    return 'full_name' in result && 'sport' in result;
  };

  const isHighlightResult = (
    result: SearchResult
  ): result is HighlightResult => {
    return 'title' in result && 'user_profile' in result;
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle search
  useEffect(() => {
    if (query.trim()) {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        setLoading(false);
      }, 500);
    }
  }, [query]);

  // Handle result click
  const handleResultClick = (result: SearchResult) => {
    onResultSelect?.(result);
    setIsOpen(false);
    setQuery('');
  };

  // Clear search
  const clearSearch = () => {
    setQuery('');
    inputRef.current?.focus();
  };

  const results: SearchResult[] =
    activeTab === 'users' ? mockUsers : mockHighlights;

  return (
    <div ref={searchRef} className={cn('relative w-full max-w-2xl', className)}>
      {/* Search Input */}
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className="pl-10 pr-20 h-12 bg-gray-900/50 border-gray-700 text-white placeholder-gray-400 focus:border-blue-500 focus:ring-blue-500"
        />
        {query && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearSearch}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 text-gray-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Search Results */}
      <AnimatePresence>
        {isOpen && query.trim() && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-xl shadow-2xl z-50 max-h-96 overflow-hidden"
          >
            {/* Tabs */}
            <div className="flex border-b border-gray-700">
              <button
                onClick={() => setActiveTab('users')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors',
                  activeTab === 'users'
                    ? 'text-blue-400 border-b-2 border-blue-400'
                    : 'text-gray-400 hover:text-white'
                )}
              >
                <Users className="h-4 w-4" />
                Athletes
              </button>
              <button
                onClick={() => setActiveTab('highlights')}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors',
                  activeTab === 'highlights'
                    ? 'text-blue-400 border-b-2 border-blue-400'
                    : 'text-gray-400 hover:text-white'
                )}
              >
                <Video className="h-4 w-4" />
                Highlights
              </button>
            </div>

            {/* Results */}
            <div className="max-h-80 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              ) : results.length > 0 ? (
                <div className="p-4 space-y-3">
                  {results.map((result, index) => (
                    <motion.div
                      key={result.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => handleResultClick(result)}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800/50 transition-colors cursor-pointer"
                    >
                      {isUserResult(result) ? (
                        <>
                          <Avatar className="h-12 w-12">
                            <AvatarImage
                              src={result.avatar_url}
                              alt={result.full_name}
                            />
                            <AvatarFallback className="bg-blue-500 text-white">
                              {result.full_name?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-white truncate">
                              {result.full_name}
                            </h4>
                            <p className="text-sm text-gray-400 truncate">
                              {result.sport}
                            </p>
                            <div className="flex items-center gap-4 mt-1">
                              <span className="text-xs text-gray-500">
                                {result.highlights_count} highlights
                              </span>
                              <span className="text-xs text-gray-500">
                                {result.achievements_count} achievements
                              </span>
                            </div>
                          </div>
                        </>
                      ) : isHighlightResult(result) ? (
                        <>
                          <div className="relative h-16 w-24 bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                              <Video className="h-6 w-6 text-white" />
                            </div>
                            {result.duration && (
                              <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1 rounded">
                                {Math.floor(result.duration / 60)}:
                                {(result.duration % 60)
                                  .toString()
                                  .padStart(2, '0')}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-white truncate">
                              {result.title}
                            </h4>
                            <p className="text-sm text-gray-400 truncate">
                              by {result.user_profile.full_name}
                            </p>
                            <div className="flex items-center gap-4 mt-1">
                              <span className="text-xs text-gray-500">
                                {result.views_count} views
                              </span>
                              <span className="text-xs text-gray-500">
                                {result.likes_count} likes
                              </span>
                            </div>
                          </div>
                        </>
                      ) : null}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <div className="h-12 w-12 mx-auto mb-3 opacity-50">
                    {activeTab === 'users' ? (
                      <Users className="h-full w-full" />
                    ) : (
                      <Video className="h-full w-full" />
                    )}
                  </div>
                  <p>
                    No {activeTab === 'users' ? 'athletes' : 'highlights'} found
                  </p>
                  <p className="text-sm">Try adjusting your search</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
