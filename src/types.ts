// Types for Qolda.kz platform

export enum TaskCategory {
  ELDERLY = 'elderly',
  DELIVERY = 'delivery',
  MOVING = 'moving',
  EDUCATION = 'education',
  TECHNOLOGY = 'technology',
  HEALTHCARE = 'healthcare',
  OTHER = 'other'
}

export const CATEGORY_LABELS: Record<TaskCategory, string> = {
  [TaskCategory.ELDERLY]: 'Қарттарға көмек',
  [TaskCategory.DELIVERY]: 'Жеткізу көмегі',
  [TaskCategory.MOVING]: 'Көшіп-қонуға көмек',
  [TaskCategory.EDUCATION]: 'Білім беру / Оқу-жазу',
  [TaskCategory.TECHNOLOGY]: 'Технологиялық көмек',
  [TaskCategory.HEALTHCARE]: 'Медициналық көмек',
  [TaskCategory.OTHER]: 'Басқа көмек'
};

export enum TaskPriority {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  [TaskPriority.HIGH]: 'Жоғары (Шұғыл)',
  [TaskPriority.MEDIUM]: 'Орташа',
  [TaskPriority.LOW]: 'Төмен'
};

export enum TaskStatus {
  NEW = 'new',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed'
}

export const STATUS_LABELS: Record<TaskStatus, string> = {
  [TaskStatus.NEW]: 'Жаңа',
  [TaskStatus.IN_PROGRESS]: 'Орындалуда',
  [TaskStatus.COMPLETED]: 'Аяқталды'
};

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  city: string;
  phone?: string;
  avatarId?: string;
  rating?: number;
  reviewsCount?: number;
  completedTasksCount?: number;
  acceptedTasksCount?: number;
  isAdmin: boolean;
  isBanned: boolean;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  priority: TaskPriority;
  deadline: string;
  status: TaskStatus;
  city: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar?: string;
  volunteerId?: string | null;
  volunteerName?: string | null;
  volunteerAvatar?: string | null;
  attachmentUrl?: string;
  createdAt: string;
  updatedAt: string;
  ownerId?: string;
  ownerName?: string;
  ownerEmail?: string;
  ownerPhone?: string;
  attachmentName?: string;
  attachmentSize?: number;
  address?: string;
  latitude?: number | null;
  longitude?: number | null;
  locationSource?: 'manual' | 'geolocation' | null;
}

export interface Review {
  id: string;
  taskId: string;
  reviewerId: string;
  reviewerName: string;
  reviewerAvatar?: string;
  targetUserId: string;
  rating: number; // 1-5
  text: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  taskId?: string;
  type: 'task_accepted' | 'task_completed' | 'new_review' | 'system';
  isRead: boolean;
  createdAt: string;
}

export interface Report {
  id: string;
  reporterId: string;
  reporterName: string;
  targetType: 'user' | 'task';
  targetId: string;
  targetLabel: string;
  reason: string;
  status: 'pending' | 'resolved';
  createdAt: string;
}

export const KAZAKHSTAN_CITIES = [
  'Алматы',
  'Астана',
  'Шымкент',
  'Қарағанды',
  'Ақтөбе',
  'Тараз',
  'Павлодар',
  'Өскемен',
  'Семей',
  'Атырау',
  'Ақтау',
  'Орал',
  'Қостанай',
  'Қызылорда',
  'Көкшетау',
  'Басқа'
];

export const PRESET_AVATARS = [
  'avatar_1', // Classic volunteer youth male
  'avatar_2', // Classic volunteer youth female
  'avatar_3', // Professional healthcare/tech assistance
  'avatar_4', // Enthusiastic adult citizen
  'avatar_5', // Elder character male
  'avatar_6', // Elder character female
];

export const AVATAR_STYLING: Record<string, string> = {
  'avatar_1': 'bg-blue-100 text-blue-700',
  'avatar_2': 'bg-rose-100 text-rose-700',
  'avatar_3': 'bg-teal-100 text-teal-700',
  'avatar_4': 'bg-indigo-100 text-indigo-700',
  'avatar_5': 'bg-amber-100 text-amber-700',
  'avatar_6': 'bg-emerald-100 text-emerald-700',
};

// Emoji avatars mapping for instant fully visual profile identities!
export const AVATAR_EMOJIS: Record<string, string> = {
  'avatar_1': '🙋‍♂️',
  'avatar_2': '🙋‍♀️',
  'avatar_3': '🩺',
  'avatar_4': '🤝',
  'avatar_5': '👴',
  'avatar_6': '👵',
};
