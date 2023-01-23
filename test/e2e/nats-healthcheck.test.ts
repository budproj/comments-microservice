import { randomUUID } from 'node:crypto';
import { request } from './support-functions/nats-mock';

describe('NATS Health Check', () => {
  jest.setTimeout(120_000);

  it('should receive true as response on health check queue', async () => {
    // Arrange
    const uuid = randomUUID();
    const replyQueue = `reply-${uuid}`;

    //Act
    const result = await request<{ data: boolean }>(
      'health-check',
      { id: uuid, reply: replyQueue },
      {
        timeout: 10_000,
        noMux: true,
        reply: replyQueue,
      },
    );

    //Assert
    expect(result.data).toBe(true);
  });
});
