export class User {
  id: string;
  email: string;
  name: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
  isActive?: boolean;
  roles?: string[];
  isAdmin?: boolean;
  isEmailVerified?: boolean = false;

  constructor(data: Partial<User>) {
    Object.assign(this, data);
  }
}
