import { IsBoolean, IsDate, IsEnum, IsOptional } from 'class-validator';
import { Role } from 'src/modules/auth/enums/role.enum';

export class UsersFilterDto {
  @IsOptional()
  @IsEnum(Role)
  role?: Role;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsDate()
  createdAt?: Date;
}
