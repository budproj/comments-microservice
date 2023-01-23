import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { getPostgresConnectionString } from './support-functions/generate-connection-strings';
import { request } from './support-functions/nats-mock';

describe('NATS Health Check', () => {
  jest.setTimeout(120_000);

  let dbConnection: PrismaClient;

  beforeEach(async () => {
    const postgresConStr = getPostgresConnectionString(global.__postgres__);

    dbConnection = new PrismaClient({
      datasources: { db: { url: postgresConStr } },
    });

    await dbConnection.$connect();
  });

  afterEach(async () => {
    await dbConnection.$disconnect();
  });

  it('should receive true as response on health check queue', async () => {
    // Arrange
    const uuid = randomUUID();
    const replyQueue = `reply-${uuid}`;

    //Act
    await request(
      'health-check',
      { id: uuid, reply: replyQueue },
      {
        timeout: 10_000,
        noMux: true,
        reply: replyQueue,
      },
    );
    const result = await dbConnection.healthCheck.findMany();

    //Assert
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(uuid);
  });
});
