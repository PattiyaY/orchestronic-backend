import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';
import * as jwt from 'jsonwebtoken';
import { AzureADJwtPayload } from 'src/lib/types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private pemKey: string | null = null;

  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKeyProvider: (request, rawJwtToken, done) => {
        if (this.pemKey) {
          done(null, this.pemKey);
        } else {
          const kid = this.authService.extractKidFromToken(
            rawJwtToken as string,
          );
          this.authService
            .getAzurePemKey(kid)
            .then((key: string) => {
              try {
                jwt.verify(rawJwtToken as string, key, {
                  algorithms: ['RS256'],
                });
              } catch (error) {
                console.error('JWT Strategy: Error verifying token:', error);
                return done(error, undefined);
              }
              this.pemKey = key;
              done(null, key);
            })
            .catch((error) => {
              console.error('JWT Strategy: Error retrieving PEM key:', error);
              done(error, undefined);
            });
        }
      },
      algorithms: ['RS256'],
    });
  }

  validate(payload: AzureADJwtPayload) {
    return {
      email: payload.upn,
      name: payload.name,
    };
  }
}
