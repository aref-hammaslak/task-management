import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateUserRefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  refreshToken: string | null;
}
