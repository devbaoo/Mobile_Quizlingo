export interface LoginResponse {
  success: boolean;
  message: string;
  accessToken: string;
  refreshToken: string;
  user: User;
  needVerification: boolean;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isVerify: boolean;
  avatar: string;
  streak: number;
  lives: number;
  xp: number;
  userLevel: number;
  level: string;
}

export interface ActivePackage {
  name: string;
  startDate: string;
  endDate: string;
  daysRemaining: number;
  isExpiringSoon: boolean;
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  level: string;
  avatar: string;
  userLevel: number;
  xp: number;
  streak: number;
  lives: number;
  completedBasicVocab: string[];
  preferredSkills: string[];
  preferredTopics: string[];
  activePackage?: ActivePackage;
}
