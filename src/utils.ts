import jwtDecode from 'jwt-decode';
import { TOKEN_KEY, REFRESH_TOKEN_KEY } from './constants';
import { BaseUserType } from './types';

const p: any = typeof process === 'undefined' ? {} : process;

export const getToken = (): string =>
  localStorage.getItem(p?.env?.REACT_APP_REACT_AUTH_TOKEN_KEY || TOKEN_KEY) ??
  '';
export const getRefreshToken = (): string =>
  localStorage.getItem(
    p?.env?.REACT_APP_REACT_AUTH_TOKEN_KEY || REFRESH_TOKEN_KEY
  ) ?? '';
const setToken = (token?: string) =>
  token &&
  localStorage.setItem(
    p?.env?.REACT_APP_REACT_AUTH_TOKEN_KEY || TOKEN_KEY,
    token
  );
export const setRefreshToken = (refreshToken?: string) =>
  refreshToken &&
  localStorage.setItem(
    p?.env?.REACT_APP_REACT_AUTH_TOKEN_KEY || REFRESH_TOKEN_KEY,
    refreshToken
  );
const removeToken = () =>
  localStorage.removeItem(p?.env?.REACT_APP_REACT_AUTH_TOKEN_KEY || TOKEN_KEY);
const removeRefreshToken = () =>
  localStorage.removeItem(
    p?.env?.REACT_APP_REACT_AUTH_TOKEN_KEY || REFRESH_TOKEN_KEY
  );

export const isTokenExpired = (token: string) => {
  try {
    const tokenInfo = jwtDecode<{ exp: number }>(token);
    return new Date() >= new Date(tokenInfo.exp * 1000);
  } catch (error) {
    return true;
  }
};

export const isAuthenticated = () => !isTokenExpired(getToken());

export const redirectTo = (to: string) => {
  window.location.replace(to);
};

export const redirectToLogin = (loginPath: string) => {
  if (!window.location.pathname.includes(loginPath)) {
    removeToken();
    removeRefreshToken();
    redirectTo(
      `${loginPath}?attempt=${encodeURIComponent(
        window.location.pathname + window.location.search
      )}`
    );
  }
};

export const getUser = async ({ token: tokenProp }: { token?: string }) => {
  try {
    setToken(tokenProp);
    const token = getToken();
    const user = jwtDecode<BaseUserType>(token);
    return { ...user, token };
  } catch (error) {
    return {};
  }
};

export const getPropFromToken = (token: string, propName: string) => {
  let decodedToken: { [key: string]: any };
  try {
    decodedToken = jwtDecode<{}>(token);
  } catch (error) {
    decodedToken = {};
  }
  return decodedToken[propName];
};

const getUrlParameterByName = (name: string, url: string) => {
  const cleanName = name.replace(/[\[\]]/g, '\\$&');
  const regex = new RegExp(`[?&]${cleanName}(=([^&#]*)|&|#|$)`);
  const results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, ' '));
};

export const getPageAttempt = (url: string): string =>
  getUrlParameterByName('attempt', url) ?? '/';
