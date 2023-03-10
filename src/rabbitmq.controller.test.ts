import { ClientsModule, Transport } from '@nestjs/microservices';
import { Test } from '@nestjs/testing';
import { HealthCheckDBService } from './healthcheck.db.service';
import { RabbitMQController } from './rabbitmq.controller';
import { CommentService } from './services/comments.service';

describe('RabbitMQ Controller', () => {
  let natsController: RabbitMQController;
  const dbHealthCheckPath = jest.fn();

  beforeEach(jest.resetAllMocks);

  // Module Setup
  beforeEach(async () => {
    const HealthCheckDBServiceMock = { patch: dbHealthCheckPath };
    const CommentServiceMock = {};

    const moduleRef = await Test.createTestingModule({
      imports: [
        ClientsModule.register([
          { name: 'NATS_SERVICE', transport: Transport.NATS },
        ]),
      ],
      controllers: [RabbitMQController],
      providers: [HealthCheckDBService, CommentService],
    })
      .overrideProvider(HealthCheckDBService)
      .useValue(HealthCheckDBServiceMock)
      .overrideProvider(CommentService)
      .useValue(CommentServiceMock)
      .compile();

    natsController = moduleRef.get(RabbitMQController);
  });

  describe('health-check messages', () => {
    it('should emit back to the reply queue', async () => {
      // Arrange
      const data = { id: 'some id', reply: 'testReplyQueue' };

      // Act
      const response = await natsController.onHealthCheck(data);

      // Assert
      expect(response).toBe(true);
    });

    it('should patch the database with an id', async () => {
      // Arrange
      const data = { id: 'some id', reply: 'testReplyQueue' };

      // Act
      await natsController.onHealthCheck(data);

      // Assert
      expect(dbHealthCheckPath).toBeCalledTimes(1);
      expect(dbHealthCheckPath).toBeCalledWith('some id');
    });
  });
});
