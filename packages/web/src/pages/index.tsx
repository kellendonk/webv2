import React from 'react';
import { MainLayout } from '../components/MainLayout';
import { HeroSection, HeroTitle } from '../components/HeroSection';

export function Page() {
  return (
    <MainLayout>
      <HeroSection>
        <HeroTitle>
          Home page for{' '}
          <span className="text-[#ED3125] sm:whitespace-nowrap">
            many things
          </span>
        </HeroTitle>

        <p className="text-xl py-14">Though, none of it is here yet. Check back later.</p>
      </HeroSection>
    </MainLayout>
  );
}

export default Page;
