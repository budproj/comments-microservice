import {
  getPostgresConnectionString,
  getRestConnectionString,
} from './support-functions/generate-connection-strings';
import { generateValidJwt } from './support-functions/generateJwt';
import * as httpRequest from 'supertest';
import { PrismaClient } from '@prisma/client';
import { User } from 'src/types/User';
import { listenAndReply } from './support-functions/rabbitmq-mock';
import { randomUUID } from 'crypto';

describe('REST Comments Controller', () => {
  jest.setTimeout(120_000);
  let url: string;
  let validJwtToken: string;
  let dbConnection: PrismaClient;

  const corePortsPrefix = 'business.core-ports';

  const userMock: User = {
    id: '922ef72a-6c3c-4075-926a-3245cdeea75f',
    companies: [{ id: '6164ec96-cd6f-4abc-ad25-9cca88cbb07c' }],
    teams: [{ id: '968e8d90-c1dd-4d5c-948a-067e070ea269' }],
  };

  beforeAll(async () => {
    url = getRestConnectionString(global.__api__);
    validJwtToken = await generateValidJwt({ sub: '1234' });
  });

  beforeEach(async () => {
    const postgresConStr = getPostgresConnectionString(global.__postgres__);

    dbConnection = new PrismaClient({
      datasources: { db: { url: postgresConStr } },
    });

    await dbConnection.$connect();
  });

  afterEach(async () => {
    await dbConnection.comment.deleteMany({});
    await dbConnection.$disconnect();
  });

  it('/comments (POST)', async () => {
    // Arrange
    const corePortsPrefix = 'business.core-ports';
    listenAndReply(`${corePortsPrefix}.verify-token`, { sub: '1234' });
    listenAndReply(`${corePortsPrefix}.get-user-with-teams-by-sub`, userMock);
    listenAndReply(`${corePortsPrefix}.get-user-companies`, userMock.companies);

    const entity = `objective:${randomUUID()}`;
    const commentContent = 'Comentário do bom';

    // Act
    const result = await httpRequest(url)
      .post(`/comments/${entity}`)
      .set('Authorization', `Bearer ${validJwtToken}`)
      .send({ content: commentContent });
    const dbData = await dbConnection.comment.findMany();

    // Assert
    expect(result.statusCode).toBe(201);
    expect(dbData).toHaveLength(1);
    expect(dbData[0]).toHaveProperty('entity', entity);
    expect(dbData[0]).toHaveProperty('content', commentContent);
  });

  it('/comments (GET)', async () => {
    // Arrange
    listenAndReply(`${corePortsPrefix}.verify-token`, { sub: '1234' });
    listenAndReply(`${corePortsPrefix}.get-user-with-teams-by-sub`, userMock);
    listenAndReply(`${corePortsPrefix}.get-user-companies`, userMock.companies);

    const entity = `objective:${randomUUID()}`;
    const comment = {
      id: randomUUID(),
      entity,
      userId: randomUUID(),
      content: 'just a normal comment',
      createdAt: new Date().toISOString(),
    };

    // Act
    await dbConnection.comment.create({ data: comment });
    const result = await httpRequest(url)
      .get(`/comments/${entity}`)
      .set('Authorization', `Bearer ${validJwtToken}`);

    // Assert
    expect(result.statusCode).toBe(200);
    expect(result.body).toEqual([comment]);
  });
});
