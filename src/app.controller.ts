import {
  BadRequestException,
  Controller,
  ForbiddenException,
  Get,
  Param,
  Query,
} from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('test')
  getTest(): string {
    return 'test';
  }

  @Get('/hello/:name')
  getHelloName(@Param('name') name: string, @Query('age') age: number): string {
    if (!age) {
      throw new BadRequestException('Age is required');
    }
    if (age < 18) {
      throw new ForbiddenException('You are not old enough');
    }
    return `Hello ${name} and you are ${age} years old`;
  }
}
