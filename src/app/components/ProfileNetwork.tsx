'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import {
  Users,
  UserPlus,
  UserCheck,
  UserX,
  Search,
  Filter,
  MessageCircle,
  Share2,
  Globe,
  MapPin,
  Calendar,
  Trophy,
  Star,
  Heart,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface Connection {
  id: string;
  user_id: string;
  connected_user_id: string;
  connected_user_name: string;
  connected_user_avatar?: string;
  connected_user_role: string;
  connected_user_sports: string[];
  connection_type: 'follower' | 'following' | 'mutual' | 'pending';
  connected_at?: string;
  mutual_connections: number;
  shared_sports: string[];
  last_activity?: string;
}

interface NetworkStats {
  followers: number;
  following: number;
  mutual_connections: number;
  total_connections: number;
  pending_requests: number;
}

interface NetworkProps {
  connections: Connection[];
  onConnectionsChange: (connections: Connection[]) => void;
  stats: NetworkStats;
  onStatsChange: (stats: NetworkStats) => void;
  availableSports: any[];
}

export default function ProfileNetwork({
  connections,
  onConnectionsChange,
  stats,
  onStatsChange,
  availableSports,
}: NetworkProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterSport, setFilterSport] = useState<string>('all');

  const filteredConnections = connections.filter((connection) => {
    const nameMatch = connection.connected_user_name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const typeMatch =
      filterType === 'all' || connection.connection_type === filterType;
    const sportMatch =
      filterSport === 'all' ||
      connection.connected_user_sports.includes(filterSport);
    return nameMatch && typeMatch && sportMatch;
  });

  const handleFollow = (connectionId: string) => {
    const updatedConnections = connections.map((conn) => {
      if (conn.id === connectionId) {
        return { ...conn, connection_type: 'following' as const };
      }
      return conn;
    });
    onConnectionsChange(updatedConnections);

    // Update stats
    onStatsChange({
      ...stats,
      following: stats.following + 1,
      total_connections: stats.total_connections + 1,
    });
  };

  const handleUnfollow = (connectionId: string) => {
    const updatedConnections = connections.map((conn) => {
      if (conn.id === connectionId) {
        return { ...conn, connection_type: 'follower' as const };
      }
      return conn;
    });
    onConnectionsChange(updatedConnections);

    // Update stats
    onStatsChange({
      ...stats,
      following: stats.following - 1,
      total_connections: stats.total_connections - 1,
    });
  };

  const handleAcceptRequest = (connectionId: string) => {
    const updatedConnections = connections.map((conn) => {
      if (conn.id === connectionId) {
        return { ...conn, connection_type: 'mutual' as const };
      }
      return conn;
    });
    onConnectionsChange(updatedConnections);

    // Update stats
    onStatsChange({
      ...stats,
      mutual_connections: stats.mutual_connections + 1,
      pending_requests: stats.pending_requests - 1,
    });
  };

  const handleRejectRequest = (connectionId: string) => {
    const updatedConnections = connections.filter(
      (conn) => conn.id !== connectionId
    );
    onConnectionsChange(updatedConnections);

    // Update stats
    onStatsChange({
      ...stats,
      pending_requests: stats.pending_requests - 1,
    });
  };

  const getConnectionTypeColor = (type: string) => {
    const colors = {
      follower: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      following: 'bg-green-500/20 text-green-400 border-green-500/30',
      mutual: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    };
    return colors[type as keyof typeof colors] || colors.follower;
  };

  const getConnectionTypeIcon = (type: string) => {
    const icons = {
      follower: UserCheck,
      following: UserPlus,
      mutual: Users,
      pending: UserX,
    };
    const IconComponent = icons[type as keyof typeof icons] || UserCheck;
    return <IconComponent className="w-4 h-4" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return `${Math.floor(diffInHours / 168)}w ago`;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span>Connections</span>
          </span>
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <UserCheck className="w-4 h-4 text-blue-400" />
              <span className="text-[var(--timberwolf)]">
                {stats.followers}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <UserPlus className="w-4 h-4 text-green-400" />
              <span className="text-[var(--timberwolf)]">
                {stats.following}
              </span>
            </div>
            <div className="flex items-center space-x-1">
              <Users className="w-4 h-4 text-purple-400" />
              <span className="text-[var(--timberwolf)]">
                {stats.mutual_connections}
              </span>
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-[var(--ash-grey)]/5 border border-[var(--timberwolf)] rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-[var(--timberwolf)]">
              {stats.followers}
            </div>
            <div className="text-sm text-[var(--ash-grey)]">Followers</div>
          </div>
          <div className="bg-[var(--ash-grey)]/5 border border-[var(--timberwolf)] rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-[var(--timberwolf)]">
              {stats.following}
            </div>
            <div className="text-sm text-[var(--ash-grey)]">Following</div>
          </div>
          <div className="bg-[var(--ash-grey)]/5 border border-[var(--timberwolf)] rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-[var(--timberwolf)]">
              {stats.mutual_connections}
            </div>
            <div className="text-sm text-[var(--ash-grey)]">Mutual</div>
          </div>
          <div className="bg-[var(--ash-grey)]/5 border border-[var(--timberwolf)] rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-[var(--timberwolf)]">
              {stats.pending_requests}
            </div>
            <div className="text-sm text-[var(--ash-grey)]">Pending</div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--ash-grey)]" />
            <Input
              placeholder="Search connections..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-black border-[var(--ash-grey)] text-[var(--timberwolf)]"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant={filterType === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('all')}
            >
              All
            </Button>
            <Button
              variant={filterType === 'follower' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('follower')}
              className="flex items-center space-x-1"
            >
              <UserCheck className="w-4 h-4" />
              <span>Followers</span>
            </Button>
            <Button
              variant={filterType === 'following' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('following')}
              className="flex items-center space-x-1"
            >
              <UserPlus className="w-4 h-4" />
              <span>Following</span>
            </Button>
            <Button
              variant={filterType === 'mutual' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('mutual')}
              className="flex items-center space-x-1"
            >
              <Users className="w-4 h-4" />
              <span>Mutual</span>
            </Button>
            <Button
              variant={filterType === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('pending')}
              className="flex items-center space-x-1"
            >
              <UserX className="w-4 h-4" />
              <span>Pending</span>
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant={filterSport === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterSport('all')}
            >
              All Sports
            </Button>
            {availableSports.map((sport) => (
              <Button
                key={sport.id}
                variant={filterSport === sport.name ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterSport(sport.name)}
              >
                {sport.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Connections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredConnections.map((connection) => (
            <motion.div
              key={connection.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="bg-[var(--ash-grey)]/5 border border-[var(--timberwolf)] rounded-lg p-4 space-y-3"
            >
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-[var(--timberwolf)]/10 rounded-full flex items-center justify-center">
                    {connection.connected_user_avatar ? (
                      <img
                        src={connection.connected_user_avatar}
                        alt={connection.connected_user_name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <Users className="w-6 h-6 text-[var(--ash-grey)]" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--timberwolf)]">
                      {connection.connected_user_name}
                    </h3>
                    <p className="text-sm text-[var(--ash-grey)]">
                      {connection.connected_user_role}
                    </p>
                  </div>
                </div>
                <Badge
                  variant="outline"
                  className={`text-xs ${getConnectionTypeColor(connection.connection_type)}`}
                >
                  <div className="flex items-center space-x-1">
                    {getConnectionTypeIcon(connection.connection_type)}
                    <span className="capitalize">
                      {connection.connection_type}
                    </span>
                  </div>
                </Badge>
              </div>

              {/* Sports */}
              <div className="flex flex-wrap gap-1">
                {connection.connected_user_sports.map((sport) => (
                  <Badge key={sport} variant="secondary" className="text-xs">
                    {sport}
                  </Badge>
                ))}
              </div>

              {/* Connection Info */}
              <div className="space-y-2 text-xs text-[var(--ash-grey)]">
                {connection.mutual_connections > 0 && (
                  <div className="flex items-center space-x-1">
                    <Users className="w-3 h-3" />
                    <span>
                      {connection.mutual_connections} mutual connections
                    </span>
                  </div>
                )}
                {connection.shared_sports.length > 0 && (
                  <div className="flex items-center space-x-1">
                    <Trophy className="w-3 h-3" />
                    <span>{connection.shared_sports.length} shared sports</span>
                  </div>
                )}
                {connection.last_activity && (
                  <div className="flex items-center space-x-1">
                    <Calendar className="w-3 h-3" />
                    <span>Active {getTimeAgo(connection.last_activity)}</span>
                  </div>
                )}
                {connection.connected_at && (
                  <div className="flex items-center space-x-1">
                    <Globe className="w-3 h-3" />
                    <span>Connected {formatDate(connection.connected_at)}</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 pt-2">
                {connection.connection_type === 'follower' && (
                  <Button
                    size="sm"
                    onClick={() => handleFollow(connection.id)}
                    className="flex items-center space-x-1"
                  >
                    <UserPlus className="w-3 h-3" />
                    <span>Follow</span>
                  </Button>
                )}
                {connection.connection_type === 'following' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnfollow(connection.id)}
                    className="flex items-center space-x-1"
                  >
                    <UserX className="w-3 h-3" />
                    <span>Unfollow</span>
                  </Button>
                )}
                {connection.connection_type === 'pending' && (
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      onClick={() => handleAcceptRequest(connection.id)}
                      className="flex items-center space-x-1"
                    >
                      <UserCheck className="w-3 h-3" />
                      <span>Accept</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRejectRequest(connection.id)}
                      className="flex items-center space-x-1"
                    >
                      <UserX className="w-3 h-3" />
                      <span>Reject</span>
                    </Button>
                  </div>
                )}
                {(connection.connection_type === 'mutual' ||
                  connection.connection_type === 'following') && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex items-center space-x-1"
                  >
                    <MessageCircle className="w-3 h-3" />
                    <span>Message</span>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center space-x-1"
                >
                  <Share2 className="w-3 h-3" />
                  <span>Share</span>
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        {filteredConnections.length === 0 && (
          <div className="text-center py-12 text-[var(--ash-grey)]">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium mb-2">No connections found</p>
            <p>Try adjusting your search or filters to find more connections</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
