import { Module } from '@nestjs/common';
import { UserModule } from '../user/user.module';
import { JwtModule } from '@nestjs/jwt';
import { JwtStrategy } from './strategies/jwt.strategy';
import { DatabaseService } from '../database/database.service';
import { AuthService } from './auth.service';
import { ShortTokenService } from './short-token.service';
import { AuthController } from './auth.controller';
import { AzureTokenService } from './azure-token.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
    }),
    UserModule,
  ],
  providers: [
    AuthService,
    JwtStrategy,
    DatabaseService,
    ShortTokenService,
    AzureTokenService,
  ],
  controllers: [AuthController],
  exports: [JwtStrategy],
})
export class AuthModule {}
