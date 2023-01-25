import { connect, JSONCodec, NatsConnection, RequestOptions } from 'nats';
import { getNatsConnectionString } from './generate-connection-strings';

let natsConnection: NatsConnection;
const jsonCodec = JSONCodec<any>();

beforeEach(async () => {
  const natsConnectionString = getNatsConnectionString(global.__nats__);
  natsConnection = await connect({ servers: natsConnectionString });
});

afterEach(async () => {
  await natsConnection.drain();
  await natsConnection.close();
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
  const subscription = natsConnection.subscribe(queueName, {
    max: repliesQuantity,
  });

  subscription.callback = (error, msg) => {
    msg.respond(jsonCodec.encode({ data: replyObject }));
  };
};

export const request = async <ResponseType>(
  subject: string,
  data: unknown,
  opts?: RequestOptions,
): Promise<ResponseType> => {
  const response = await natsConnection.request(
    subject,
    jsonCodec.encode(data),
    opts,
  );

  return jsonCodec.decode(response.data);
};

export const getNatsConnection = () => natsConnection;
