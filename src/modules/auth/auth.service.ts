import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { UsersService } from '../users/users.service';
import { User as UserEntity } from '../users/models/user.entity';
import { UpdateUserRefreshTokenDto } from '../users/dto/update-user-refreshtoken.dto';
import { SignupDto } from './dto/signup.dto';
import { Response } from 'express';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private usersService: UsersService,
  ) {}

  async signup(signupDto: SignupDto) {
    const user: UserEntity = await this.usersService.create({
      email: signupDto.email,
      password: await bcrypt.hash(signupDto.password, 10),
      role: signupDto.role,
      fullName: signupDto.fullName,
    });
    const createdUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      fullName: user.fullName,
    };
    const tokens = await this.getTokens(user.id, user.email, user.role);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      accessToken: tokens.accessToken,
      user: createdUser,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findUserByEmail(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }
    const tokens = await this.getTokens(user.id, user.email, user.role);
    await this.updateRefreshToken(user.id, tokens.refreshToken);

    return {
      tokens,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        fullName: user.fullName,
      },
    };
  }

  async refreshTokens(userId: string, refreshToken: string, res: Response) {
    const user = await this.usersService.findOne(userId);
    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Access denied');
    }
    const tokens = await this.getTokens(user.id, user.email, user.role);
    await this.updateRefreshToken(user.id, tokens.refreshToken);
    this.addRefreshTokenToCookie(res, tokens.refreshToken);
    return tokens;
  }

  async logout(userId: string) {
    await this.usersService.update(userId, {
      refreshToken: null,
    } as UpdateUserRefreshTokenDto);
    return true;
  }

  private async getTokens(userId: string, email: string, role: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          id: userId,
          email,
          role,
        },
        {
          secret: this.configService.get('auth.JWT_ACCESS_SECRET'),
          expiresIn: this.configService.get('auth.JWT_ACCESS_EXPIRES_IN'),
        },
      ),
      this.jwtService.signAsync(
        {
          id: userId,
          email,
          role,
          lastLogin: new Date(),
        },
        {
          secret: this.configService.get('auth.JWT_REFRESH_SECRET'),
          expiresIn: this.configService.get('auth.JWT_REFRESH_EXPIRES_IN'),
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  private async updateRefreshToken(userId: string, hashedRefreshToken: string) {
    await this.usersService.update(userId, {
      refreshToken: hashedRefreshToken,
    });
  }

  addRefreshTokenToCookie(res: Response, refreshToken: string) {
    res.setHeader(
      'Set-Cookie',
      `refreshToken=${refreshToken}; HttpOnly; Secure; Max-Age=${this.configService.get('auth.JWT_REFRESH_EXPIRES_IN')}; Path=/api/auth/refresh`,
    );
  }

  removeRefreshTokenFromCookie(res: Response) {
    res.setHeader(
      'Set-Cookie',
      `refreshToken=; HttpOnly; Secure; Max-Age=0; Path=/api/auth/refresh`,
    );
  }
}
