import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class MessagingService {
  constructor(@Inject('NATS_SERVICE') private nats: ClientProxy) {}
  sendMessage<T, R>(channel: string, data: T): void {
    this.nats.send(channel, data).subscribe();
  }

  async emit(pattern, data) {
    return this.nats.emit(pattern, data);
  }
}
