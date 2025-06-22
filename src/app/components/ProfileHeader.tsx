'use client';

import React, { useState } from 'react';
import { User } from '@supabase/supabase-js';
import { motion } from 'framer-motion';
import {
  Edit,
  Share2,
  MapPin,
  Calendar,
  Users,
  Eye,
  Heart,
} from 'lucide-react';
import Image from 'next/image';

interface ProfileHeaderProps {
  user: User | null;
  profile: any;
  stats: {
    views: number;
    connections: number;
    highlights: number;
  };
  onEdit: () => void;
  onShare: () => void;
}

export default function ProfileHeader({
  user,
  profile,
  stats,
  onEdit,
  onShare,
}: ProfileHeaderProps) {
  const [isFollowing, setIsFollowing] = useState(false);

  if (!profile) {
    return (
      <div className="bg-black border border-[var(--timberwolf)] rounded-2xl p-8">
        <div className="animate-pulse">
          <div className="flex items-center space-x-6">
            <div className="w-24 h-24 bg-[var(--ash-grey)]/20 rounded-full"></div>
            <div className="flex-1 space-y-3">
              <div className="h-6 bg-[var(--ash-grey)]/20 rounded w-1/3"></div>
              <div className="h-4 bg-[var(--ash-grey)]/20 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const isOwnProfile = user?.id === profile.id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-black border border-[var(--timberwolf)] rounded-2xl p-8"
    >
      <div className="flex flex-col lg:flex-row items-start lg:items-center space-y-6 lg:space-y-0 lg:space-x-8">
        {/* Profile Picture */}
        <div className="relative">
          <motion.div
            className="w-24 h-24 lg:w-32 lg:h-32 rounded-full overflow-hidden border-2 border-[var(--timberwolf)]"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.2 }}
          >
            {profile.avatar_url ? (
              <Image
                src={profile.avatar_url}
                alt={profile.full_name || 'Profile avatar'}
                width={128}
                height={128}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-[var(--timberwolf)] to-[var(--ash-grey)] flex items-center justify-center">
                <span className="text-black text-2xl lg:text-3xl font-bold">
                  {profile.full_name?.charAt(0) || 'U'}
                </span>
              </div>
            )}
          </motion.div>
        </div>

        {/* Profile Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex-1 min-w-0">
              <motion.h1
                className="text-2xl lg:text-3xl font-bold text-[var(--timberwolf)] truncate"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                {profile.full_name}
              </motion.h1>

              {profile.username && (
                <motion.p
                  className="text-[var(--ash-grey)] text-sm mt-1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  @{profile.username}
                </motion.p>
              )}

              {profile.title && (
                <motion.p
                  className="text-[var(--timberwolf)] mt-2"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {profile.title}
                </motion.p>
              )}

              {/* Location and Join Date */}
              <div className="flex items-center space-x-4 mt-3 text-sm text-[var(--ash-grey)]">
                {profile.location && (
                  <motion.div
                    className="flex items-center space-x-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <MapPin className="w-4 h-4" />
                    <span>{profile.location}</span>
                  </motion.div>
                )}
                {profile.created_at && (
                  <motion.div
                    className="flex items-center space-x-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                  >
                    <Calendar className="w-4 h-4" />
                    <span>
                      Joined {new Date(profile.created_at).toLocaleDateString()}
                    </span>
                  </motion.div>
                )}
              </div>

              {/* Stats */}
              <motion.div
                className="flex items-center space-x-6 mt-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                <div className="flex items-center space-x-1 text-sm">
                  <Eye className="w-4 h-4 text-[var(--ash-grey)]" />
                  <span className="text-[var(--timberwolf)] font-medium">
                    {stats.views}
                  </span>
                  <span className="text-[var(--ash-grey)]">views</span>
                </div>
                <div className="flex items-center space-x-1 text-sm">
                  <Users className="w-4 h-4 text-[var(--ash-grey)]" />
                  <span className="text-[var(--timberwolf)] font-medium">
                    {stats.connections}
                  </span>
                  <span className="text-[var(--ash-grey)]">connections</span>
                </div>
                <div className="flex items-center space-x-1 text-sm">
                  <Heart className="w-4 h-4 text-[var(--ash-grey)]" />
                  <span className="text-[var(--timberwolf)] font-medium">
                    {stats.highlights}
                  </span>
                  <span className="text-[var(--ash-grey)]">highlights</span>
                </div>
              </motion.div>

              {/* Tags */}
              {profile.tags && profile.tags.length > 0 && (
                <motion.div
                  className="flex flex-wrap gap-2 mt-4"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  {profile.tags.map((tag: string, index: number) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-[var(--ash-grey)]/10 border border-[var(--ash-grey)]/20 rounded-full text-xs text-[var(--timberwolf)]"
                    >
                      {tag}
                    </span>
                  ))}
                </motion.div>
              )}
            </div>

            {/* Action Buttons */}
            <motion.div
              className="flex items-center space-x-3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 }}
            >
              {isOwnProfile ? (
                <>
                  <motion.button
                    onClick={onEdit}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center space-x-2 px-4 py-2 bg-[var(--timberwolf)] text-black rounded-lg hover:bg-[var(--ash-grey)] transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Edit</span>
                  </motion.button>
                  <motion.button
                    onClick={onShare}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center space-x-2 px-4 py-2 border border-[var(--timberwolf)] text-[var(--timberwolf)] rounded-lg hover:bg-[var(--timberwolf)]/10 transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Share</span>
                  </motion.button>
                </>
              ) : (
                <>
                  <motion.button
                    onClick={() => setIsFollowing(!isFollowing)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      isFollowing
                        ? 'bg-[var(--ash-grey)]/10 border border-[var(--ash-grey)] text-[var(--ash-grey)]'
                        : 'bg-[var(--timberwolf)] text-black hover:bg-[var(--ash-grey)]'
                    }`}
                  >
                    <Heart
                      className={`w-4 h-4 ${isFollowing ? 'text-red-400' : ''}`}
                    />
                    <span>{isFollowing ? 'Following' : 'Follow'}</span>
                  </motion.button>
                  <motion.button
                    onClick={onShare}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex items-center space-x-2 px-4 py-2 border border-[var(--timberwolf)] text-[var(--timberwolf)] rounded-lg hover:bg-[var(--timberwolf)]/10 transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Share</span>
                  </motion.button>
                </>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
