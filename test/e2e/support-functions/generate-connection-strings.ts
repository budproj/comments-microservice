export interface Env {
  host: string;
  port: number;
}

export const getPostgresConnectionString = (postgresEnv: Env) =>
  `postgresql://comments:changeme@${postgresEnv.host}:${postgresEnv.port}/comments?schema=public`;

export const getRabbitMQConnectionString = (rabbitMQEnv: Env) =>
  `amqp://guest:guest@${rabbitMQEnv.host}:${rabbitMQEnv.port}`;

export const getRestConnectionString = (apiEnv: Env) =>
  `http://${apiEnv.host}:${apiEnv.port}`;

export const getJwtConnectionString = (jwtEnv: Env) =>
  `http://${jwtEnv.host}:${jwtEnv.port}/`;
