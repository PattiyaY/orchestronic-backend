import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalStrategy } from './strategies/local.strategy';
import { UserModule } from '../user/user.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './strategies/jwt.strategy';
import { AuthController } from './auth.controller';
import { AzureTokenService } from './azure-token.service';
import { ShortTokenService } from './short-token.service';
import { UserService } from 'src/user/user.service';
import { DatabaseModule } from 'src/database/database.module';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '1h' },
    }),
    DatabaseModule,
  ],
  controllers: [AuthController],
  providers: [AzureTokenService, ShortTokenService, JwtStrategy],
})
export class AuthModule {}

// @Module({
//   imports: [
//     UserModule,
//     PassportModule,
//     JwtModule.registerAsync({
//       useFactory: (configService: ConfigService) => ({
//         import: [ConfigModule],
//         secret: configService.get<string>('JWT_SECRET') || 'defaultSecret',
//         signOptions: { expiresIn: '60m' },
//       }),
//       inject: [ConfigService],
//     }),
//   ],
//   providers: [AuthService, LocalStrategy, JwtStrategy],
//   exports: [AuthService],
// })
// export class AuthModule {}
