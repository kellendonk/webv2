import React, { useContext, useEffect, useMemo, useState } from 'react';
import { useUserManagerState } from './useUserManagerState';

export interface LoginState {
  readonly accessToken?: string;
  readonly loggedIn: boolean;
}

const DEFAULT_LOGIN_STATE: LoginState = {
  loggedIn: false,
};

export interface ILoginContext extends LoginState {
  login(): void;

  logout(): void;
}

export const LoginContext = React.createContext<ILoginContext>({
  ...DEFAULT_LOGIN_STATE,
  login: () => void 0,
  logout: () => void 0,
});

export function useLoginContext(): ILoginContext {
  return useContext(LoginContext);
}

export function AppLoginContextProvider(props: React.PropsWithChildren) {
  const { login, logout, user } = useUserManagerState();
  const [value, setValue] = useState<LoginState>(DEFAULT_LOGIN_STATE);

  const context: ILoginContext = useMemo(
    () => ({
      ...value,
      login() {
        void login();
      },
      logout() {
        void logout();
      },
    }),
    [value, login, logout],
  );

  useEffect(() => {
    if (!user) {
      setValue({
        loggedIn: false,
      });
    } else {
      setValue({
        loggedIn: true,
        accessToken: user.access_token,
      });
    }
  }, [user]);

  return (
    <LoginContext.Provider value={context}>
      {props.children}
    </LoginContext.Provider>
  );
}
