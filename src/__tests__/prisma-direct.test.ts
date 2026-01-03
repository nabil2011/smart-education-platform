import { PrismaClient } from '@prisma/client';

describe('Direct Prisma Client Test', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = new PrismaClient();
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('Should connect to database directly', async () => {
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    expect(result).toBeDefined();
  });

  test('Should be able to count users', async () => {
    const userCount = await prisma.user.count();
    expect(typeof userCount).toBe('number');
  });

  test('Should be able to create and delete a user', async () => {
    const testUser = await prisma.user.create({
      data: {
        email: `test-direct-${Date.now()}@example.com`,
        passwordHash: 'hashedpassword',
        firstName: 'Test',
        lastName: 'User',
        role: 'teacher',
      },
    });

    expect(testUser).toBeDefined();
    expect(testUser.id).toBeGreaterThan(0);
    expect(testUser.email).toContain('test-direct-');

    // Clean up
    await prisma.user.delete({
      where: { id: testUser.id },
    });
  });
});