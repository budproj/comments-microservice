import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import { getPostgresConnectionString } from './support-functions/generate-connection-strings';
import { publish } from './support-functions/rabbitmq-mock';
import { setTimeout } from 'node:timers/promises';

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
    await publish('comments-microservice.health-check', {
      id: uuid,
      reply: replyQueue,
    });

    await setTimeout(1000); // tech debit: if fleaky, put a listener on the reply queue.

    const result = await dbConnection.healthCheck.findMany();

    //Assert
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(uuid);
  });
});
