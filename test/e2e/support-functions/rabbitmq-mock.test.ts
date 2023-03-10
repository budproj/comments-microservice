import { listenAndReply, request } from './rabbitmq-mock';

jest.setTimeout(120_000);

it('should reply to imaginary queue', async () => {
  // Arrange
  const expectedResponse = { an: 'object' };
  await listenAndReply('odiajsdoaisjdoasidjaosidj', expectedResponse);

  // Act
  const result = await request<{ an: string }>('odiajsdoaisjdoasidjaosidj', {
    another: 'object',
  });

  // Assert
  expect(result).toEqual(expectedResponse);
});
