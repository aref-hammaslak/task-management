import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { CurrentUser } from '../types/current-user.type';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  /**
   * This strategy is used to validate the refresh token from the request.
   */
  constructor(private configService: ConfigService) {
    const refreshTokenSecret = configService.get<string>(
      'auth.JWT_REFRESH_SECRET',
    );
    if (!refreshTokenSecret) {
      throw new Error('Refresh token secret is not configured');
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => {
          const refreshToken = request?.cookies?.refreshToken as string;
          if (!refreshToken) {
            return null;
          }
          return refreshToken;
        },
      ]),
      secretOrKey: refreshTokenSecret,
      passReqToCallback: true,
    });
  }

  validate(payload: CurrentUser): CurrentUser {
    return payload;
  }
}
