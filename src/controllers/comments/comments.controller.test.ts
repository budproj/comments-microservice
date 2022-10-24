import { Test, TestingModule } from '@nestjs/testing';

import { User } from '../../types/User';

import { CommentService } from '../../services/comments.service';
import { CommentsController as CommentsControllerClass } from './comments.controller';
import { randomUUID } from 'crypto';

const userMock: User = {
  id: '922ef72a-6c3c-4075-926a-3245cdeea75f',
  companies: [{ id: '6164ec96-cd6f-4abc-ad25-9cca88cbb07c' }],
  teams: [{ id: '968e8d90-c1dd-4d5c-948a-067e070ea269' }],
};

const mockedEntity = 'objective:8fc2c361-61f0-47e2-a1e1-af9c095cbcc6';

const mockedCommentsService = {
  createComment: jest.fn((comment: Comment) => ({
    ...comment,
  })),

  getCommentsByEntity: jest.fn((entity: string) => ({})),
};

describe('Comments Controller', () => {
  const mockedComment = {
    id: randomUUID(),
    entity: mockedEntity,
    userId: userMock.id,
    content: 'Legal',
    createdAt: new Date('2022, 10, 10'),
  };

  let commentsController: CommentsControllerClass;
  let commentService: CommentService;

  beforeAll(async () => {
    jest.resetAllMocks;
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [],
      controllers: [CommentsControllerClass],
      providers: [CommentService],
    })
      .overrideProvider(CommentService)
      .useValue(mockedCommentsService)
      .compile();

    commentsController = moduleRef.get<CommentsControllerClass>(
      CommentsControllerClass,
    );

    commentService = moduleRef.get<CommentService>(CommentService);
  });

  it('should be defined', () => {
    expect(commentsController).toBeDefined();
  });

  describe('createComment', () => {
    it('should be able create a comment', async () => {
      expect(
        await commentsController.createComment(
          mockedEntity,
          userMock,
          mockedComment,
        ),
      ).toEqual(mockedComment);
    });
  });
});
