import {
  // ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  Inject,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { v4 as uuidv4 } from 'uuid';
import { Equal, Not, Repository, Like, FindOptionsWhere } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User as UserEntity } from './models/user.entity';
import { Role } from '../auth/enums/role.enum';
import { UpdateUserRefreshTokenDto } from './dto/update-user-refreshtoken.dto';
import bcrypt from 'bcrypt';
import { PaginationFilterDto } from './dto/pagination-filter.dto';
import { UsersFilterDto } from './dto/users-filter.dto';
import { USER_EXPOSED_FIELDS } from './constants/user-exposed-fields.constant';
import { REQUEST } from '@nestjs/core';
import type { RequestWithUser } from '../auth/types/current-user.type';

@Injectable()
export class UsersService {
  static readonly USER_EXPOSED_FIELDS = Object.fromEntries(
    USER_EXPOSED_FIELDS.map((field) => [field, true]),
  );
  private readonly logger = new Logger(UsersService.name);
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    @Inject(REQUEST)
    private readonly request: RequestWithUser,
  ) {}

  private readonly ROLE_HIERARCHY = {
    [Role.ADMIN]: 3,
    [Role.MANAGER]: 2,
    [Role.CUSTOMER]: 1,
    [Role.WAITER]: 1,
    [Role.COOK]: 1,
    [Role.CASHIER]: 1,
  };

  async create(createUserDto: CreateUserDto): Promise<UserEntity> {
    this.logger.log('info', `Creating user ${createUserDto.email}`);
    const user = this.userRepository.create({
      ...createUserDto,
      id: uuidv4(),
      password: bcrypt.hashSync(createUserDto.password, 10),
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      role: createUserDto.role || Role.CUSTOMER,
      isAdmin: createUserDto.role === Role.ADMIN ? true : false,
      isEmailVerified: false,
    });
    return await this.userRepository.save(user);
  }

  async findAll(
    filter: UsersFilterDto,
    pagination: PaginationFilterDto,
    search?: string,
  ): Promise<{ users: UserEntity[]; total: number }> {
    const { page, limit, sortBy, sortDirection } = pagination;
    const skip = page * limit;
    this.logger.debug(filter, 'filter');
    this.logger.debug(pagination, 'pagination');

    this.logger.debug(`filter: ${JSON.stringify(filter)}`);
    let whereClause:
      | FindOptionsWhere<UserEntity>
      | FindOptionsWhere<UserEntity>[] = {
      ...filter,
      // id: Not(Equal(this.request.user.id)),
    };

    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      whereClause = [
        {
          ...whereClause,
          fullName: Like(searchTerm),
        },
        {
          ...whereClause,
          email: Like(searchTerm),
        },
      ];
    }

    const [users, total] = await this.userRepository.findAndCount({
      where: whereClause,
      skip,
      take: limit,
      order: {
        [sortBy]: sortDirection,
      },
      select: UsersService.USER_EXPOSED_FIELDS,
    });
    return {
      users,
      total,
    };
  }

  async findOne(id: string): Promise<UserEntity> {
    const user = await this.userRepository.findOne({
      where: { id: id },
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto | UpdateUserRefreshTokenDto,
  ): Promise<UserEntity> {
    const user = await this.userRepository.findOne({
      where: { id: id },
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const updatedUser = {
      ...user,
      ...updateUserDto,
      updatedAt: new Date(),
    };

    return await this.userRepository.save(updatedUser);
  }

  async remove(id: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: id },
    });
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    await this.userRepository.delete(id);
  }

  async findUserByEmail(email: string): Promise<UserEntity | null> {
    return await this.userRepository.findOne({
      where: { email: email },
    });
  }

  async findOneByRefreshToken(
    refreshToken: string,
  ): Promise<UserEntity | null> {
    return await this.userRepository.findOne({
      where: { refreshToken: refreshToken },
    });
  }

  canUpdateRole(
    currentUserRole: Role,
    targetUserRole: Role,
    updateRole: Role,
  ): boolean {
    const currentUserLevel = this.ROLE_HIERARCHY[currentUserRole];
    const targetUserLevel = this.ROLE_HIERARCHY[targetUserRole];
    const updateRoleLevel = this.ROLE_HIERARCHY[updateRole];

    if (currentUserRole == Role.ADMIN) return true;
    if (currentUserRole == Role.MANAGER && targetUserRole == Role.CUSTOMER)
      return false;
    if (targetUserLevel >= currentUserLevel) {
      return false;
    }
    return updateRoleLevel < currentUserLevel;
  }

  canUpdateOrDeleteUser(currentUserRole: Role, targetUserRole: Role): boolean {
    const currentUserLevel = this.ROLE_HIERARCHY[currentUserRole];
    const targetUserLevel = this.ROLE_HIERARCHY[targetUserRole];

    if (currentUserRole == Role.ADMIN) return true;
    if (currentUserRole == Role.MANAGER && targetUserRole == Role.CUSTOMER)
      return false;
    return targetUserLevel < currentUserLevel;
  }
}
