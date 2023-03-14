import { randomUUID } from 'node:crypto';
import { request } from './support-functions/rabbitmq-mock';

describe('NATS Health Check', () => {
  jest.setTimeout(120_000);

  it('should receive true as response on health check queue', async () => {
    // Arrange
    const uuid = randomUUID();

    //Act
    const result = await request<boolean>(
      'comments-microservice.health-check',
      { id: uuid },
    );

    //Assert
    expect(result).toBe(true);
  });
});
