import React from 'react';
import { HeroSection, HeroTitle } from '../../components/HeroSection';
import { MainLayout } from '../../components/MainLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub, faMastodon } from '@fortawesome/free-brands-svg-icons';
import Link from 'next/link';
import { IconProp } from '@fortawesome/fontawesome-svg-core';

export function Page() {
  interface TreeLinkProps {
    href: string;
    icon: IconProp;
    text: string;
  }

  const TreeLink = (props: TreeLinkProps) => (
    <Link href={props.href} className="flex flex-col text-2xl">
      <FontAwesomeIcon icon={props.icon} className="text-[75px]" />
      {props.text}
    </Link>
  );

  return (
    <MainLayout>
      <HeroSection>
        <HeroTitle>
          Josh&apos;s{' '}
          <span className="text-[#ED3125] sm:whitespace-nowrap">links</span>
        </HeroTitle>

        <div className="flex flex-wrap justify-center gap-10 mt-20 px-10">
          <TreeLink
            icon={faGithub}
            text="GitHub"
            href="https://github.com/misterjoshua"
          />
          <TreeLink
            icon={faMastodon}
            text="Mastodon"
            href="https://fosstodon.org/@misterjoshua"
          />
        </div>
      </HeroSection>
    </MainLayout>
  );
}

export default Page;
