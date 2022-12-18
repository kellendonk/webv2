import React from 'react';
import { MainLayout } from '../components/MainLayout';
import { HeroSection } from '../components/HeroSection';

export function Page() {
  return (
    <MainLayout>
      <HeroSection>
        Home page for{' '}
        <span className="text-[#ED3125] sm:whitespace-nowrap">many things</span>
      </HeroSection>
    </MainLayout>
  );
}

export default Page;
