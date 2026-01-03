import { PrismaClient, ContentType, Difficulty, Prisma } from '@prisma/client';
import {
  CreateContentDto,
  UpdateContentDto,
  ContentFilterDto,
  ContentResponseDto,
  ContentStatsDto,
  CreateSubjectDto,
  UpdateSubjectDto,
  SubjectResponseDto
} from '../types/content.types';

export class ContentService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // Content Management
  async createContent(data: CreateContentDto, createdBy: number): Promise<ContentResponseDto> {
    const content = await this.prisma.content.create({
      data: {
        ...data,
        tags: data.tags || [],
        createdBy,
      },
      include: {
        subject: true,
        creator: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return this.mapToContentResponse(content);
  }

  async updateContent(id: number, data: UpdateContentDto, userId: number): Promise<ContentResponseDto> {
    // Check if user has permission to update this content
    const existingContent = await this.prisma.content.findUnique({
      where: { id },
      select: { createdBy: true },
    });

    if (!existingContent) {
      throw new Error('Content not found');
    }

    // Only creator or admin can update content
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (existingContent.createdBy !== userId && user?.role !== 'admin') {
      throw new Error('Unauthorized to update this content');
    }

    const updateData: any = { ...data };
    if (data.tags) {
      updateData.tags = data.tags;
    }
    if (data.isPublished && !existingContent) {
      updateData.publishedAt = new Date();
    }

    const content = await this.prisma.content.update({
      where: { id },
      data: updateData,
      include: {
        subject: true,
        creator: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return this.mapToContentResponse(content);
  }

  async deleteContent(id: number, userId: number): Promise<void> {
    // Check if user has permission to delete this content
    const existingContent = await this.prisma.content.findUnique({
      where: { id },
      select: { createdBy: true },
    });

    if (!existingContent) {
      throw new Error('Content not found');
    }

    // Only creator or admin can delete content
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (existingContent.createdBy !== userId && user?.role !== 'admin') {
      throw new Error('Unauthorized to delete this content');
    }

    await this.prisma.content.delete({
      where: { id },
    });
  }

  async getContent(id: number): Promise<ContentResponseDto | null> {
    const content = await this.prisma.content.findUnique({
      where: { id },
      include: {
        subject: true,
        creator: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!content) {
      return null;
    }

    return this.mapToContentResponse(content);
  }

  async getContentByUuid(uuid: string): Promise<ContentResponseDto | null> {
    const content = await this.prisma.content.findUnique({
      where: { uuid },
      include: {
        subject: true,
        creator: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!content) {
      return null;
    }

    return this.mapToContentResponse(content);
  }

  async getContentList(filters: ContentFilterDto): Promise<{
    content: ContentResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      subjectId,
      gradeLevel,
      contentType,
      difficulty,
      tags,
      isPublished,
      search,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    const where: Prisma.ContentWhereInput = {};

    if (subjectId) where.subjectId = subjectId;
    if (gradeLevel) where.gradeLevel = gradeLevel;
    if (contentType) where.contentType = contentType;
    if (difficulty) where.difficulty = difficulty;
    if (isPublished !== undefined) where.isPublished = isPublished;

    if (tags && tags.length > 0) {
      where.tags = {
        array_contains: tags,
      };
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
      ];
    }

    const orderBy: Prisma.ContentOrderByWithRelationInput = {};
    orderBy[sortBy] = sortOrder;

    const [content, total] = await Promise.all([
      this.prisma.content.findMany({
        where,
        include: {
          subject: true,
          creator: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.content.count({ where }),
    ]);

    return {
      content: content.map(this.mapToContentResponse),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async incrementViewCount(id: number): Promise<void> {
    await this.prisma.content.update({
      where: { id },
      data: {
        viewCount: {
          increment: 1,
        },
      },
    });
  }

  async toggleLike(id: number, userId: number): Promise<{ liked: boolean; likeCount: number }> {
    // This is a simplified implementation
    // In a real app, you'd have a separate likes table to track who liked what
    const content = await this.prisma.content.findUnique({
      where: { id },
      select: { likeCount: true },
    });

    if (!content) {
      throw new Error('Content not found');
    }

    // For now, just increment/decrement the like count
    // In production, you'd check if user already liked this content
    const updatedContent = await this.prisma.content.update({
      where: { id },
      data: {
        likeCount: {
          increment: 1,
        },
      },
      select: { likeCount: true },
    });

    return {
      liked: true,
      likeCount: updatedContent.likeCount,
    };
  }

  async getContentStats(): Promise<ContentStatsDto> {
    const [
      totalContent,
      publishedContent,
      contentByType,
      contentByGrade,
      viewStats,
      likeStats,
    ] = await Promise.all([
      this.prisma.content.count(),
      this.prisma.content.count({ where: { isPublished: true } }),
      this.prisma.content.groupBy({
        by: ['contentType'],
        _count: true,
      }),
      this.prisma.content.groupBy({
        by: ['gradeLevel'],
        _count: true,
      }),
      this.prisma.content.aggregate({
        _sum: { viewCount: true },
      }),
      this.prisma.content.aggregate({
        _sum: { likeCount: true },
      }),
    ]);

    const contentByTypeMap: Record<ContentType, number> = {} as any;
    contentByType.forEach((item) => {
      contentByTypeMap[item.contentType] = item._count;
    });

    const contentByGradeMap: Record<number, number> = {};
    contentByGrade.forEach((item) => {
      contentByGradeMap[item.gradeLevel] = item._count;
    });

    const contentBySubjectMap: Record<string, number> = {};
    // Fetch subjects separately and count content for each
    const subjects = await this.prisma.subject.findMany({
      select: { id: true, name: true },
    });
    
    for (const subject of subjects) {
      const count = await this.prisma.content.count({
        where: { subjectId: subject.id },
      });
      contentBySubjectMap[subject.name] = count;
    }

    return {
      totalContent,
      publishedContent,
      draftContent: totalContent - publishedContent,
      totalViews: viewStats._sum.viewCount || 0,
      totalLikes: likeStats._sum.likeCount || 0,
      contentByType: contentByTypeMap,
      contentByGrade: contentByGradeMap,
      contentBySubject: contentBySubjectMap,
    };
  }

  // Subject Management
  async createSubject(data: CreateSubjectDto): Promise<SubjectResponseDto> {
    const subject = await this.prisma.subject.create({
      data: {
        ...data,
        gradeLevels: data.gradeLevels,
      },
    });

    return this.mapToSubjectResponse(subject);
  }

  async updateSubject(id: number, data: UpdateSubjectDto): Promise<SubjectResponseDto> {
    const updateData: any = { ...data };
    if (data.gradeLevels) {
      updateData.gradeLevels = data.gradeLevels;
    }

    const subject = await this.prisma.subject.update({
      where: { id },
      data: updateData,
    });

    return this.mapToSubjectResponse(subject);
  }

  async deleteSubject(id: number): Promise<void> {
    // Check if subject has content
    const contentCount = await this.prisma.content.count({
      where: { subjectId: id },
    });

    if (contentCount > 0) {
      throw new Error('Cannot delete subject with existing content');
    }

    await this.prisma.subject.delete({
      where: { id },
    });
  }

  async getSubject(id: number): Promise<SubjectResponseDto | null> {
    const subject = await this.prisma.subject.findUnique({
      where: { id },
    });

    if (!subject) {
      return null;
    }

    const contentCount = await this.prisma.content.count({
      where: { subjectId: id },
    });

    return {
      ...this.mapToSubjectResponse(subject),
      contentCount,
    };
  }

  async getSubjectList(gradeLevel?: number): Promise<SubjectResponseDto[]> {
    const where: Prisma.SubjectWhereInput = {
      isActive: true,
    };

    if (gradeLevel) {
      where.gradeLevels = {
        array_contains: [gradeLevel],
      };
    }

    const subjects = await this.prisma.subject.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    const subjectsWithCount = await Promise.all(
      subjects.map(async (subject) => {
        const contentCount = await this.prisma.content.count({
          where: { subjectId: subject.id },
        });

        return {
          ...this.mapToSubjectResponse(subject),
          contentCount,
        };
      })
    );

    return subjectsWithCount;
  }

  // Helper methods
  private mapToContentResponse(content: any): ContentResponseDto {
    return {
      id: content.id,
      uuid: content.uuid,
      title: content.title,
      description: content.description,
      contentType: content.contentType,
      subjectId: content.subjectId,
      subjectName: content.subject.name,
      gradeLevel: content.gradeLevel,
      difficulty: content.difficulty,
      tags: Array.isArray(content.tags) ? content.tags : [],
      fileUrl: content.fileUrl,
      thumbnailUrl: content.thumbnailUrl,
      duration: content.duration,
      viewCount: content.viewCount,
      likeCount: content.likeCount,
      isPublished: content.isPublished,
      publishedAt: content.publishedAt,
      createdBy: content.createdBy,
      creatorName: `${content.creator.firstName} ${content.creator.lastName}`,
      createdAt: content.createdAt,
      updatedAt: content.updatedAt,
    };
  }

  private mapToSubjectResponse(subject: any): SubjectResponseDto {
    return {
      id: subject.id,
      name: subject.name,
      nameAr: subject.nameAr,
      description: subject.description,
      icon: subject.icon,
      color: subject.color,
      gradeLevels: Array.isArray(subject.gradeLevels) ? subject.gradeLevels : [],
      isActive: subject.isActive,
      createdAt: subject.createdAt,
    };
  }
}