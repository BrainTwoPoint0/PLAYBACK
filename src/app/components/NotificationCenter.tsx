'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, Trash2, Settings } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { cn } from '../utils/cn';
import {
  Notification,
  NotificationType,
  getNotificationIcon,
  getNotificationColor,
  formatNotificationTime,
} from '../../lib/notificationService';

interface NotificationCenterProps {
  userId: string;
  className?: string;
}

// Mock notifications for demonstration
const mockNotifications: Notification[] = [
  {
    id: '1',
    user_id: 'user1',
    type: 'achievement_unlocked',
    title: 'Achievement Unlocked! 🏆',
    message: 'You\'ve earned the "First Goal" achievement!',
    data: { achievement_name: 'First Goal' },
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    user_id: 'user1',
    type: 'new_connection',
    title: 'New Connection',
    message: 'Alex Johnson wants to connect with you',
    data: { sender_name: 'Alex Johnson' },
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    user_id: 'user1',
    type: 'highlight_liked',
    title: 'Highlight Liked',
    message: 'Sarah Williams liked your highlight "Amazing Goal"',
    data: { sender_name: 'Sarah Williams', highlight_title: 'Amazing Goal' },
    is_read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    updated_at: new Date().toISOString(),
  },
  {
    id: '4',
    user_id: 'user1',
    type: 'system_update',
    title: 'System Update',
    message: 'New features are available on PLAYBACK!',
    data: {},
    is_read: true,
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    updated_at: new Date().toISOString(),
  },
];

export default function NotificationCenter({
  userId,
  className,
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] =
    useState<Notification[]>(mockNotifications);
  const [unreadCount, setUnreadCount] = useState(0);

  // Calculate unread count
  useEffect(() => {
    const unread = notifications.filter((n) => !n.is_read).length;
    setUnreadCount(unread);
  }, [notifications]);

  // Mark notification as read
  const markAsRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
    );
  };

  // Mark all as read
  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  // Delete notification
  const deleteNotification = (notificationId: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  };

  // Delete all read notifications
  const deleteReadNotifications = () => {
    setNotifications((prev) => prev.filter((n) => !n.is_read));
  };

  const unreadNotifications = notifications.filter((n) => !n.is_read);
  const readNotifications = notifications.filter((n) => n.is_read);

  return (
    <div className={cn('relative', className)}>
      {/* Notification Bell */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="relative h-10 w-10 p-0 text-gray-400 hover:text-white"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notification Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-full right-0 mt-2 w-80 bg-gray-900/95 backdrop-blur-sm border border-gray-700 rounded-xl shadow-2xl z-50 max-h-96 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h3 className="text-lg font-semibold text-white">
                Notifications
              </h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={markAllAsRead}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    Mark all read
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                  className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No notifications</p>
                  <p className="text-sm">You&apos;re all caught up!</p>
                </div>
              ) : (
                <div className="p-2 space-y-1">
                  {/* Unread Notifications */}
                  {unreadNotifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkAsRead={markAsRead}
                      onDelete={deleteNotification}
                    />
                  ))}

                  {/* Read Notifications */}
                  {readNotifications.length > 0 && (
                    <>
                      {unreadNotifications.length > 0 && (
                        <div className="px-3 py-2">
                          <div className="h-px bg-gray-700" />
                        </div>
                      )}
                      {readNotifications.map((notification) => (
                        <NotificationItem
                          key={notification.id}
                          notification={notification}
                          onMarkAsRead={markAsRead}
                          onDelete={deleteNotification}
                        />
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            {readNotifications.length > 0 && (
              <div className="p-3 border-t border-gray-700">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={deleteReadNotifications}
                  className="w-full text-xs text-gray-400 hover:text-red-400"
                >
                  <Trash2 className="h-3 w-3 mr-2" />
                  Clear read notifications
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
}

function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
}: NotificationItemProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        'relative p-3 rounded-lg transition-colors cursor-pointer',
        notification.is_read
          ? 'hover:bg-gray-800/30'
          : 'bg-blue-500/10 hover:bg-blue-500/20'
      )}
    >
      {/* Unread indicator */}
      {!notification.is_read && (
        <div className="absolute top-3 left-3 w-2 h-2 bg-blue-500 rounded-full" />
      )}

      <div className="flex items-start gap-3 pl-4">
        {/* Icon */}
        <div
          className={cn(
            'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm',
            getNotificationColor(notification.type)
          )}
        >
          {getNotificationIcon(notification.type)}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-white truncate">
            {notification.title}
          </h4>
          <p className="text-xs text-gray-400 mt-1 line-clamp-2">
            {notification.message}
          </p>
          <p className="text-xs text-gray-500 mt-2">
            {formatNotificationTime(notification.created_at)}
          </p>
        </div>

        {/* Actions */}
        <AnimatePresence>
          {isHovered && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-1"
            >
              {!notification.is_read && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMarkAsRead(notification.id);
                  }}
                  className="h-6 w-6 p-0 text-gray-400 hover:text-green-400"
                >
                  <Check className="h-3 w-3" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(notification.id);
                }}
                className="h-6 w-6 p-0 text-gray-400 hover:text-red-400"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
