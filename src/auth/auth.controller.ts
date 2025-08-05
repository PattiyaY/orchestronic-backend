import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { AzureTokenService } from './azure-token.service';
import { ShortTokenService } from './short-token.service';
import { UserService } from '../user/user.service';
import { RequestService } from '../request/request.service';
import {
  AuthExchangeDto,
  AuthExchangeResponseDto,
} from './dto/auth-exchange.dto';
import { Public } from './public.decorator';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private azureTokenService: AzureTokenService,
    private shortTokenService: ShortTokenService,
    private userService: UserService,
  ) {}

  @Public()
  @Post('exchange')
  @ApiOperation({
    summary: 'Exchange Azure AD token for backend tokens',
    description:
      'Exchanges a valid Azure AD token for backend access and refresh tokens',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully exchanged tokens',
    type: AuthExchangeResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid Azure token or user not found',
  })
  async exchangeToken(
    @Body() authDto: AuthExchangeDto,
  ): Promise<AuthExchangeResponseDto> {
    if (!authDto) throw new BadRequestException('Azure token is required');

    const payload = await this.azureTokenService.verifyAzureToken(
      authDto.azureToken,
    );

    if (!payload) {
      throw new BadRequestException('Invalid Azure token');
    }

    // Extract user info from Azure token payload
    const userId = payload.oid;
    const email = payload.upn;

    if (!userId || !email) {
      throw new BadRequestException('Invalid Azure token payload');
    }

    const user = await this.userService.findByEmail(email);

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Create your own short token with minimal info
    const shortToken = this.shortTokenService.createTokens({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    return {
      accessToken: shortToken.accessToken,
    };
  }
}
