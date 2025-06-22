import { supabase } from './supabase';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export type NotificationType =
  | 'achievement_unlocked'
  | 'new_connection'
  | 'highlight_liked'
  | 'highlight_commented'
  | 'highlight_shared'
  | 'new_follower'
  | 'profile_viewed'
  | 'match_suggestion'
  | 'tournament_invite'
  | 'system_update'
  | 'welcome_message';

export interface NotificationTemplate {
  type: NotificationType;
  title: string;
  message: string;
  icon?: string;
  color?: string;
}

export interface NotificationPreferences {
  user_id: string;
  email_notifications: boolean;
  push_notifications: boolean;
  in_app_notifications: boolean;
  achievement_notifications: boolean;
  connection_notifications: boolean;
  highlight_notifications: boolean;
  system_notifications: boolean;
  quiet_hours_enabled: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
}

// Notification templates
export const NOTIFICATION_TEMPLATES: Record<
  NotificationType,
  NotificationTemplate
> = {
  achievement_unlocked: {
    type: 'achievement_unlocked',
    title: 'Achievement Unlocked! 🏆',
    message: 'You\'ve earned the "{achievement_name}" achievement!',
    icon: '🏆',
    color: 'bg-yellow-500',
  },
  new_connection: {
    type: 'new_connection',
    title: 'New Connection',
    message: '{sender_name} wants to connect with you',
    icon: '🤝',
    color: 'bg-blue-500',
  },
  highlight_liked: {
    type: 'highlight_liked',
    title: 'Highlight Liked',
    message: '{sender_name} liked your highlight "{highlight_title}"',
    icon: '❤️',
    color: 'bg-red-500',
  },
  highlight_commented: {
    type: 'highlight_commented',
    title: 'New Comment',
    message: '{sender_name} commented on your highlight "{highlight_title}"',
    icon: '💬',
    color: 'bg-green-500',
  },
  highlight_shared: {
    type: 'highlight_shared',
    title: 'Highlight Shared',
    message: '{sender_name} shared your highlight "{highlight_title}"',
    icon: '📤',
    color: 'bg-purple-500',
  },
  new_follower: {
    type: 'new_follower',
    title: 'New Follower',
    message: '{sender_name} started following you',
    icon: '👥',
    color: 'bg-indigo-500',
  },
  profile_viewed: {
    type: 'profile_viewed',
    title: 'Profile Viewed',
    message: '{sender_name} viewed your profile',
    icon: '👁️',
    color: 'bg-gray-500',
  },
  match_suggestion: {
    type: 'match_suggestion',
    title: 'Match Suggestion',
    message: 'We found a potential match for you: {match_name}',
    icon: '⚽',
    color: 'bg-orange-500',
  },
  tournament_invite: {
    type: 'tournament_invite',
    title: 'Tournament Invite',
    message: 'You\'ve been invited to join "{tournament_name}"',
    icon: '🏆',
    color: 'bg-yellow-500',
  },
  system_update: {
    type: 'system_update',
    title: 'System Update',
    message: 'New features are available on PLAYBACK!',
    icon: '🆕',
    color: 'bg-blue-500',
  },
  welcome_message: {
    type: 'welcome_message',
    title: 'Welcome to PLAYBACK! 🎉',
    message:
      'Start building your sports profile and connect with athletes worldwide',
    icon: '🎉',
    color: 'bg-green-500',
  },
};

