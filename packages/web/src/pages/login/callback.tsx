import { useLoginCallback } from '../../hooks/useLogin';
import Head from 'next/head';
import { HeroTitle } from '../../components/HeroTitle';
import { MainLayout } from '../../components/MainLayout';
import React from 'react';

export function Page() {
  useLoginCallback();

  return (
    <MainLayout>
      <Head>
        <title>Logging you in</title>
      </Head>

      <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-20 text-center lg:py-32">
        <HeroTitle>Logging you in</HeroTitle>
      </section>
    </MainLayout>
  );
}

export default Page;
