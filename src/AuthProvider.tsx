import React, { useCallback, useEffect, useRef, useState } from 'react';
import AuthContext from './AuthContext';
import { BaseUserType } from './types';
import {
  getPageAttempt,
  getPropFromToken,
  getUser,
  getToken,
  getRefreshToken,
  isAuthenticated,
  isTokenExpired,
  redirectToLogin,
  setRefreshToken,
} from './utils';

const BUFFER_MS = 120000;

type RefreshTokenFetcherType = {
  token: string;
  refreshToken: string;
};

type TokenReFetcherType = (
  refreshToken: string
) => Promise<RefreshTokenFetcherType>;

type AuthProviderProps = {
  children: React.ReactElement;
  anonymousRoutes?: Array<{ path: string }>;
  enableRedirectToLogin?: boolean;
  redirectToLoginPath?: string;
  permissionParser?: (user: any) => Array<string> | undefined;
  userExtender?: <UserType>(user: any) => Promise<UserType>;
  tokenReFetcher?: TokenReFetcherType;
};

const defaultPermissionsParser = (user: any) => user?.permissions;
const defaultUserExtender = (user: any) => user;
const defaultTokenReFetcher = () =>
  Promise.resolve<RefreshTokenFetcherType>({ token: '', refreshToken: '' });

const AuthProvider = ({
  children,
  anonymousRoutes,
  enableRedirectToLogin = false,
  redirectToLoginPath = '',
  permissionParser = defaultPermissionsParser,
  userExtender = defaultUserExtender,
  tokenReFetcher = defaultTokenReFetcher,
}: AuthProviderProps) => {
  const refreshTokenTimerRef = useRef<number>();
  const [user, _setUser] = useState<BaseUserType>({} as BaseUserType);
  const [userPermissions, setUserPermissions] = useState<Array<string>>([]);
  const [userPermissionsAreSet, setUserPermissionsAreSet] = useState(false);
  const isAuth = isAuthenticated();

  const authGuard = useCallback(
    (e) => {
      if (
        enableRedirectToLogin &&
        !isAuthenticated() &&
        !(anonymousRoutes ?? [])
          .map(({ path }) => path)
          .includes(window.location.pathname)
      ) {
        e?.stopPropagation?.();
        redirectToLogin(redirectToLoginPath);
      }
    },
    [anonymousRoutes]
  );

  const setUser = async ({
    token: tokenProp,
    refreshToken: refreshTokenProp,
  }: {
    token: string;
    refreshToken?: string;
  }) => {
    try {
      if (refreshTokenProp) {
        setRefreshToken(refreshTokenProp);
      }
      let newUser = {} as BaseUserType;
      if (tokenProp) {
        newUser = (await getUser({ token: tokenProp })) as BaseUserType;
        newUser = await userExtender(newUser);
      }

      if (newUser?.exp) {
        _setUser(newUser);
        const permissions = permissionParser(newUser);
        if (permissionParser !== defaultPermissionsParser && !permissions) {
          console.error(
            'Permissions may be set incorrectly, check permissionsParser prop to use Permit component properly'
          );
        }
        setUserPermissions(Array.isArray(permissions) ? permissions : []);
      }
      setUserPermissionsAreSet(true);
    } catch (error) {
      setUserPermissionsAreSet(true);
    }
  };

  const startRefreshTokenTimer = useCallback(
    (currentToken: string, currentRefreshToken: string) => {
      if (
        currentToken &&
        currentRefreshToken &&
        !isTokenExpired(currentRefreshToken)
      ) {
        clearTimeout(refreshTokenTimerRef.current);
        const expires = getPropFromToken(currentToken, 'exp') * 1000;
        const timeout = expires - Date.now() - BUFFER_MS;
        // @ts-ignore
        refreshTokenTimerRef.current = setTimeout(() => {
          refetchToken(currentRefreshToken);
        }, timeout);
      }
    },
    []
  );

  const refetchToken = useCallback(
    (currentRefreshToken: string) => {
      const resolvable =
        tokenReFetcher?.(currentRefreshToken) ?? defaultTokenReFetcher();

      resolvable.then(({ token, refreshToken }) => {
        setUser({ token, refreshToken });
        startRefreshTokenTimer(token, refreshToken);
      });
    },
    [tokenReFetcher]
  );

  const redirect = useCallback(
    () => redirectToLogin(redirectToLoginPath),
    [redirectToLoginPath]
  );

  useEffect(() => {
    const token = getToken();
    const refreshToken = getRefreshToken();

    if (!isAuth && !isTokenExpired(refreshToken)) {
      refetchToken(refreshToken);
    }

    if (!user.exp && isAuth) {
      setUser({ token, refreshToken });
    }

    startRefreshTokenTimer(token, refreshToken);

    if (enableRedirectToLogin) {
      window.removeEventListener('mousedown', authGuard);
      window.addEventListener('mousedown', authGuard);
      window.removeEventListener('keydown', authGuard);
      window.addEventListener('keydown', authGuard);
    }

    return () => {
      clearTimeout(refreshTokenTimerRef.current);
      window.removeEventListener('mousedown', authGuard);
      window.removeEventListener('keydown', authGuard);
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        userPermissions,
        userPermissionsAreSet,
        setUser,
        get isAuth() {
          return isAuthenticated();
        },
        redirectToLogin: redirect,
        get pageAttempt() {
          return getPageAttempt(window.location.search);
        },
      }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
