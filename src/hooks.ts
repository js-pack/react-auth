import { useCallback, useContext } from 'react';
import AuthContext from './AuthContext';

export const useAuth = () => useContext(AuthContext);

export const useHasPermissions = (initialHas: Array<string> = []) => {
  const { userPermissions } = useAuth();

  const hasPermissions = useCallback(
    (has: Array<string> = initialHas) => has.every(userPermissions.includes),
    [userPermissions]
  );

  return hasPermissions;
};

export const useOneOfPermissions = (initialHas: Array<string> = []) => {
  const { userPermissions } = useAuth();

  const hasOneOfPermissions = useCallback(
    (has: Array<string> = initialHas) => has.some(userPermissions.includes),
    [userPermissions]
  );

  return hasOneOfPermissions;
};
