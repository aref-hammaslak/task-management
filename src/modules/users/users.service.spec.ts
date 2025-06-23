import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { Repository } from 'typeorm';
import { User } from './models/user.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Logger, NotFoundException } from '@nestjs/common';
import { Role } from '../auth/enums/role.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { chooseRandom } from 'src/utils/chooseRandom';

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: Repository<User>;

  const mockLogger = {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    verbose: jest.fn(),
  };

  const mockUserRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  };

  const mockUser = {
    id: '1',
    fullName: 'John Doe',
    email: 'test@example.com',
    password: 'password',
    role: Role.CUSTOMER,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: Logger,
          useValue: mockLogger,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      fullName: 'John Doe',
      email: 'test@example.com',
      password: 'password',
      role: Role.CUSTOMER,
    };
    const newUser = mockUser;
    it('should create a user', async () => {
      userRepository.create = jest.fn().mockReturnValue(newUser);
      userRepository.save = jest.fn().mockResolvedValue(newUser);
      const result = await service.create(createUserDto);
      expect(result).toEqual(newUser);
    });
  });

  describe('findAll', () => {
    const newUser = mockUser;
    const users = [newUser];
    it('should return all users', async () => {
      userRepository.find = jest.fn().mockResolvedValue(users);
      const result = await service.findAll();
      expect(result).toEqual(users);
    });
  });

  describe('findOne', () => {
    it('should throw an error if user not found', async () => {
      userRepository.findOne = jest.fn().mockResolvedValue(null);
      await expect(service.findOne(mockUser.id)).rejects.toThrow(
        NotFoundException,
      );
    });
    it('should return a user', async () => {
      userRepository.findOne = jest.fn().mockResolvedValue(mockUser);
      const result = await service.findOne(mockUser.id);
      expect(result).toEqual(mockUser);
    });
  });
  describe('update', () => {
    const updateUserDto: UpdateUserDto = {
      fullName: 'Updated User',
      email: 'updated@example.com',
      password: 'updatedpassword',
      role: Role.CUSTOMER,
    };
    it('should throw an error if user not found', async () => {
      userRepository.findOne = jest.fn().mockResolvedValue(null);
      await expect(service.update(mockUser.id, updateUserDto)).rejects.toThrow(
        NotFoundException,
      );
    });
    it('should update a user', async () => {
      userRepository.findOne = jest.fn().mockResolvedValue(mockUser);
      const updateTime = new Date();
      userRepository.save = jest.fn().mockResolvedValue({
        ...mockUser,
        ...updateUserDto,
        updatedAt: updateTime,
      });
      const result = await service.update(mockUser.id, updateUserDto);
      expect(result).toEqual({
        ...mockUser,
        ...updateUserDto,
        updatedAt: updateTime,
      });
    });
  });
  describe('remove', () => {
    it('should throw an error if user not found', async () => {
      userRepository.findOne = jest.fn().mockResolvedValue(null);
      await expect(service.remove(mockUser.id)).rejects.toThrow(
        NotFoundException,
      );
    });
    it('should remove a user', async () => {
      userRepository.findOne = jest.fn().mockResolvedValue(mockUser);
      userRepository.delete = jest.fn().mockResolvedValue(undefined);
      await service.remove(mockUser.id);
      expect(userRepository.delete).toHaveBeenCalledWith(mockUser.id);
    });
  });
  describe('findUserByEmail', () => {
    it('should return a user', async () => {
      userRepository.findOne = jest.fn().mockResolvedValue(mockUser);
      const result = await service.findUserByEmail(mockUser.email);
      expect(result).toEqual(mockUser);
    });
  });
  describe('canUpdateOrDeleteUser', () => {
    it('should return true if admin try to update or delete customer', () => {
      const result = service.canUpdateOrDeleteUser(Role.ADMIN, Role.CUSTOMER);
      expect(result).toBe(true);
    });
    it('should return false if customer try to update or delete customer', () => {
      const result = service.canUpdateOrDeleteUser(Role.CUSTOMER, Role.ADMIN);
      expect(result).toBe(false);
    });
    it('should return false if customer try to update or delete manager', () => {
      const result = service.canUpdateOrDeleteUser(Role.CUSTOMER, Role.MANAGER);
      expect(result).toBe(false);
    });
    it('should return true if manager try to update or delete a cook', () => {
      const result = service.canUpdateOrDeleteUser(Role.MANAGER, Role.COOK);
      expect(result).toBe(true);
    });
    it('should return true if manager try to update or delete a waiter', () => {
      const result = service.canUpdateOrDeleteUser(Role.MANAGER, Role.WAITER);
      expect(result).toBe(true);
    });
    it('should return false if manager try to update or delete admin', () => {
      const result = service.canUpdateOrDeleteUser(Role.MANAGER, Role.ADMIN);
      expect(result).toBe(false);
    });
  });
  describe('canUpdateRole', () => {
    const roles = Object.values(Role).filter((role) => role != Role.ADMIN);
    it('should return true if admin try to update role any other role', () => {
      const randomRole = chooseRandom<Role>(roles) as Role;
      const result = service.canUpdateRole(Role.ADMIN, randomRole, randomRole);
      expect(result).toBe(true);
    });
    it('should return false if customer try to update role of a customer', () => {
      const result = service.canUpdateRole(
        Role.CUSTOMER,
        Role.CUSTOMER,
        Role.COOK,
      );
      expect(result).toBe(false);
    });
    it('should return false if customer try to update role of a manager', () => {
      const result = service.canUpdateRole(
        Role.CUSTOMER,
        Role.MANAGER,
        Role.COOK,
      );
      expect(result).toBe(false);
    });
    it('should return true if admin try to update role of a manager', () => {
      const result = service.canUpdateRole(
        Role.ADMIN,
        Role.MANAGER,
        Role.MANAGER,
      );
      expect(result).toBe(true);
    });
  });
});
