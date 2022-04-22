import React from 'react';

type SetUserType = { token: string; refreshToken: string };

const AuthContext = React.createContext<{
  user: any;
  userPermissions: Array<string>;
  userPermissionsAreSet: boolean;
  setUser: (params: SetUserType) => void;
  isAuth: boolean;
  redirectToLogin: () => void;
  pageAttempt: string;
}>({
  user: {},
  userPermissions: [],
  userPermissionsAreSet: false,
  setUser: () => {},
  isAuth: false,
  redirectToLogin: () => {},
  pageAttempt: '/',
});
AuthContext.displayName = 'AuthContext';

export default AuthContext;
