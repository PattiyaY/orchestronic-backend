import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { BackendJwtPayload } from 'src/lib/types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    console.log('🚀 JWT Strategy constructor called - strategy initialized');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'eSo3PoOYP7BhJFaqfnsKz52mo3cpV1vb3M38IGzaFt4=',
    });
    console.log('✅ JWT Strategy configuration complete');
  }

  validate(payload: BackendJwtPayload) {
    return {
      email: payload.email,
      name: payload.name,
      id: payload.id,
      role: payload.role,
    };
  }
}
