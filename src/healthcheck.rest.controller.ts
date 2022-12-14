import { Controller, Get } from '@nestjs/common';

@Controller('/healthcheck')
export class HealthCheckRestController {
  @Get()
  async pingPong(): Promise<string> {
    return 'pong';
  }
}
