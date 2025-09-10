export interface User {
  id: string;
  _id?: string; // MongoDB ID
  email: string;
  name: string;
  age?: number;
  department?: string;
  academicLevel?: string;
  bio?: string;
  contactInfo?: string;
  avatar?: string;
  institution?: string;
  location?: string;
  profile?: {
    title?: string;
    institution?: string;
    department?: string;
    bio?: string;
    location?: {
      city?: string;
      country?: string;
      coordinates?: {
        lat: number;
        lng: number;
      };
    };
  };
  researchInterests?: ResearchInterest[];
  skills?: Skill[];
  education?: Education[];
  publications?: Publication[];
  preferences?: UserPreferences;
  resume?: {
    filename: string;
    originalName: string;
    path: string;
    uploadDate: string;
  };
  profileComplete: boolean;
  lastActive?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ResearchInterest {
  field: string;
  keywords: string[];
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
}

export interface Skill {
  name: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  category: 'programming' | 'analysis' | 'writing' | 'presentation' | 'research' | 'other';
}

export interface Education {
  degree: string;
  field: string;
  institution: string;
  year: number;
  current?: boolean;
}

export interface Publication {
  title: string;
  authors: string[];
  journal: string;
  year: number;
  doi?: string;
  url?: string;
}

export interface UserPreferences {
  collaborationType: ('research' | 'writing' | 'data-analysis' | 'mentoring' | 'networking')[];
  experienceLevel: ('student' | 'postdoc' | 'faculty' | 'industry' | 'any')[];
  locationPreference: 'local' | 'national' | 'international' | 'remote' | 'any';
  maxDistance: number;
}

export interface Recommendation {
  user: User;
  matchScore: number;
  reasons: string[];
}

export interface Match {
  id: string;
  user: User;
  matchScore: number;
  matchedAt: string;
  chatRoomId: string;
}

export interface ChatRoom {
  id: string;
  participant: User;
  lastMessage?: {
    content: string;
    sender: {
      id: string;
      name: string;
    };
    timestamp: string;
  };
  updatedAt: string;
  unreadCount: number;
}

export interface Message {
  id: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };
  content: string;
  messageType: 'text' | 'image' | 'file';
  createdAt: string;
  readBy: {
    user: string;
    readAt: string;
  }[];
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface SwipeAction {
  userId: string;
  action: 'like' | 'pass';
}

export interface SwipeResult {
  message: string;
  isMatch: boolean;
  chatRoomId?: string;
  matchScore?: number;
}

export interface ApiResponse<T = any> {
  message: string;
  data: T;
  error?: string;
}

// 认证相关的API响应类型
export interface AuthResponse {
  user: User;
  token: string;
}

export interface RecommendationsResponse {
  recommendations: Recommendation[];
}

export interface PaginationInfo {
  current: number;
  pages?: number;
  total: number;
  hasMore?: boolean;
}

export interface SearchFilters {
  field?: string;
  keywords?: string;
  institution?: string;
  location?: string;
  page?: number;
  limit?: number;
}

// 表单类型
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface ProfileForm {
  name: string;
  email: string;
  bio: string;
  academicLevel: string;
  institution: string;
  location: string;
  researchInterests: string[];
  skills: string[];
  profile?: {
    title: string;
    institution: string;
    department: string;
    bio: string;
  };
}

// 常量
export const RESEARCH_FIELDS = [
  'computer-science',
  'artificial-intelligence',
  'data-science',
  'biology',
  'chemistry',
  'physics',
  'mathematics',
  'psychology',
  'sociology',
  'economics',
  'engineering',
  'medicine',
  'other'
] as const;

export const SKILL_CATEGORIES = [
  'programming',
  'analysis',
  'writing',
  'presentation',
  'research',
  'other'
] as const;

export const EXPERIENCE_LEVELS = [
  'beginner',
  'intermediate',
  'advanced',
  'expert'
] as const;

export const COLLABORATION_TYPES = [
  'research',
  'writing',
  'data-analysis',
  'mentoring',
  'networking'
] as const;

export const USER_EXPERIENCE_LEVELS = [
  'student',
  'postdoc',
  'faculty',
  'industry',
  'any'
] as const;

export const LOCATION_PREFERENCES = [
  'local',
  'national',
  'international',
  'remote',
  'any'
] as const;