import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { EventPattern } from '@nestjs/microservices';
import { AppService } from './app.service';

// @ApiTags('Test')
// @ApiBearerAuth('access-token')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}
  // @UseGuards(AuthGuard('jwt'))
  @Get('protected')
  getProtected(@Req() req: Request) {
    return {
      message: '🔒 You have accessed a protected route',
      user: req.user,
    };
  }

  // @EventPattern('request')
  // handleRequest(data: any) {
  //   return this.appService.handleRequest(data);
  // }
}
