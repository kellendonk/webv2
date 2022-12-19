import React from 'react';
import { MainLayout } from '../components/MainLayout';
import { HeroTitle } from '../components/HeroTitle';
import Head from 'next/head';
import { GradientText } from '../components/GradientText';

export function Page() {
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
          Home page for <GradientText>many things</GradientText>
        </HeroTitle>

        <p className="text-xl py-14">
          Though, none of it is here yet. Check back later.
        </p>
      </section>
    </MainLayout>
  );
}

export default Page;
