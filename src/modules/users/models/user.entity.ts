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

  @Column()
  roles: string;

  @Column()
  isAdmin: boolean;

  @Column()
  isEmailVerified: boolean;

  constructor(data: Partial<User>) {
    Object.assign(this, data);
  }
}
