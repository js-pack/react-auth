export type BaseUserType = {
  token: string | null;
  sub: string;
  name: string;
  email?: string;
  iat: string;
  exp: number;
};
