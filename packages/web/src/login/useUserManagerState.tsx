import * as oidc from 'oidc-client-ts';
import * as apollo from '@apollo/client';
import { gql, useQuery } from '@apollo/client';
import { useCallback, useEffect, useMemo, useState } from 'react';

export function useUserManagerState() {
  const userManager = useUserManager();
  const [error, setError] = useState<string>();

  const initialUser = getUserFromLocalStorage();
  const [user, setUser] = useState<oidc.User | undefined>(initialUser);
  useLocalStorageSync(user);

  // Remove the user if the session is expired.
  useEffect(() => {
    if (!user) return;
    if (user.expired) {
      setUser(undefined);
    }
  }, [user, setUser]);

  // Allow the caller to request the user log in
  const login = useCallback(async () => {
    try {
      setError(undefined);
      const user = await userManager.signinPopup();
      setUser(user);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [setError, setUser, userManager]);

  // Allow the caller to log the user out
  const logout = useCallback(async () => {
    try {
      setError(undefined);
      await userManager.signoutPopup();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setUser(undefined);
    }
  }, [userManager]);

  return {
    user,
    error,
    login,
    logout,
  };
}

const LOCAL_STORAGE_KEY = 'userManagerState.user';

function useLocalStorageSync(user: oidc.User) {
  // Sync the user with the local storage.
  useEffect(() => {
    if (user) {
      localStorage.setItem(LOCAL_STORAGE_KEY, user.toStorageString());
    } else {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }, [user]);
}

function getUserFromLocalStorage() {
  const initialLocalStorageValue =
    typeof localStorage !== 'undefined'
      ? localStorage.getItem(LOCAL_STORAGE_KEY)
      : undefined;

  if (!initialLocalStorageValue) {
    return;
  }

  const user = oidc.User.fromStorageString(initialLocalStorageValue);
  return !user.expired ? user : undefined;
}

export function useUserManagerLoginCallback() {
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
  const authInfo = useAuthInfo();

  if (!authInfo.data) return;

  return new oidc.UserManager({
    client_id: authInfo.data.authInfo.clientId,
    authority: authInfo.data.authInfo.authority,
    redirect_uri: `${window.location.origin}/login/callback`,
    revokeTokenTypes: ['refresh_token'],
    automaticSilentRenew: false,
  });
}

function useAuthInfo() {
  const uri = process.env.NEXT_PUBLIC_GRAPHQL_URI ?? '/graphql';

  const client = useMemo(
    () =>
      new apollo.ApolloClient({
        uri,
        cache: new apollo.InMemoryCache(),
      }),
    [uri],
  );

  return useQuery(AUTH_INFO, {
    client,
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
