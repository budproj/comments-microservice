import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaClient } from '@prisma/client';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { PrismaService } from '../../infrastructure/orm/prisma.service';

import * as request from 'supertest';
import { CommentService } from '../../services/comments.service';
import { CommentsController } from './comments.controller';
import { User } from 'src/types/User';

describe('CommentsController (integration)', () => {
  let app: INestApplication;
  let prisma: DeepMockProxy<PrismaClient>;

  const mockedEntity = 'objective:8fc2c361-61f0-47e2-a1e1-af9c095cbcc6';
  const userMock: User = {
    id: '922ef72a-6c3c-4075-926a-3245cdeea75f',
    companies: [{ id: '6164ec96-cd6f-4abc-ad25-9cca88cbb07c' }],
    teams: [{ id: '968e8d90-c1dd-4d5c-948a-067e070ea269' }],
  };

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [],
      controllers: [CommentsController],
      providers: [CommentService, PrismaService],
    })
      .overrideProvider(PrismaService)
      .useValue(mockDeep<PrismaClient>())
      .compile();

    prisma = moduleFixture.get(PrismaService);
    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/comments (POST)', () => {
    return request(app.getHttpServer())
      .post(`/comments/${mockedEntity}`)
      .set({ user: userMock })
      .send({
        comment: 'Comentário do bom',
      })
      .expect(201);
  });

  it('/comments (GET)', () => {
    return request(app.getHttpServer())
      .get(`/comments/${mockedEntity}`)
      .expect(200);
  });
});
