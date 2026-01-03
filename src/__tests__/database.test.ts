import { db } from '../services/database.service';

describe('Database Connection Test', () => {
  beforeAll(async () => {
    await db.connect();
  });

  afterAll(async () => {
    await db.disconnect();
  });

  test('Should connect to database', async () => {
    const isHealthy = await db.healthCheck();
    expect(isHealthy).toBe(true);
  });

  test('Should have prisma client', () => {
    const client = db.getClient();
    expect(client).toBeDefined();
    expect(client.user).toBeDefined();
  });

  test('Should be able to query users table', async () => {
    const client = db.getClient();
    const userCount = await client.user.count();
    expect(typeof userCount).toBe('number');
  });

  test('Should be able to create and delete a user', async () => {
    const client = db.getClient();
    
    const testUser = await client.user.create({
      data: {
        email: `test-db-${Date.now()}@example.com`,
        passwordHash: 'hashedpassword',
        firstName: 'Test',
        lastName: 'User',
        role: 'teacher',
      },
    });

    expect(testUser).toBeDefined();
    expect(testUser.id).toBeGreaterThan(0);
    expect(testUser.email).toContain('test-db-');

    // Clean up
    await client.user.delete({
      where: { id: testUser.id },
    });
  });
});