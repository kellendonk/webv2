import * as apollo from '@apollo/client';
import React, { useMemo } from 'react';
import { useLoginContext } from '../login/LoginContext';

export function AppApolloProvider(props: React.PropsWithChildren): JSX.Element {
  const { accessToken } = useLoginContext();

  const apolloClient = useMemo(() => {
    const headers: Record<string, string> = {};
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    return new apollo.ApolloClient({
      uri: process.env.NEXT_PUBLIC_GRAPHQL_URI ?? '/graphql',
      headers,
      cache: new apollo.InMemoryCache(),
    });
  }, [accessToken]);

  return (
    <apollo.ApolloProvider client={apolloClient}>
      {props.children}
    </apollo.ApolloProvider>
  );
}
