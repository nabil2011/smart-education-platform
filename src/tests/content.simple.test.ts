import { ContentService } from '../services/content.service';
import DatabaseService from '../services/database.service';
import { ContentType, Difficulty } from '@prisma/client';

describe('Content Management Simple Tests', () => {
  let contentService: ContentService;
  let databaseService: DatabaseService;

  beforeAll(async () => {
    databaseService = DatabaseService.getInstance();
    await databaseService.connect();
    contentService = new ContentService(databaseService.getClient());
  });

  afterAll(async () => {
    await databaseService.disconnect();
  });

  test('Should create content service', () => {
    expect(contentService).toBeDefined();
  });

  test('Should create a test user', async () => {
    const testUser = await databaseService.getClient().user.create({
      data: {
        email: `test-${Date.now()}@example.com`,
        passwordHash: 'hashedpassword',
        firstName: 'Test',
        lastName: 'User',
        role: 'teacher',
      },
    });

    expect(testUser).toBeDefined();
    expect(testUser.id).toBeGreaterThan(0);

    // Clean up
    await databaseService.getClient().user.delete({
      where: { id: testUser.id },
    });
  });

  test('Should create a subject', async () => {
    const testSubject = await databaseService.getClient().subject.create({
      data: {
        name: `Test Subject ${Date.now()}`,
        nameAr: 'مادة اختبار',
        gradeLevels: [4, 5, 6],
      },
    });

    expect(testSubject).toBeDefined();
    expect(testSubject.id).toBeGreaterThan(0);

    // Clean up
    await databaseService.getClient().subject.delete({
      where: { id: testSubject.id },
    });
  });

  test('Should create content', async () => {
    // Create test user
    const testUser = await databaseService.getClient().user.create({
      data: {
        email: `test-content-${Date.now()}@example.com`,
        passwordHash: 'hashedpassword',
        firstName: 'Test',
        lastName: 'User',
        role: 'teacher',
      },
    });

    // Create test subject
    const testSubject = await databaseService.getClient().subject.create({
      data: {
        name: `Test Subject ${Date.now()}`,
        nameAr: 'مادة اختبار',
        gradeLevels: [4, 5, 6],
      },
    });

    // Create content
    const content = await contentService.createContent({
      title: 'Test Content',
      description: 'Test Description',
      contentType: ContentType.lesson,
      subjectId: testSubject.id,
      gradeLevel: 5,
      difficulty: Difficulty.medium,
    }, testUser.id);

    expect(content).toBeDefined();
    expect(content.title).toBe('Test Content');
    expect(content.contentType).toBe(ContentType.lesson);

    // Clean up
    await databaseService.getClient().content.delete({
      where: { id: content.id },
    });
    await databaseService.getClient().subject.delete({
      where: { id: testSubject.id },
    });
    await databaseService.getClient().user.delete({
      where: { id: testUser.id },
    });
  });
});