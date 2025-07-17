import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class ShortTokenService {
  constructor(private jwtService: JwtService) {}

  createToken(payload: {
    id: string;
    email: string;
    role?: string;
    name: string;
  }): string {
    return this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '1h',
    });
  }
}
