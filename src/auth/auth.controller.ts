// auth.controller.ts
import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { AzureTokenService } from './azure-token.service';
import { ShortTokenService } from './short-token.service';
import { DatabaseService } from 'src/database/database.service';

@Controller('Authentication')
export class AuthController {
  constructor(
    private azureTokenService: AzureTokenService,
    private shortTokenService: ShortTokenService,
    private readonly databaseService: DatabaseService,
  ) {}

  @Post('exchange')
  async exchangeToken(@Body('azureToken') azureToken: string) {
    if (!azureToken) throw new BadRequestException('Azure token is required');

    const payload = await this.azureTokenService.verifyAzureToken(azureToken);

    // Extract user info from Azure token payload
    const userId = payload.oid;
    const email = payload.email || payload.upn;

    if (!userId || !email) {
      throw new BadRequestException('Invalid Azure token payload');
    }

    const user = await this.databaseService.user.findUnique({
      where: { email: email },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Create your own short token with minimal info
    const shortToken = this.shortTokenService.createToken({
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    });

    return { token: shortToken };
  }

  // @UseGuards(LocalAuthGuard)
  // @Post('/login')
  // async login(@Request() req) {
  //   const accessToken = this.authService.login(req.user);
  //   return { accessToken };
  // }
}
