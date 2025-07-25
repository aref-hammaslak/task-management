import { IsIn, IsInt, IsOptional, Min, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class PaginationFilterDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Transform(({ value }: { value: string }) => parseInt(value))
  page: number = 0;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Transform(({ value }: { value: string }) => parseInt(value))
  limit: number = 10;

  @IsOptional()
  @IsIn(['createdAt', 'updatedAt', 'fullName', 'email', 'role', 'isActive'])
  sortBy: string = 'createdAt';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortDirection: 'asc' | 'desc' = 'desc';
}
