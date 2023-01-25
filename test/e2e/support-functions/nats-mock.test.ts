import { listenAndReply, request } from './nats-mock';

jest.setTimeout(120_000);

it('should reply to imaginary queue', async () => {
  // Arrange
  const expectedResponse = { an: 'object' };
  listenAndReply('odiajsdoaisjdoasidjaosidj', expectedResponse);

  // Act
  const result = await request<{ an: string }>('odiajsdoaisjdoasidjaosidj', {
    another: 'object',
  });

  // Assert
  expect(result).toEqual({ data: expectedResponse });
});
