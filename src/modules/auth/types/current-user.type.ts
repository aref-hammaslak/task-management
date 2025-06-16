import { Role } from '../enums/role.enum';

export type CurrentUser = {
  id: string;
  email: string | null;
  role: Role;
};

export type CurrentUserWithRefreshToken = CurrentUser & {
  refreshToken: string | null;
};

export type RequestWithUser = Request & {
  user: CurrentUserWithRefreshToken;
};
