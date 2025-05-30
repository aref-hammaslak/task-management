import { Injectable, NotFoundException } from '@nestjs/common';
// import { User } from './interfaces/user.interface';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User as UserEntity } from './models/user.entity';
// import { NotFoundException } from '@nestjs/common';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserEntity> {
    const user = this.userRepository.create({
      ...createUserDto,
      id: uuidv4(),
      password: await bcrypt.hash(createUserDto.password, 10),
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: true,
      roles: 'user',
      isAdmin: false,
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

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserEntity> {
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
    await this.userRepository.delete(id);
  }
}
