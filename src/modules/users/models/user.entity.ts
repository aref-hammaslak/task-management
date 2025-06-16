import { Role } from 'src/modules/auth/enums/role.enum';
import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  fullName: string;

  @Column()
  email: string;

  @Column()
  password: string;

  @Column()
  createdAt: Date;

  @Column()
  updatedAt: Date;

  @Column()
  isActive: boolean;

  @Column({
    type: 'enum',
    enum: Role,
    default: Role.CUSTOMER,
  })
  role: Role;

  @Column({
    type: 'varchar',
    nullable: true,
    default: null,
  })
  refreshToken: string | null;

  @Column({
    default: false,
  })
  isAdmin: boolean;

  @Column({
    default: false,
  })
  isEmailVerified: boolean;

  constructor(data: Partial<User>) {
    Object.assign(this, data);
  }
}
