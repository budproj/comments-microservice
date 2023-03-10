import { HealthCheckRestController } from './healthcheck.rest.controller';

beforeEach(jest.resetAllMocks);

describe('HealthCheckRestController', () => {
  const healthCheckRestController = new HealthCheckRestController();

  describe('healthCheck', () => {
    it('should return pong if the data is ping', async () => {
      // Arrrange (Ajeitar)

      // Act (Atuar)
      const result = await healthCheckRestController.pingPong();

      // Assert (Afirmar)
      expect(result).toBe('pong');
    });
  });
});
