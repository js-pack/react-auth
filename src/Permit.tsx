import React, { useMemo } from 'react';
import { useAuth } from './hooks';

type Element = React.ReactElement | JSX.Element;

type PermitType = {
  children: Element;
  condition?: () => boolean;
  oneOf?: Array<string>;
  has?: Array<string>;
  or?: Element;
};

const Permit = ({
  condition,
  oneOf,
  has,
  or,
  children,
  ...rest
}: PermitType) => {
  const { userPermissions, userPermissionsAreSet } = useAuth();

  const visible = useMemo(() => {
    if (!userPermissionsAreSet) {
      return false;
    } else {
      let isVisible = true;
      isVisible = (has ?? []).reduce<boolean>(
        (accm, value) => accm && userPermissions.includes(value),
        isVisible
      );
      isVisible = (oneOf ?? []).reduce<boolean>(
        (accm, value) => accm || !!oneOf?.includes(value),
        !oneOf?.length && isVisible
      );
      return isVisible && condition?.();
    }
  }, [oneOf, has, userPermissions, userPermissionsAreSet, condition]);

  let resultElement = null;

  if (userPermissionsAreSet) {
    if (visible) {
      resultElement = children
        ? React.Children.map(
            children,
            (child: Element) =>
              child && React.cloneElement(child, { ...child.props, ...rest })
          )
        : children;
    } else if (or) {
      resultElement = or;
    }
  }

  return <>{resultElement}</>;
};

Permit.defaultProps = {
  condition: () => true,
  oneOf: [],
  has: [],
};

export default Permit;
