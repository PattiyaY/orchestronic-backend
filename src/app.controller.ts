import { Controller, Get, Req } from '@nestjs/common';
import { Request } from 'express';

@Controller()
export class AppController {
  @Get('protected')
  getProtected(@Req() req: Request) {
    return {
      message: '🔒 You have accessed a protected route',
      user: req.user,
    };
  }
}
