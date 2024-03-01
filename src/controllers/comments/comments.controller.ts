import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { Comment } from '@prisma/client';
import { CommentService } from '../../services/comments.service';
import { User } from '../../decorators/user.decorator';
import { User as UserType } from '../../types/User';
import { checkIsUuid } from '../../utils/validate-uuid';
import { MessagingService } from 'src/services/messaging.service';

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
      const taskThatReceivedComment = await this.messaging.sendMessage(
        'task-management-microservice.get-task',
        { id: entityId },
      );
      await this.messaging.sendMessage(
        'business.notification-ports.comment-in-task-notification',
        {
          userThatCommented,
          taskThatReceivedComment,
          comment: createdComment,
          userId: userThatCommented.id, // needed for generic notification ports structure
        },
      );
    }

    console.log({ createdComment });

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
