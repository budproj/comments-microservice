import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { Comment } from '@prisma/client';
import { CommentService } from '../../services/comments.service';
import { User } from '../../decorators/user.decorator';
import { User as UserType } from '../../types/User';
import { checkIsUuid } from '../../utils/validate-uuid';
import { MessagingService } from 'src/services/messaging.service';
import { randomUUID } from 'crypto';

@Controller('comments')
export class CommentsController {
  constructor(
    private commentService: CommentService,
    private messaging: MessagingService,
  ) {}

  @Post(':entity')
  async createComment(
    @Param('entity') entity: string,
    @User() user: UserType,
    @Body() comment: Comment,
  ): Promise<Comment> {
    const userThatCommented = user;

    const parsedComment = {
      content: comment.content,
      userId: userThatCommented.id,
      entity: entity,
    };

    const createdComment = await this.commentService.createComment(
      parsedComment,
    );

    const [entityDomain, entityId] = entity.split(':');

    if (entityDomain === 'routine') {
      const answeredRoutine = await this.messaging.sendMessage(
        'routines-microservice.get-answer-group-data',
        { id: entityId },
      );

      await this.messaging.sendMessage(
        'business.notification-ports.comment-in-routine-notification',
        {
          userThatCommented,
          answeredRoutine,
          comment: createdComment,
          userId: userThatCommented.id, // needed for generic notification ports structure
        },
      );
    } else if (entityDomain === 'task') {
      this.messaging.emit('task-management-microservice.comment-in-task', {
        content: Buffer.from(
          JSON.stringify({
            id: entityId,
            user: userThatCommented,
            comment: createdComment,
          }),
        ),
        // fields: {},
        // properties: {},
      });
      const notification = {
        messageId: randomUUID(),
        type: 'provingSomething',
        timestamp: new Date().toISOString(),
        recipientId: 'auth0|auth0|6243762bdf154e0068d272d7',
        properties: {
          sender: {
            id: 'auth0|auth0|6243762bdf154e0068d272d7',
            name: 'Igor Omote',
            picture:
              'https://s3-sa-east-1.amazonaws.com/business.s3.getbud.co/user/pictures/335cd9ee-e5df-402c-a268-6c7a96ee7801-1657539472265.jpeg',
          },
          task: {
            id: '65e08a748b491e52ee118057',
            name: 'comment2',
          },
          taskBoard: {
            _id: '65f83ef2275dbdbe1328502f',
            owner: '825112f5-6da7-4d92-a845-79a3ea355fd4',
            title: 'bom dia sua máquina de construir músculo',
            author: {
              type: 'USER',
              identifier: '825112f5-6da7-4d92-a845-79a3ea355fd4',
            },
            status: 'toDo',
            boardId: '65c6585c4ae33e74c9c49a4d',
            dueDate: '1112-11-11T03:06:28.000Z',
            priority: 4,
            description: '<p>bom dia sua máquina de construir músculo</p>',
            initialDate: '1112-11-11T03:06:28.000Z',
            supportTeam: [],
          },
          teamId: '0342b8f6-3a07-4f2b-a3fa-a3a8ca8fa61f',
        },
      };
      this.messaging.postMessage(
        'notifications-microservice.notification',
        notification,
      ) as any;
    }

    return createdComment;
  }

  @Get(':entity')
  async getCommentsByEntity(
    @Param('entity') entity: string,
  ): Promise<Comment[]> {
    const commentsType = ['kr', 'routine', 'objective', 'task'];

    const entityParts = entity.split(':');
    const entityDomain = entityParts[0];
    const domainId = entityParts[1];

    const otherEntityParts = entityParts.filter((_, index) => index > 1);

    const isInitialEntityPart = commentsType.includes(entityDomain);
    const isDomainEntityUuid = checkIsUuid(domainId);

    if (entityParts.length < 2)
      throw new Error(
        'The comment entity must have at least a domain and a domainId.',
      );

    const allEntityIdPartsAreUuid = otherEntityParts.every((entityPart) =>
      checkIsUuid(entityPart),
    );

    console.log({
      entity,
      domainId,
      isDomainEntityUuid,
      isInitialEntityPart,
      allEntityIdPartsAreUuid,
    });

    if (
      !isInitialEntityPart ||
      !isDomainEntityUuid ||
      !allEntityIdPartsAreUuid
    ) {
      throw new Error('Invalid value to entity');
    }

    const comments = await this.commentService.comments({
      where: {
        OR: [{ entity: { startsWith: `${entity}:` } }, { entity }],
      },
    });

    return comments;
  }

  @Delete(':id')
  async deleteCommentById(@Param('id') id: Comment['id']) {
    const deleteResult = await this.commentService.deleteComment({ id: id });
    return deleteResult;
  }
}
