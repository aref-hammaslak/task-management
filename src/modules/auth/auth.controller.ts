import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Res,
  Get,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SignupDto } from './dto/signup.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Response } from 'express';
import { RequestWithUser } from './types/current-user.type';
import { JwtRefreshGuard } from './guards/jwt-refresh-guard';

@Controller('auth')
export class AuthController {
  private readonly LOGCONTEXT = 'AuthController';
  constructor(
    private authService: AuthService,
    private logger: Logger,
  ) {}

  @Post('signup')
  async signup(@Body() signupDto: SignupDto) {
    this.logger.log(`Signup attempt for ${signupDto.email}`, this.LOGCONTEXT);
    const tokens = await this.authService.signup(signupDto);
    return {
      message: 'User created successfully',
      data: {
        accessToken: tokens.accessToken,
        user: tokens.user,
      },
    };
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto, @Res() res: Response) {
    this.logger.log(`Login attempt for ${loginDto.email}`, this.LOGCONTEXT);
    const { tokens, user } = await this.authService.login(loginDto);
    this.authService.addRefreshTokenToCookie(res, tokens.refreshToken);
    res.json({
      message: 'User logged in successfully',
      data: {
        accessToken: tokens.accessToken,
        user,
      },
    });
  }

  @UseGuards(JwtRefreshGuard)
  @Get('refresh')
  async refreshTokens(@Req() req: RequestWithUser, @Res() res: Response) {
    this.logger.log(
      `Refresh tokens attempt for ${req.user.email}`,
      this.LOGCONTEXT,
    );
    const userId = req.user.id;
    const refreshToken = req.user.refreshToken;
    const tokens = await this.authService.refreshTokens(
      userId,
      refreshToken as string,
      res,
    );
    this.authService.addRefreshTokenToCookie(res, tokens.refreshToken);
    res.json({
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
    if (!req.user) {
      throw new BadRequestException('User not found');
    }
    const userId = req.user.id;
    await this.authService.logout(userId);
    this.authService.removeRefreshTokenFromCookie(res);
    res.json({
      message: 'User logged out successfully',
    });
  }
}
