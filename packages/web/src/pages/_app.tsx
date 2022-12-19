import { AppProps } from 'next/app';
import Head from 'next/head';

import './_app.css';
import Script from 'next/script';

function CustomApp({ Component, pageProps }: AppProps) {
  return (
    <>
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
    </>
  );
}

export default CustomApp;
