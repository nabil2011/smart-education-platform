import { NotificationType } from '@prisma/client';

export interface Notification {
  id: number;
  uuid: string;
  userId: number;
  title: string;
  message: string;
  notificationType: NotificationType;
  referenceId?: number | null;
  referenceType?: string | null;
  isRead: boolean;
  sentAt: Date;
  readAt?: Date | null;
}

export interface CreateNotificationDto {
  userId: number;
  title: string;
  message: string;
  notificationType: NotificationType;
  referenceId?: number;
  referenceType?: string;
}

export interface NotificationFilters {
  userId?: number;
  notificationType?: NotificationType;
  isRead?: boolean;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
}

export interface NotificationPreferences {
  userId: number;
  emailNotifications: boolean;
  pushNotifications: boolean;
  assignmentReminders: boolean;
  gradeNotifications: boolean;
  achievementNotifications: boolean;
  systemNotifications: boolean;
}

export interface UpdateNotificationDto {
  isRead?: boolean;
  readAt?: Date;
}

export interface PaginatedNotifications {
  notifications: Notification[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface NotificationChannel {
  type: 'in_app' | 'email' | 'push';
  enabled: boolean;
}

export interface NotificationDeliveryResult {
  success: boolean;
  channel: string;
  error?: string;
}