import {
  // ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
// import { User } from './interfaces/user.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { v4 as uuidv4 } from 'uuid';
import { Repository } from 'typeorm';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User as UserEntity } from './models/user.entity';
import { Role } from '../auth/enums/role.enum';
import { UpdateUserRefreshTokenDto } from './dto/update-user-refreshtoken.dto';
// import { NotFoundException } from '@nestjs/common';
import bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
    private logger: Logger,
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

  async findAll(): Promise<UserEntity[]> {
    return await this.userRepository.find();
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
