import {
  AmqpConnection,
  defaultNackErrorHandler,
  RabbitRPC,
} from '@golevelup/nestjs-rabbitmq';
import { Controller, Logger } from '@nestjs/common';
import { Payload } from '@nestjs/microservices';
import { Comment } from '@prisma/client';
import { HealthCheckDBService } from './healthcheck.db.service';
import { CommentService } from './services/comments.service';

@Controller()
export class RabbitMQController {
  constructor(
    private healthCheckDB: HealthCheckDBService,
    private readonly client: AmqpConnection,
    private comments: CommentService,
  ) {}

  private readonly logger = new Logger(RabbitMQController.name);

  @RabbitRPC({
    exchange: 'bud',
    queue: 'comments-microservice.health-check',
    routingKey: 'comments-microservice.health-check',
    errorHandler: defaultNackErrorHandler,
    queueOptions: {
      deadLetterExchange: 'dead',
      deadLetterRoutingKey: 'dead',
    },
  })
  async onHealthCheck(@Payload() data: { id: string }) {
    this.logger.log('healthcheck payload', data);
    await this.healthCheckDB.patch(data.id);

    return true;
  }

  @RabbitRPC({
    exchange: 'bud',
    queue: 'comments-microservice.comment-count',
    routingKey: 'comments-microservice.comment-count',
    errorHandler: defaultNackErrorHandler,
    queueOptions: {
      deadLetterExchange: 'dead',
      deadLetterRoutingKey: 'dead',
    },
  })
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
