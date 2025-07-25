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
  Query,
  Res,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User as UserEntity } from './models/user.entity';
import type { RequestWithUser } from '../auth/types/current-user.type';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UserByIdPipe } from '../../pipes/user-by-id.pipe';
import { UsersFilterDto } from './dto/users-filter.dto';
import { PaginationFilterDto } from './dto/pagination-filter.dto';
import * as Papa from 'papaparse';
import type { Response } from 'express';
import { USER_EXPOSED_FIELDS } from './constants/user-exposed-fields.constant';

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
  async findAll(
    @Query() filters: UsersFilterDto,
    @Query() pagination: PaginationFilterDto,
  ): Promise<{
    success: boolean;
    data: { users: UserEntity[]; total: number };
    message: string;
  }> {
    const { users, total } = await this.usersService.findAll(
      filters,
      pagination,
    );
    if (!users.length) {
      throw new NotFoundException('No users found with the given filters');
    }
    return {
      success: true,
      data: { users, total },
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

  @Get('export')
  async export(
    @Query() filters: UsersFilterDto,
    @Query() pagination: PaginationFilterDto,
    @Res() res: Response,
    @Query('search') search?: string,
  ) {
    const { users } = await this.usersService.findAll(
      filters,
      pagination,
      search,
    );
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    if (!users.length) {
      throw new NotFoundException('No users found with the given filters');
    }
    const csvString = Papa.unparse(users, {
      header: true,
      columns: USER_EXPOSED_FIELDS,
    });
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=users.csv');
    res.send(csvString);
  }

  @Get(':id')
  findOne(@Param('id', UserByIdPipe) user: UserEntity) {
    return {
      success: true,
      data: user,
      message: 'User retrieved successfully',
    };
  }

  @Patch(':id')
  async update(
    @Param('id', UserByIdPipe) user: UserEntity,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: RequestWithUser,
  ): Promise<{ success: boolean; data: UserEntity; message: string }> {
    if (req.user.id === user.id) {
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
    const updatedUser = await this.usersService.update(user.id, updateUserDto);
    return {
      success: true,
      data: updatedUser,
      message: 'User updated successfully',
    };
  }

  @Delete(':id')
  async remove(
    @Req() req: RequestWithUser,
    @Param('id', UserByIdPipe) user: UserEntity,
  ) {
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

    await this.usersService.remove(user.id);
    return {
      success: true,
      message: 'User deleted successfully',
    };
  }
}
