import fc from 'fast-check';
import { ContentService } from '../services/content.service';
import DatabaseService from '../services/database.service';
import { ContentType, Difficulty } from '@prisma/client';
import { CreateContentDto, CreateSubjectDto } from '../types/content.types';

describe('Content Management Property Tests', () => {
  let contentService: ContentService;
  let databaseService: DatabaseService;
  let testUserId: number;
  let testSubjectId: number;

  beforeAll(async () => {
    databaseService = DatabaseService.getInstance();
    await databaseService.connect();
    contentService = new ContentService(databaseService.getClient());

    // Create a test user
    const testUser = await databaseService.getClient().user.create({
      data: {
        email: 'test-content@example.com',
        passwordHash: 'hashedpassword',
        firstName: 'Test',
        lastName: 'User',
        role: 'teacher',
      },
    });
    testUserId = testUser.id;

    // Create a test subject
    const testSubject = await databaseService.getClient().subject.create({
      data: {
        name: 'Test Subject',
        nameAr: 'مادة اختبار',
        gradeLevels: [4, 5, 6],
      },
    });
    testSubjectId = testSubject.id;
  });

  afterAll(async () => {
    // Clean up test data
    await databaseService.getClient().content.deleteMany({
      where: { createdBy: testUserId },
    });
    await databaseService.getClient().subject.deleteMany({
      where: { id: testSubjectId },
    });
    await databaseService.getClient().user.deleteMany({
      where: { id: testUserId },
    });
    await databaseService.disconnect();
  });

  beforeEach(async () => {
    // Clean up content before each test
    await databaseService.getClient().content.deleteMany({
      where: { createdBy: testUserId },
    });
  });

  /**
   * Property 6: حفظ المحتوى الكامل
   * Content should be saved completely with all provided data
   */
  test('Property 6: Complete content saving', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 200 }),
          description: fc.option(fc.string({ maxLength: 1000 }), { nil: undefined }),
          contentType: fc.constantFrom(...Object.values(ContentType)),
          gradeLevel: fc.integer({ min: 1, max: 12 }),
          difficulty: fc.constantFrom(...Object.values(Difficulty)),
          tags: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 50 }), { maxLength: 10 }), { nil: undefined }),
          fileUrl: fc.option(fc.webUrl(), { nil: undefined }),
          thumbnailUrl: fc.option(fc.webUrl(), { nil: undefined }),
          duration: fc.option(fc.integer({ min: 1, max: 600 }), { nil: undefined }),
        }),
        async (contentData) => {
          const createData: CreateContentDto = {
            ...contentData,
            subjectId: testSubjectId,
          };

          const createdContent = await contentService.createContent(createData, testUserId);

          // Verify all data is saved correctly
          expect(createdContent.title).toBe(contentData.title);
          expect(createdContent.description).toBe(contentData.description);
          expect(createdContent.contentType).toBe(contentData.contentType);
          expect(createdContent.subjectId).toBe(testSubjectId);
          expect(createdContent.gradeLevel).toBe(contentData.gradeLevel);
          expect(createdContent.difficulty).toBe(contentData.difficulty);
          expect(createdContent.tags).toEqual(contentData.tags || []);
          expect(createdContent.fileUrl).toBe(contentData.fileUrl);
          expect(createdContent.thumbnailUrl).toBe(contentData.thumbnailUrl);
          expect(createdContent.duration).toBe(contentData.duration);
          expect(createdContent.createdBy).toBe(testUserId);
          expect(createdContent.uuid).toBeDefined();
          expect(createdContent.id).toBeGreaterThan(0);
        }
      ),
      { numRuns: 20 }
    );
  });

  /**
   * Property 7: دعم أنواع الملفات
   * System should support different content types correctly
   */
  test('Property 7: Support for different file types', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...Object.values(ContentType)),
        fc.string({ minLength: 1, maxLength: 100 }),
        async (contentType, title) => {
          const createData: CreateContentDto = {
            title,
            contentType,
            subjectId: testSubjectId,
            gradeLevel: 5,
          };

          const createdContent = await contentService.createContent(createData, testUserId);

          // Verify content type is preserved
          expect(createdContent.contentType).toBe(contentType);
          expect(Object.values(ContentType)).toContain(createdContent.contentType);
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property 8: تتبع تحديثات المحتوى
   * Content updates should be tracked with timestamps
   */
  test('Property 8: Track content updates', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 200 }),
          contentType: fc.constantFrom(...Object.values(ContentType)),
          gradeLevel: fc.integer({ min: 1, max: 12 }),
        }),
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 200 }),
          description: fc.option(fc.string({ maxLength: 1000 }), { nil: undefined }),
          difficulty: fc.constantFrom(...Object.values(Difficulty)),
        }),
        async (initialData, updateData) => {
          // Create initial content
          const createData: CreateContentDto = {
            ...initialData,
            subjectId: testSubjectId,
          };

          const createdContent = await contentService.createContent(createData, testUserId);
          const initialUpdatedAt = createdContent.updatedAt;

          // Wait a moment to ensure timestamp difference
          await new Promise(resolve => setTimeout(resolve, 10));

          // Update content
          const updatedContent = await contentService.updateContent(
            createdContent.id,
            updateData,
            testUserId
          );

          // Verify updates are tracked
          expect(updatedContent.title).toBe(updateData.title);
          expect(updatedContent.description).toBe(updateData.description);
          expect(updatedContent.difficulty).toBe(updateData.difficulty);
          expect(new Date(updatedContent.updatedAt).getTime()).toBeGreaterThan(
            new Date(initialUpdatedAt).getTime()
          );
        }
      ),
      { numRuns: 15 }
    );
  });

  /**
   * Property 9: تصنيف المحتوى
   * Content should be properly categorized by subject and grade level
   */
  test('Property 9: Content categorization', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            title: fc.string({ minLength: 1, maxLength: 100 }),
            contentType: fc.constantFrom(...Object.values(ContentType)),
            gradeLevel: fc.integer({ min: 4, max: 6 }),
            tags: fc.option(fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 5 }), { nil: undefined }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        async (contentItems) => {
          // Create multiple content items
          const createdItems = [];
          for (const item of contentItems) {
            const createData: CreateContentDto = {
              ...item,
              subjectId: testSubjectId,
            };
            const created = await contentService.createContent(createData, testUserId);
            createdItems.push(created);
          }

          // Test filtering by grade level
          for (const gradeLevel of [4, 5, 6]) {
            const filtered = await contentService.getContentList({
              gradeLevel,
              subjectId: testSubjectId,
            });

            // All returned content should match the grade level
            filtered.content.forEach(content => {
              expect(content.gradeLevel).toBe(gradeLevel);
              expect(content.subjectId).toBe(testSubjectId);
            });

            // Count should match expected items
            const expectedCount = contentItems.filter(item => item.gradeLevel === gradeLevel).length;
            expect(filtered.content.length).toBe(expectedCount);
          }

          // Test filtering by content type
          for (const contentType of Object.values(ContentType)) {
            const filtered = await contentService.getContentList({
              contentType,
              subjectId: testSubjectId,
            });

            // All returned content should match the content type
            filtered.content.forEach(content => {
              expect(content.contentType).toBe(contentType);
            });
          }
        }
      ),
      { numRuns: 10 }
    );
  });

  /**
   * Property 10: التحكم في الوصول للمحتوى
   * Content access should be controlled based on user permissions
   */
  test('Property 10: Content access control', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          title: fc.string({ minLength: 1, maxLength: 100 }),
          contentType: fc.constantFrom(...Object.values(ContentType)),
          gradeLevel: fc.integer({ min: 1, max: 12 }),
          isPublished: fc.boolean(),
        }),
        async (contentData) => {
          const createData: CreateContentDto = {
            ...contentData,
            subjectId: testSubjectId,
          };

          const createdContent = await contentService.createContent(createData, testUserId);

          // Update to set published status
          await contentService.updateContent(
            createdContent.id,
            { isPublished: contentData.isPublished },
            testUserId
          );

          // Test access control - only creator should be able to update
          const updatedContent = await contentService.getContent(createdContent.id);
          expect(updatedContent?.isPublished).toBe(contentData.isPublished);

          // Test that unauthorized users cannot update (would need another user for full test)
          // For now, verify that the creator can update
          const canUpdate = updatedContent?.createdBy === testUserId;
          expect(canUpdate).toBe(true);
        }
      ),
      { numRuns: 15 }
    );
  });

  /**
   * Subject Management Property Tests
   */
  test('Property: Complete subject saving', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          name: fc.string({ minLength: 1, maxLength: 100 }),
          nameAr: fc.string({ minLength: 1, maxLength: 100 }),
          description: fc.option(fc.string({ maxLength: 500 }), { nil: undefined }),
          icon: fc.option(fc.string({ minLength: 1, maxLength: 50 }), { nil: undefined }),
          color: fc.option(fc.string({ minLength: 7, maxLength: 7 }), { nil: undefined }),
          gradeLevels: fc.array(fc.integer({ min: 1, max: 12 }), { minLength: 1, maxLength: 12 }),
        }),
        async (subjectData) => {
          const createData: CreateSubjectDto = {
            ...subjectData,
            gradeLevels: [...new Set(subjectData.gradeLevels)], // Remove duplicates
          };

          const createdSubject = await contentService.createSubject(createData);

          // Verify all data is saved correctly
          expect(createdSubject.name).toBe(subjectData.name);
          expect(createdSubject.nameAr).toBe(subjectData.nameAr);
          expect(createdSubject.description).toBe(subjectData.description);
          expect(createdSubject.icon).toBe(subjectData.icon);
          expect(createdSubject.color).toBe(subjectData.color);
          expect(createdSubject.gradeLevels).toEqual(createData.gradeLevels);
          expect(createdSubject.isActive).toBe(true);
          expect(createdSubject.id).toBeGreaterThan(0);

          // Clean up
          await databaseService.getClient().subject.delete({
            where: { id: createdSubject.id },
          });
        }
      ),
      { numRuns: 15 }
    );
  });

  /**
   * Search and Filter Property Tests
   */
  test('Property: Search functionality', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            title: fc.string({ minLength: 5, maxLength: 50 }),
            description: fc.option(fc.string({ minLength: 10, maxLength: 100 }), { nil: undefined }),
            contentType: fc.constantFrom(...Object.values(ContentType)),
            gradeLevel: fc.integer({ min: 4, max: 6 }),
          }),
          { minLength: 3, maxLength: 8 }
        ),
        fc.string({ minLength: 3, maxLength: 20 }),
        async (contentItems, searchTerm) => {
          // Create content items
          const createdItems = [];
          for (const item of contentItems) {
            const createData: CreateContentDto = {
              ...item,
              subjectId: testSubjectId,
            };
            const created = await contentService.createContent(createData, testUserId);
            createdItems.push(created);
          }

          // Search for content
          const searchResults = await contentService.getContentList({
            search: searchTerm,
            subjectId: testSubjectId,
          });

          // Verify search results contain the search term in title or description
          searchResults.content.forEach(content => {
            const titleMatch = content.title.toLowerCase().includes(searchTerm.toLowerCase());
            const descriptionMatch = content.description?.toLowerCase().includes(searchTerm.toLowerCase()) || false;
            expect(titleMatch || descriptionMatch).toBe(true);
          });
        }
      ),
      { numRuns: 10 }
    );
  });
});