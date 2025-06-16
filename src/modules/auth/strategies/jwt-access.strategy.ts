import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { CurrentUser } from '../types/current-user.type';

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(
  Strategy,
  'jwt-access',
) {
  constructor(configService: ConfigService) {
    const accessTokenSecret = configService.get<string>(
      'auth.JWT_ACCESS_SECRET',
    );
    if (!accessTokenSecret) {
      throw new Error('Access token secret is not configured');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: accessTokenSecret,
    });
  }

  validate(payload: CurrentUser) {
    return {
      id: payload.id,
      email: payload.email,
      role: payload.role,
    };
  }
}
