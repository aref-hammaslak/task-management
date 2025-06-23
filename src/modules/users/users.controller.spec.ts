import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './models/user.entity';
import {
  ForbiddenException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { Role } from '../auth/enums/role.enum';
import { RequestWithUser } from '../auth/types/current-user.type';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: UsersService;

  const mockUsersService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    canUpdateOrDeleteUser: jest.fn(),
    canUpdateRole: jest.fn(),
  };

  const mockUser: User = new User({
    id: '1',
    email: 'test@example.com',
    password: 'hashedPassword',
    fullName: 'Jone Carry',
    role: Role.CUSTOMER,
    isAdmin: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const mockRequest = {
    user: {
      id: '1',
      role: Role.ADMIN,
      refreshToken: 'refresh token',
      email: 'test@example.com',
    },
  } as RequestWithUser;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    usersService = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createUserDto: CreateUserDto = {
      email: 'new@example.com',
      password: 'password123',
      fullName: 'New User',
    };

    it('should create a user successfully', async () => {
      mockUsersService.create.mockResolvedValue(mockUser);
      mockUsersService.canUpdateOrDeleteUser.mockReturnValue(true);

      const result = await controller.create(createUserDto, mockRequest);

      expect(result).toEqual({
        success: true,
        data: mockUser,
        message: 'User created successfully',
      });
      expect(mockUsersService.create).toHaveBeenCalledWith(createUserDto);
    });

    it('should throw UnauthorizedException when user cannot create with specified role', async () => {
      const createUserDtoWithRole = { ...createUserDto, role: Role.ADMIN };
      mockUsersService.canUpdateOrDeleteUser.mockReturnValue(false);
      mockRequest.user.role = Role.CUSTOMER;

      await expect(
        controller.create(createUserDtoWithRole, mockRequest),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const users = [mockUser];
      mockUsersService.findAll.mockResolvedValue(users);

      const result = await controller.findAll();

      expect(result).toEqual({
        success: true,
        data: users,
        message: 'Users retrieved successfully',
      });
      expect(mockUsersService.findAll).toHaveBeenCalled();
    });
  });

  describe('findMe', () => {
    it('should return current user profile', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);

      const result = await controller.findMe(mockRequest);

      expect(result).toEqual({
        success: true,
        data: mockUser,
        message: 'User profile retrieved successfully',
      });
      expect(mockUsersService.findOne).toHaveBeenCalledWith(
        mockRequest.user.id,
      );
    });
  });

  describe('updateMe', () => {
    const updateUserDto: UpdateUserDto = {
      fullName: 'Updated Name',
    };

    it('should update current user profile', async () => {
      const updatedUser = { ...mockUser, ...updateUserDto };
      mockUsersService.update.mockResolvedValue(updatedUser);

      const result = await controller.updateMe(mockRequest, updateUserDto);

      expect(result).toEqual({
        success: true,
        data: updatedUser,
        message: 'User profile updated successfully',
      });
      expect(mockUsersService.update).toHaveBeenCalledWith(
        mockRequest.user.id,
        updateUserDto,
      );
    });

    it('should throw BadRequestException when trying to update role', async () => {
      const updateUserDtoWithRole = { ...updateUserDto, role: Role.ADMIN };
      await expect(
        controller.updateMe(mockRequest, updateUserDtoWithRole),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findOne', () => {
    it('should return a user by id', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);

      const result = await controller.findOne('1');

      expect(result).toEqual({
        success: true,
        data: mockUser,
        message: 'User retrieved successfully',
      });
      expect(mockUsersService.findOne).toHaveBeenCalledWith('1');
    });
  });

  describe('update', () => {
    const updateUserDto: UpdateUserDto = {
      fullName: 'Updated Name',
    };

    it('should update a user', async () => {
      const updatedUser = { ...mockUser, ...updateUserDto };
      mockUsersService.findOne.mockResolvedValue(mockUser);
      mockUsersService.update.mockResolvedValue(updatedUser);
      mockUsersService.canUpdateRole.mockReturnValue(true);

      const result = await controller.update('2', updateUserDto, mockRequest);

      expect(result).toEqual({
        success: true,
        data: updatedUser,
        message: 'User updated successfully',
      });
      expect(mockUsersService.update).toHaveBeenCalledWith('2', updateUserDto);
    });

    it('should throw BadRequestException when updating own profile', async () => {
      await expect(
        controller.update('1', updateUserDto, mockRequest),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException when user cannot update role', async () => {
      const updateUserDtoWithRole = { ...updateUserDto, role: Role.ADMIN };
      mockUsersService.findOne.mockResolvedValue(mockUser);
      mockUsersService.canUpdateRole.mockReturnValue(false);

      await expect(
        controller.update('2', updateUserDtoWithRole, mockRequest),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should delete a user', async () => {
      const userToDelete = { ...mockUser, id: '2' };
      mockUsersService.findOne.mockResolvedValue(userToDelete);
      mockUsersService.canUpdateOrDeleteUser.mockReturnValue(true);

      const result = await controller.remove(mockRequest, '2');

      expect(result).toEqual({
        success: true,
        message: 'User deleted successfully',
      });
      expect(mockUsersService.remove).toHaveBeenCalledWith('2');
    });

    it('should throw ForbiddenException when trying to delete self', async () => {
      mockUsersService.findOne.mockResolvedValue(mockUser);
      await expect(controller.remove(mockRequest, '1')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException when trying to delete admin', async () => {
      const adminUser = { ...mockUser, isAdmin: true };
      mockUsersService.findOne.mockResolvedValue(adminUser);

      await expect(controller.remove(mockRequest, '2')).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw UnauthorizedException when user lacks permissions', async () => {
      const userToDelete = { ...mockUser, id: '2' };
      mockUsersService.findOne.mockResolvedValue(userToDelete);
      mockUsersService.canUpdateOrDeleteUser.mockReturnValue(false);

      await expect(controller.remove(mockRequest, '2')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
