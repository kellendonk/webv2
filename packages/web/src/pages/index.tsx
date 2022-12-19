import React from 'react';
import { MainLayout } from '../components/MainLayout';
import { HeroSection, HeroTitle } from '../components/HeroSection';
import Head from 'next/head';

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
      <HeroSection>
        <HeroTitle>
          Home page for{' '}
          <span className="text-[#ED3125] sm:whitespace-nowrap">
            many things
          </span>
        </HeroTitle>

        <p className="text-xl py-14">
          Though, none of it is here yet. Check back later.
        </p>
      </HeroSection>
    </MainLayout>
  );
}

export default Page;
