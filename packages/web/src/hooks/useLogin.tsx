import * as oidc from 'oidc-client-ts';
import { gql, useQuery } from '@apollo/client';
import { useCallback, useEffect, useState } from 'react';

export function useLogin() {
  const userManager = useUserManager();
  const [user, setUser] = useState<oidc.User>();
  const [error, setError] = useState<string>();

  const login = useCallback(async () => {
    try {
      setError(undefined);
      const user = await userManager.signinPopup();
      setUser(user);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [setError, setUser, userManager]);

  return { user, error, login };
}

export function useLoginCallback() {
  const userManager = useUserManager();
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!userManager) return;
    userManager
      .signinPopupCallback()
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, [userManager]);

  return {
    error,
  };
}

export function useUserManager(): oidc.UserManager | undefined {
  const authInfo = useQuery(AUTH_INFO);

  if (!authInfo.data) return;

  return new oidc.UserManager({
    client_id: authInfo.data.authInfo.clientId,
    authority: authInfo.data.authInfo.authority,
    redirect_uri: `${window.location.origin}/login/callback`,
    revokeTokenTypes: ['refresh_token'],
    automaticSilentRenew: false,
  });
}

const AUTH_INFO = gql`
  query QueryAuthInfo {
    authInfo {
      authority
      clientId
    }
  }
`;
