import { Channel, Connection, RPCCLient } from 'rabbitmq-client';
import { getRabbitMQConnectionString } from './generate-connection-strings';

let rabbitmqConnection: Connection;
let rabbitmqChannel: Channel;
let rpcClient: RPCCLient;

beforeEach(async () => {
  const rabbitmqConnectionString = getRabbitMQConnectionString(
    global.__rabbitmq__,
  );

  rabbitmqConnection = new Connection({
    url: rabbitmqConnectionString,
    // wait 1 to 30 seconds between connection retries
    retryLow: 1000,
    retryHigh: 30000,
  });
  rabbitmqChannel = await rabbitmqConnection.acquire();
  rpcClient = rabbitmqConnection.createRPCClient({
    exchanges: [{ exchange: 'bud', type: 'topic', durable: true }],
  });
});

afterEach(async () => {
  await rpcClient.close();
  await rabbitmqChannel.close();
  await rabbitmqConnection.close();
});

/**
 * @param queueName the queue name to listen and to reply
 * @param replyObject an object to be replied
 * @param repliesQuantity
 *    - Number of replies it will send (after that many requests, it will close the subscription),
 *    - by default this is 1.
 */
export const listenAndReply = async (
  queueName: string,
  replyObject: unknown,
  repliesQuantity = 1,
): Promise<void> => {
  let replies = 0;

  const consumer = rabbitmqConnection.createConsumer(
    {
      queue: queueName,
      exchanges: [{ exchange: 'bud', type: 'topic', durable: true }],
      queueBindings: [{ exchange: 'bud', routingKey: queueName }],
    },
    (msg, replyFN) => {
      replyFN(replyObject);
      replies++;

      if (replies >= repliesQuantity) consumer.close();
    },
  );

  return new Promise((resolve) => consumer.on('ready', () => resolve()));
};

/**
 * Request/Reply method, using this you publish a message in a queue and wait for it's response.
 * @param subject the routing key or queue you want to publish
 * @param data the data to be sent to the queue
 * @returns response object
 */
export const request = async <ResponseType>(
  subject: string,
  data: unknown,
): Promise<ResponseType> => {
  const response = await rpcClient.publish(
    { exchange: 'bud', routingKey: subject },
    data,
  );

  if (Buffer.isBuffer(response.body))
    return JSON.parse(response.body.toString());

  return response.body;
};

/**
 * Pub/Sub method, using this you publish a message in a queue and forget about it.
 * @param subject
 * @param data
 * @returns a promise without any response.
 */
export const publish = async (subject: string, data: unknown): Promise<void> =>
  rabbitmqChannel.basicPublish(subject, data);

export const getrabbitmqConnection = () => rabbitmqConnection;
