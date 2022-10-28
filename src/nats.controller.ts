import { Controller, Inject, Logger } from '@nestjs/common';

import {
  ClientProxy,
  MessagePattern,
  Payload,
  Transport,
} from '@nestjs/microservices';
import { Comment } from '@prisma/client';
import { HealthCheckDBService } from './healthcheck.db.service';
import { CommentService } from './services/comments.service';

@Controller()
export class NatsController {
  constructor(
    private healthCheckDB: HealthCheckDBService,
    @Inject('NATS_SERVICE') private client: ClientProxy,
    private comments: CommentService,
  ) {}

  private readonly logger = new Logger(NatsController.name);

  @MessagePattern('health-check', Transport.NATS)
  async onHealthCheck(@Payload() data: { id: string; reply: string }) {
    const response = await this.healthCheckDB.patch(data.id);

    this.client.emit(data.reply, true);
  }

  @MessagePattern('comment-count', Transport.NATS)
  async countComments(@Payload() entity: Comment['entity']) {
    this.logger.log(
      'New routine notification message to the comment count pattern with data:',
      entity,
    );

    const commentCount = await this.comments.countComments({
      where: { entity },
    });

    return commentCount;
  }
}
