import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import configuration from './config/configuration';
import { CommentsController } from './controllers/comments/comments.controller';
import { HealthCheckDBService } from './healthcheck.db.service';
import { HealthCheckRestController } from './healthcheck.rest.controller';
import { PrismaService } from './infrastructure/orm/prisma.service';
import { AppLoggerMiddleware } from './middlewares/route-logger.middleware';
import { UserValidatorMiddleware } from './middlewares/user-validator.middleware';
import { RabbitMQController } from './rabbitmq.controller';
import { CommentService } from './services/comments.service';
import { MessagingService } from './services/messaging.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    RabbitMQModule.forRootAsync(RabbitMQModule, {
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        exchanges: [{ name: 'bud', type: 'topic' }],
        uri: configService.get<string>('rabbitmqConnectionString'),
        enableControllerDiscovery: true,
      }),
    }),
  ],
  controllers: [
    RabbitMQController,
    HealthCheckRestController,
    CommentsController,
  ],
  providers: [
    HealthCheckDBService,
    PrismaService,
    CommentService,
    MessagingService,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AppLoggerMiddleware).forRoutes('*');
    consumer.apply(UserValidatorMiddleware).forRoutes(CommentsController);
  }
}