export class NotificationService {
  // Create a new notification
  async createNotification(
    userId: string,
    type: NotificationType,
    data?: Record<string, any>
  ): Promise<Notification | null> {
    try {
      const template = NOTIFICATION_TEMPLATES[type];
      const title = this.interpolateTemplate(template.title, data);
      const message = this.interpolateTemplate(template.message, data);

      const { data: notification, error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          type,
          title,
          message,
          data,
          is_read: false,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return notification;
    } catch (error) {
      console.error('Error creating notification:', error);
      return null;
    }
  }

  // Get user's notifications
  async getUserNotifications(
    userId: string,
    page: number = 1,
    limit: number = 20,
    unreadOnly: boolean = false
  ): Promise<{
    notifications: Notification[];
    total: number;
    unreadCount: number;
  }> {
    try {
      let queryBuilder = supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (unreadOnly) {
        queryBuilder = queryBuilder.eq('is_read', false);
      }

      const offset = (page - 1) * limit;
      const { data, error, count } = await queryBuilder.range(
        offset,
        offset + limit - 1
      );

      if (error) {
        throw error;
      }

      // Get unread count
      const { count: unreadCount } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      return {
        notifications: data || [],
        total: count || 0,
        unreadCount: unreadCount || 0,
      };
    } catch (error) {
      console.error('Error getting user notifications:', error);
      return {
        notifications: [],
        total: 0,
        unreadCount: 0,
      };
    }
  }

  // Mark notification as read
  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq('id', notificationId);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  // Mark all notifications as read
  async markAllAsRead(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .eq('user_id', userId)
        .eq('is_read', false);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  }

  // Delete notification
  async deleteNotification(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  }

  // Delete all read notifications
  async deleteReadNotifications(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId)
        .eq('is_read', true)
        .select('id');

      if (error) {
        throw error;
      }

      return data?.length || 0;
    } catch (error) {
      console.error('Error deleting read notifications:', error);
      return 0;
    }
  }

  // Get notification preferences
  async getNotificationPreferences(
    userId: string
  ): Promise<NotificationPreferences | null> {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No preferences found, create default ones
          return await this.createDefaultPreferences(userId);
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error getting notification preferences:', error);
      return null;
    }
  }

  // Update notification preferences
  async updateNotificationPreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<boolean> {
    try {
      const { error } = await supabase.from('notification_preferences').upsert({
        user_id: userId,
        ...preferences,
        updated_at: new Date().toISOString(),
      });

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      return false;
    }
  }

  // Create default notification preferences
  private async createDefaultPreferences(
    userId: string
  ): Promise<NotificationPreferences> {
    const defaultPreferences: NotificationPreferences = {
      user_id: userId,
      email_notifications: true,
      push_notifications: true,
      in_app_notifications: true,
      achievement_notifications: true,
      connection_notifications: true,
      highlight_notifications: true,
      system_notifications: true,
      quiet_hours_enabled: false,
      quiet_hours_start: '22:00',
      quiet_hours_end: '08:00',
    };

    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .insert(defaultPreferences)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error creating default preferences:', error);
      return defaultPreferences;
    }
  }

  // Check if notifications should be sent (quiet hours)
  private isInQuietHours(preferences: NotificationPreferences): boolean {
    if (!preferences.quiet_hours_enabled) {
      return false;
    }

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const [startHour, startMinute] = preferences.quiet_hours_start
      .split(':')
      .map(Number);
    const [endHour, endMinute] = preferences.quiet_hours_end
      .split(':')
      .map(Number);

    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;

    if (startTime <= endTime) {
      return currentTime >= startTime && currentTime <= endTime;
    } else {
      // Quiet hours span midnight
      return currentTime >= startTime || currentTime <= endTime;
    }
  }

  // Send notification with preference checking
  async sendNotification(
    userId: string,
    type: NotificationType,
    data?: Record<string, any>
  ): Promise<boolean> {
    try {
      const preferences = await this.getNotificationPreferences(userId);
      if (!preferences) {
        return false;
      }

      // Check if notifications are enabled for this type
      const typeEnabled = this.isNotificationTypeEnabled(type, preferences);
      if (!typeEnabled) {
        return false;
      }

      // Check quiet hours
      if (this.isInQuietHours(preferences)) {
        return false;
      }

      // Create notification
      const notification = await this.createNotification(userId, type, data);
      return !!notification;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }

  // Check if notification type is enabled
  private isNotificationTypeEnabled(
    type: NotificationType,
    preferences: NotificationPreferences
  ): boolean {
    switch (type) {
      case 'achievement_unlocked':
        return preferences.achievement_notifications;
      case 'new_connection':
      case 'new_follower':
        return preferences.connection_notifications;
      case 'highlight_liked':
      case 'highlight_commented':
      case 'highlight_shared':
        return preferences.highlight_notifications;
      case 'system_update':
      case 'welcome_message':
        return preferences.system_notifications;
      default:
        return true;
    }
  }

  // Interpolate template with data
  private interpolateTemplate(
    template: string,
    data?: Record<string, any>
  ): string {
    if (!data) {
      return template;
    }

    return template.replace(/\{(\w+)\}/g, (match, key) => {
      return data[key] || match;
    });
  }

  // Get notification statistics
  async getNotificationStats(userId: string): Promise<{
    total: number;
    unread: number;
    byType: Record<NotificationType, number>;
    recentActivity: { date: string; count: number }[];
  }> {
    try {
      // Get total and unread counts
      const [{ count: total }, { count: unread }] = await Promise.all([
        supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId),
        supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('is_read', false),
      ]);

      // Get counts by type
      const { data: typeData } = await supabase
        .from('notifications')
        .select('type')
        .eq('user_id', userId);

      const byType: Record<NotificationType, number> = {} as Record<
        NotificationType,
        number
      >;
      typeData?.forEach((notification) => {
        const type = notification.type as NotificationType;
        byType[type] = (byType[type] || 0) + 1;
      });

      // Get recent activity (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data: recentData } = await supabase
        .from('notifications')
        .select('created_at')
        .eq('user_id', userId)
        .gte('created_at', sevenDaysAgo.toISOString());

      const activityByDate: Record<string, number> = {};
      recentData?.forEach((notification) => {
        const date = new Date(notification.created_at).toDateString();
        activityByDate[date] = (activityByDate[date] || 0) + 1;
      });

      const recentActivity = Object.entries(activityByDate)
        .map(([date, count]) => ({ date, count }))
        .sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        );

      return {
        total: total || 0,
        unread: unread || 0,
        byType,
        recentActivity,
      };
    } catch (error) {
      console.error('Error getting notification stats:', error);
      return {
        total: 0,
        unread: 0,
        byType: {} as Record<NotificationType, number>,
        recentActivity: [],
      };
    }
  }

  // Subscribe to real-time notifications
  subscribeToNotifications(
    userId: string,
    callback: (notification: Notification) => void
  ) {
    return supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          callback(payload.new as Notification);
        }
      )
      .subscribe();
  }
}

// Factory function to create notification service
export const createNotificationService = () => new NotificationService();

// Utility functions
export const formatNotificationTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60)
  );

  if (diffInMinutes < 1) {
    return 'Just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  } else if (diffInMinutes < 1440) {
    const hours = Math.floor(diffInMinutes / 60);
    return `${hours}h ago`;
  } else {
    const days = Math.floor(diffInMinutes / 1440);
    return `${days}d ago`;
  }
};

export const getNotificationIcon = (type: NotificationType): string => {
  return NOTIFICATION_TEMPLATES[type].icon || '🔔';
};

export const getNotificationColor = (type: NotificationType): string => {
  return NOTIFICATION_TEMPLATES[type].color || 'bg-gray-500';
};
