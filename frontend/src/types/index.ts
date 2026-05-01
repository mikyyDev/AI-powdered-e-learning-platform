export type UserRole = "student" | "teacher" | "admin";

export interface User {
  id: number;
  email: string;
  username: string;
  full_name: string;
  role: UserRole;
  avatar?: string;
  bio?: string;
  is_active: boolean;
  created_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export type CourseLevel = "beginner" | "intermediate" | "advanced";
export type CourseCategory =
  | "programming" | "design" | "business"
  | "marketing" | "data_science" | "devops" | "mobile" | "other";

export interface Course {
  id: number;
  title: string;
  description: string;
  short_description?: string;
  thumbnail?: string;
  price: number;
  currency: string;
  level: CourseLevel;
  category: CourseCategory;
  estimated_hours: number;
  is_published: boolean;
  is_free: boolean;
  teacher_id: number;
  created_at: string;
  updated_at: string;
}

export interface Lesson {
  id: number;
  course_id: number;
  title: string;
  description?: string;
  content?: string;
  video_url?: string;
  order: number;
  duration_minutes: number;
  is_free_preview: boolean;
  created_at: string;
  materials?: LessonMaterial[];
}

export interface LessonMaterial {
  id: number;
  lesson_id: number;
  title: string;
  file_name: string;
  file_url: string;
  mime_type?: string | null;
  created_at: string;
}

export interface LessonWithProgress extends Lesson {
  is_completed: boolean;
  is_unlocked: boolean;
}

export interface CourseRoadmap extends Course {
  lessons: LessonWithProgress[];
  total_lessons: number;
  completed_lessons: number;
  progress_percent: number;
  is_enrolled: boolean;
}

export interface Enrollment {
  id: number;
  user_id: number;
  course_id: number;
  enrolled_at: string;
}

export interface AIRecommendation {
  id: number;
  user_id: number;
  course_id: number;
  score: number;
  reason?: string;
  created_at: string;
  course?: Course;
}

export type MessageType = "text" | "file" | "image";

export interface ChatRoom {
  id: number;
  name?: string;
  is_direct: boolean;
  created_at: string;
  members: User[];
}

export interface Message {
  id: number;
  room_id: number;
  sender_id: number;
  content?: string;
  message_type: MessageType;
  file_url?: string;
  file_name?: string;
  is_read: boolean;
  created_at: string;
  sender?: User;
}

export type PaymentMethod = "chapa" | "free";
export type PaymentStatus = "pending" | "success" | "failed" | "refunded";

export interface Payment {
  id: number;
  user_id: number;
  course_id: number;
  amount: number;
  currency: string;
  payment_method: PaymentMethod;
  transaction_id?: string;
  status: PaymentStatus;
  created_at: string;
}

export type CallStatus = "pending" | "active" | "ended" | "declined";

export interface Call {
  id: number;
  caller_id: number;
  callee_id: number;
  course_id?: number | null;
  status: CallStatus;
  duration_seconds: number;
  created_at: string;
  started_at?: string | null;
  ended_at?: string | null;
  caller?: User | null;
  callee?: User | null;
}
