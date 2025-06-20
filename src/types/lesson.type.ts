export interface ILessonResponse {
  success: boolean;
  message: string;
  topics: ITopicWithLessons[];
  pagination: IPagination;
}

export interface ITopicWithLessons {
  topic: ITopicDetail;
  lessons: ILesson[];
}

export interface IPagination {
  currentPage: number;
  pageSize: number;
  totalTopics: number;
  totalPages: number;
}

export interface ILesson {
  _id: string;
  title: string;
  type: string;
  topic: ITopicDetail;
  level: ILevel | null;
  skills: ISkill[];
  maxScore: number;
  timeLimit: number;
  questions: IQuestion[];
  createdAt: string;
  status: "COMPLETE" | "LOCKED";
}

export interface ITopicDetail {
  _id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  __v: number;
}

export interface ILevel {
  _id: string;
  name: string;
  maxScore: number;
  timeLimit: number;
  minUserLevel: number;
  minLessonPassed: number;
  minScoreRequired: number;
  order: number;
  isActive: boolean;
  createdAt: string;
  __v: number;
}

export interface ISkill {
  _id: string;
  name: string;
  description: string;
  supportedTypes: string[];
  isActive: boolean;
  createdAt: string;
  __v: number;
}

export interface IQuestion {
  _id: string;
  lessonId: string;
  content: string;
  type: "multiple_choice" | "text_input" | "audio_input";
  skill: string | ISkill;
  options: string[];
  correctAnswer?: string;
  score: number;
  audioContent?: string;
  timeLimit?: number;
  createdAt: string;
  __v: number;
}

// Interface cho dữ liệu gửi lên server
export interface QuestionSubmission {
  questionId: string;
  answer: string;
  isCorrect: boolean;
  isTimeout: boolean;
}

// Interface cho dữ liệu nhận về từ server
export interface QuestionResultWithScore {
  questionId: string;
  answer: string;
  isCorrect: boolean;
  isTimeout: boolean;
  score: number;
  feedback: string | null;
  transcription: string | null;
  _id: string;
}

export interface QuestionResult extends QuestionSubmission {
  score?: number;
  feedback?: string | null;
  transcription?: string | null;
  _id?: string;
}

export interface LessonProgress {
  userId: string;
  lessonId: string;
  score: number;
  status: string;
  isRetried: boolean;
  questionResults: QuestionResultWithScore[];
  _id: string;
  completedAt: string;
  __v: number;
}

export interface UserProgress {
  level: string;
  userLevel: number;
  xp: number;
  lives: number;
  completedBasicVocab: string[];
  preferredSkills: string[];
  nextLevelXp: number;
}

export interface CompleteLessonResponse {
  success: boolean;
  message: string;
  status: string;
  progress: LessonProgress;
  user: UserProgress;
}

// Form related interfaces
export interface QuestionFormData {
  content: string;
  type: "multiple_choice" | "text_input" | "audio_input";
  skill: string;
  options?: string[];
  correctAnswer?: string;
  score: number;
}

export interface LessonFormData {
  title: string;
  topic: string;
  level: string;
  questions: QuestionFormData[];
}

export interface CreateLessonData {
  title: string;
  topic: string;
  level: string;
  questions: {
    skill: string;
    type: "multiple_choice" | "text_input" | "audio_input";
    content: string;
    options?: string[];
    correctAnswer?: string;
    score: number;
  }[];
}

export interface ILearningPathResponse {
  success: boolean;
  message: string;
  learningPath: ILearningPathLesson[];
  pagination: ILearningPathPagination;
}

export interface ILearningPathLesson {
  pathId: string;
  lessonId: string;
  title: string;
  topic: string;
  level: string;
  focusSkills: string[];
  recommendedReason: string;
  accuracyBefore: number;
  order: number;
  completed: boolean;
  createdAt: string;
  status: "COMPLETE" | "LOCKED";
}

export interface ILearningPathPagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
}
