import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Test')
@ApiBearerAuth('access-token')
@Controller()
export class AppController {
  @UseGuards(AuthGuard('jwt'))
  @Get('protected')
  getProtected(@Req() req: Request) {
    return {
      message: '🔒 You have accessed a protected route',
      user: req.user,
    };
  }
}
