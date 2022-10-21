import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import configuration from './config/configuration';
import { CommentsController } from './controllers/comments/comments.controller';
import { HealthCheckDBService } from './healthcheck.db.service';
import { HealthCheckRestController } from './healthcheck.rest.controller';
import { PrismaService } from './infrastructure/orm/prisma.service';
import { AppLoggerMiddleware } from './middlewares/route-logger.middleware';
import { UserValidatorMiddleware } from './middlewares/user-validator.middleware';
import { NatsController } from './nats.controller';
import { CommentService } from './services/comments.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
    }),
    ClientsModule.registerAsync([
      {
        name: 'NATS_SERVICE',
        imports: [ConfigModule],
        inject: [ConfigService],
        useFactory: async (configService: ConfigService) => ({
          transport: Transport.NATS,
          options: {
            servers: [configService.get<string>('natsConnectionString')],
          },
        }),
      },
    ]),
  ],
  controllers: [NatsController, HealthCheckRestController, CommentsController],
  providers: [HealthCheckDBService, PrismaService, CommentService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AppLoggerMiddleware).forRoutes('*');
    consumer.apply(UserValidatorMiddleware).forRoutes(CommentsController);
  }
}
