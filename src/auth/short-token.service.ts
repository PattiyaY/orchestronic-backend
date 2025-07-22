import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class ShortTokenService {
  constructor(
    private jwtService: JwtService,
    private databaseService: DatabaseService,
  ) {}

  async createTokens(user: {
    id: string;
    email: string;
    role: string;
    name: string;
  }): Promise<{ accessToken: string; refreshToken: string }> {
    const accessTokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    const refreshTokenPayload = {
      id: user.id,
    };

    const accessToken = this.jwtService.sign(accessTokenPayload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '1h', // Access token: 1 hour
    });

    const refreshToken = this.jwtService.sign(refreshTokenPayload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '1h', // Match your actual requirement
    });

    // Save to DB with matching expiration
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + 1); // 1 hour from now

    await this.databaseService.refreshToken.create({
      data: {
        userId: user.id,
        token: refreshToken,
        expiresAt: expiry,
      },
    });

    return { accessToken, refreshToken };
  }
}
