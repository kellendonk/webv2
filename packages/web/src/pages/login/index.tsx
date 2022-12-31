import React from 'react';
import { MainLayout } from '../../components/MainLayout';
import { HeroTitle } from '../../components/HeroTitle';
import Head from 'next/head';
import { useLogin } from '../../hooks/useLogin';
import { GradientText } from '../../components/GradientText';

export function Page() {
  const { user, error, login } = useLogin();

  return (
    <MainLayout>
      <Head>
        <title>Home of the Kellendonks</title>
        <meta
          name="description"
          content="The web home of the Kellendonks. Find anything officially related to the Kellendonks here."
        />
      </Head>

      <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-20 text-center lg:py-32">
        <HeroTitle>
          Kellendonk <GradientText>login</GradientText>
        </HeroTitle>

        <button onClick={login} className="rounded-xl border-2 p-2 my-10">
          Log In
        </button>

        {error && <p>Error: {error}</p>}
        {user && <pre>{JSON.stringify(user, null, 2)}</pre>}
      </section>
    </MainLayout>
  );
}

export default Page;
