import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ForbiddenException,
  Req,
  BadRequestException,
  UseGuards,
  UnauthorizedException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User as UserEntity } from './models/user.entity';
import type { RequestWithUser } from '../auth/types/current-user.type';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  async create(
    @Body() createUserDto: CreateUserDto,
    @Req() req: RequestWithUser,
  ): Promise<{ success: boolean; data: any; message: string }> {
    if (createUserDto.role) {
      if (
        !this.usersService.canUpdateOrDeleteUser(
          req.user.role,
          createUserDto.role,
        )
      ) {
        throw new UnauthorizedException(
          `The user with role ${req.user.role} cannot create a user with role ${createUserDto.role}`,
        );
      }
    }
    const createdUser = await this.usersService.create(createUserDto);
    return {
      success: true,
      data: createdUser,
      message: 'User created successfully',
    };
  }

  @Get()
  async findAll(): Promise<{
    success: boolean;
    data: UserEntity[];
    message: string;
  }> {
    const users = await this.usersService.findAll();
    return {
      success: true,
      data: users,
      message: 'Users retrieved successfully',
    };
  }

  @Get('me')
  async findMe(
    @Req() req: RequestWithUser,
  ): Promise<{ success: boolean; data: UserEntity; message: string }> {
    const user = await this.usersService.findOne(req.user.id);
    return {
      success: true,
      data: user,
      message: 'User profile retrieved successfully',
    };
  }

  @Patch('me')
  async updateMe(
    @Req() req: RequestWithUser,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<{ success: boolean; data: UserEntity; message: string }> {
    if (updateUserDto.role) {
      throw new BadRequestException('Cannot update role through this endpoint');
    }
    const updatedUser = await this.usersService.update(
      req.user.id,
      updateUserDto,
    );
    return {
      success: true,
      data: updatedUser,
      message: 'User profile updated successfully',
    };
  }

  @Get(':id')
  async findOne(
    @Param('id') id: string,
  ): Promise<{ success: boolean; data: UserEntity; message: string }> {
    const user = await this.usersService.findOne(id);
    return {
      success: true,
      data: user,
      message: 'User retrieved successfully',
    };
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: RequestWithUser,
  ): Promise<{ success: boolean; data: UserEntity; message: string }> {
    const user = await this.usersService.findOne(id);

    if (req.user.id === id) {
      throw new BadRequestException(
        'You should use /me endpoint to update current user.',
      );
    }
    if (
      updateUserDto.role &&
      !this.usersService.canUpdateRole(
        req.user.role,
        user.role,
        updateUserDto.role,
      )
    ) {
      throw new ForbiddenException(
        `The user with role ${req.user.role} cannot update the role of the user with role ${user.role}`,
      );
    }
    const updatedUser = await this.usersService.update(id, updateUserDto);
    return {
      success: true,
      data: updatedUser,
      message: 'User updated successfully',
    };
  }

  @Delete(':id')
  async remove(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.usersService.findOne(id);
    if (user.id == req.user.id) {
      throw new ForbiddenException(
        'You cannot delete yourself. Please use /me endpoint to delete your account.',
      );
    }
    if (user.isAdmin) {
      throw new ForbiddenException('Cannot delete admin user');
    }
    if (!this.usersService.canUpdateOrDeleteUser(req.user.role, user.role)) {
      throw new UnauthorizedException("You don't have right permissions");
    }

    await this.usersService.remove(id);
    return {
      success: true,
      message: 'User deleted successfully',
    };
  }
}
