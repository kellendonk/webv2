import { AppProps } from 'next/app';
import Head from 'next/head';

import './_app.css';
import Script from 'next/script';
// import { ApolloClient, ApolloProvider, InMemoryCache } from '@apollo/client';
import * as apollo from '@apollo/client';

function CustomApp({ Component, pageProps }: AppProps) {
  return (
    <apollo.ApolloProvider client={apolloClient}>
      <Head>
        <title>Welcome to web!</title>
      </Head>

      <Script
        src="https://www.googletagmanager.com/gtag/js?id=G-JMCDB5JZXK"
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){window.dataLayer.push(arguments);}
          gtag('js', new Date());

          gtag('config', 'G-JMCDB5JZXK');
        `}
      </Script>

      <main className="app">
        <Component {...pageProps} />
      </main>
    </apollo.ApolloProvider>
  );
}

const apolloClient = new apollo.ApolloClient({
  // uri: 'https://www.kellendonk.ca/graphql',
  uri: 'https://o6g4vydgzfgedbwbxipnok7c7y.appsync-api.ca-central-1.amazonaws.com/graphql',
  headers: {
    'x-api-key': 'da2-ybvuigoq55epjmjewaa753ks44',
  },
  cache: new apollo.InMemoryCache(),
  connectToDevTools: true,
});

export default CustomApp;
