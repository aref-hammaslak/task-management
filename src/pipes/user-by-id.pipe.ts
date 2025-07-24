import { Injectable, NotFoundException, PipeTransform } from '@nestjs/common';
import { UsersService } from '../modules/users/users.service';

@Injectable()
export class UserByIdPipe implements PipeTransform {
  constructor(private readonly userService: UsersService) {}
  async transform(value: string) {
    const user = await this.userService.findOne(value);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}
