import { join as pathJoin } from 'node:path';
import {
  DockerComposeEnvironment,
  StartedDockerComposeEnvironment,
  Wait,
} from 'testcontainers';

const composeFilePath = pathJoin(process.env.PWD, 'test');
const waitForText = Wait.forLogMessage;

let dockerComposeEnvironment: StartedDockerComposeEnvironment;

export const bootstrapDockerCompose = async () => {
  dockerComposeEnvironment = await new DockerComposeEnvironment(
    composeFilePath,
    'e2e.docker-compose.yml',
  )
    .withWaitStrategy(
      'postgres_1',
      waitForText('database system is ready to accept connections'),
    )
    .withWaitStrategy('rabbitmq_1', waitForText('Server startup complete'))
    .withWaitStrategy(
      'postgres_1',
      waitForText('database system is ready to accept connections'),
    )
    .withWaitStrategy(
      'api_1',
      waitForText('Nest application successfully started'),
    )
    .withWaitStrategy('fake-jwt-server_1', waitForText('-----'))
    .up();

  const [
    jwtProviderContainer,
    rabbitmqContainer,
    postgresContainer,
    apiContainer,
  ] = [
    dockerComposeEnvironment.getContainer('fake-jwt-server'),
    dockerComposeEnvironment.getContainer('rabbitmq'),
    dockerComposeEnvironment.getContainer('postgres'),
    dockerComposeEnvironment.getContainer('api'),
  ];

  global.__rabbitmq__ = {
    host: rabbitmqContainer.getHost(),
    port: rabbitmqContainer.getMappedPort(5672),
  };

  global.__postgres__ = {
    host: postgresContainer.getHost(),
    port: postgresContainer.getMappedPort(5432),
  };

  global.__jwt__ = {
    host: jwtProviderContainer.getHost(),
    port: jwtProviderContainer.getMappedPort(8088),
  };

  global.__api__ = {
    host: apiContainer.getHost(),
    port: apiContainer.getMappedPort(3000),
  };
};

export const tearDownDockerCompose = async () => {
  await dockerComposeEnvironment.down();
  await dockerComposeEnvironment.stop();
};
