import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { UsersService } from '../users/users.service';
import { User as UserEntity } from '../users/models/user.entity';
import { UpdateUserRefreshTokenDto } from '../users/dto/update-user-refreshtoken.dto';
import { SignupDto } from './dto/signup.dto';
import { JwtTokens } from './types/jwt-tokens.type';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private usersService: UsersService,
  ) {}

  async signup(signupDto: SignupDto) {
    this.logger.log(`Signing up user ${signupDto.email}`, 'AuthService');
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
    const tokens = await this.generateRefreshAndAccessToken(
      user.id,
      user.email,
      user.role,
    );
    await this.updateRefreshTokenInDb(user.id, tokens.refreshToken);

    return {
      tokens,
      user: createdUser,
    };
  }

  async login(loginDto: LoginDto) {
    this.logger.log(`Logging in user ${loginDto.email}`, 'AuthService');
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
    const tokens = await this.generateRefreshAndAccessToken(
      user.id,
      user.email,
      user.role,
    );
    await this.updateRefreshTokenInDb(user.id, tokens.refreshToken);

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

  async refreshTokens(userId: string): Promise<JwtTokens> {
    this.logger.log(`Refreshing tokens for user ${userId}`, 'AuthService');
    const user = await this.usersService.findOne(userId);
    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Access denied');
    }
    const tokens = await this.generateRefreshAndAccessToken(
      user.id,
      user.email,
      user.role,
    );
    await this.updateRefreshTokenInDb(user.id, tokens.refreshToken);
    return tokens;
  }

  async logout(userId: string) {
    this.logger.log(`Logging out user ${userId}`, 'AuthService');
    await this.usersService.update(userId, {
      refreshToken: null,
    } as UpdateUserRefreshTokenDto);
    return true;
  }

  private async generateRefreshAndAccessToken(
    userId: string,
    email: string,
    role: string,
  ) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          id: userId,
          email,
          role,
        },
        {
          secret: this.configService.get('auth.JWT_ACCESS_SECRET'),
          expiresIn: parseInt(
            this.configService.get('auth.JWT_ACCESS_EXPIRES_IN') as string,
            10,
          ),
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
          expiresIn: parseInt(
            this.configService.get('auth.JWT_REFRESH_EXPIRES_IN') as string,
            10,
          ),
        },
      ),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }

  private async updateRefreshTokenInDb(userId: string, refreshToken: string) {
    await this.usersService.update(userId, {
      refreshToken,
    });
  }
}
