import { useUserManagerLoginCallback } from '../../login/useUserManagerState';
import Head from 'next/head';
import { HeroTitle } from '../../components/HeroTitle';
import { MainLayout } from '../../components/MainLayout';
import React from 'react';

export function Page() {
  const { error } = useUserManagerLoginCallback();

  return (
    <MainLayout>
      <Head>
        <title>Logging you in</title>
      </Head>

      <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-20 text-center lg:py-32">
        <HeroTitle>Logging you in</HeroTitle>

        {error && <p>{error}</p>}
      </section>
    </MainLayout>
  );
}

export default Page;
