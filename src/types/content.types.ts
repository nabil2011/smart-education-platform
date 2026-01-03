import { ContentType, Difficulty } from '@prisma/client';

// Content DTOs
export interface CreateContentDto {
  title: string;
  description?: string;
  contentType: ContentType;
  subjectId: number;
  gradeLevel: number;
  difficulty?: Difficulty;
  tags?: string[];
  fileUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
}

export interface UpdateContentDto {
  title?: string;
  description?: string;
  contentType?: ContentType;
  subjectId?: number;
  gradeLevel?: number;
  difficulty?: Difficulty;
  tags?: string[];
  fileUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  isPublished?: boolean;
}

export interface ContentFilterDto {
  subjectId?: number;
  gradeLevel?: number;
  contentType?: ContentType;
  difficulty?: Difficulty;
  tags?: string[];
  isPublished?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'createdAt' | 'publishedAt' | 'viewCount' | 'likeCount' | 'title';
  sortOrder?: 'asc' | 'desc';
}

export interface ContentResponseDto {
  id: number;
  uuid: string;
  title: string;
  description?: string;
  contentType: ContentType;
  subjectId: number;
  subjectName: string;
  gradeLevel: number;
  difficulty: Difficulty;
  tags?: string[];
  fileUrl?: string;
  thumbnailUrl?: string;
  duration?: number;
  viewCount: number;
  likeCount: number;
  isPublished: boolean;
  publishedAt?: Date;
  createdBy: number;
  creatorName: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContentStatsDto {
  totalContent: number;
  publishedContent: number;
  draftContent: number;
  totalViews: number;
  totalLikes: number;
  contentByType: Record<ContentType, number>;
  contentByGrade: Record<number, number>;
  contentBySubject: Record<string, number>;
}

// Subject DTOs
export interface CreateSubjectDto {
  name: string;
  nameAr: string;
  description?: string;
  icon?: string;
  color?: string;
  gradeLevels: number[];
}

export interface UpdateSubjectDto {
  name?: string;
  nameAr?: string;
  description?: string;
  icon?: string;
  color?: string;
  gradeLevels?: number[];
  isActive?: boolean;
}

export interface SubjectResponseDto {
  id: number;
  name: string;
  nameAr: string;
  description?: string;
  icon?: string;
  color?: string;
  gradeLevels: number[];
  isActive: boolean;
  createdAt: Date;
  contentCount?: number;
}