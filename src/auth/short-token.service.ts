import { Injectable } from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class ShortTokenService {
  constructor(
    private jwtService: JwtService,
    private databaseService: DatabaseService,
  ) {}

  createTokens(user: {
    id: string;
    email: string;
    role: string;
    name: string;
  }): { accessToken: string } {
    const accessTokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    };

    // const refreshTokenPayload = {
    //   id: user.id,
    // };

    const accessToken = this.jwtService.sign(accessTokenPayload, {
      secret: process.env.JWT_SECRET,
    });

    // const refreshToken = this.jwtService.sign(refreshTokenPayload, {
    //   secret: process.env.JWT_REFRESH_SECRET,
    //   expiresIn: '30d',
    // });

    // // Save to DB with matching expiration
    // const expiry = new Date();
    // expiry.setDate(expiry.getDate() + 30); // 30 days from now

    // await this.databaseService.refreshToken.create({
    //   data: {
    //     userId: user.id,
    //     token: refreshToken,
    //     expiresAt: expiry,
    //   },
    // });

    return { accessToken };
  }
}
