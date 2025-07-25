import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Res,
  Get,
  Logger,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { Response } from 'express';
import type { RequestWithUser } from './types/current-user.type';
import { JwtRefreshTokenGuard } from './guards/jwt-refresh-guard';
import { ConfigService } from '@nestjs/config';

@Controller('auth')
export class AuthController {
  private readonly LOGCONTEXT = 'AuthController';
  private readonly logger = new Logger(AuthController.name);
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  @Post('signup')
  async signup(@Body() signupDto: SignupDto, @Res() res: Response) {
    this.logger.log(`Signup attempt for ${signupDto.email}`, this.LOGCONTEXT);
    const { tokens, user } = await this.authService.signup(signupDto);

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: true,
      maxAge: this.configService.get('auth.JWT_REFRESH_EXPIRES_IN') * 1000,
      path: '/api/auth/refresh',
    });

    res.json({
      success: true,
      message: 'User created successfully',
      data: { accessToken: tokens.accessToken, user },
    });
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res() res: Response) {
    this.logger.log(`Login attempt for ${loginDto.email}`, this.LOGCONTEXT);
    const { tokens, user } = await this.authService.login(loginDto);
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: true,
      maxAge: this.configService.get('auth.JWT_REFRESH_EXPIRES_IN') * 1000,
      path: '/api/auth/refresh',
    });

    res.json({
      success: true,
      message: 'User logged in successfully',
      data: {
        accessToken: tokens.accessToken,
        user,
      },
    });
  }

  @UseGuards(JwtRefreshTokenGuard)
  @Get('refresh')
  async refreshTokens(@Req() req: RequestWithUser, @Res() res: Response) {
    this.logger.log(
      `Refresh tokens attempt for ${req.user.email}`,
      this.LOGCONTEXT,
    );
    const userId = req.user.id;
    const tokens = await this.authService.refreshTokens(userId);
    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: true,
      maxAge: this.configService.get('auth.JWT_REFRESH_EXPIRES_IN') * 1000,
      path: '/api/auth/refresh',
    });

    res.json({
      success: true,
      message: 'Tokens refreshed successfully',
      data: {
        accessToken: tokens.accessToken,
      },
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('logout')
  async logout(@Req() req: RequestWithUser, @Res() res: Response) {
    this.logger.log(`Logout attempt for ${req.user.email}`, this.LOGCONTEXT);
    const userId = req.user.id;
    await this.authService.logout(userId);
    res.clearCookie('refreshToken');
    res.json({
      success: true,
      message: 'User logged out successfully',
    });
  }
}
