import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { UsersService } from 'src/modules/users/users.service';
import { AuthService } from '../auth.service';
import { CurrentUserWithRefreshToken } from '../types/current-user.type';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
    private authService: AuthService,
  ) {
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

  async validate(req: Request): Promise<CurrentUserWithRefreshToken> {
    const refreshToken = req.cookies['refreshToken'] as string;

    const currentUser =
      await this.usersService.findOneByRefreshToken(refreshToken);

    if (!currentUser) {
      throw new UnauthorizedException('Invalid refresh token');
    }
    return {
      id: currentUser.id,
      email: currentUser.email,
      role: currentUser.role,
      refreshToken: currentUser.refreshToken as string,
    } as CurrentUserWithRefreshToken;
  }
}
