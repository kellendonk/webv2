import React from 'react';
import { HeroSection, HeroTitle } from '../../components/HeroSection';
import { MainLayout } from '../../components/MainLayout';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faDiscord,
  faGithub,
  faMastodon,
  faSteam,
  faTelegram,
  faTwitter,
} from '@fortawesome/free-brands-svg-icons';
import Link from 'next/link';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import Head from 'next/head';

export function Page() {
  return (
    <MainLayout>
      <Head>
        <title>Josh&apos;s Links</title>
        <meta
          name="description"
          content="Links to Josh's various online profiles."
        />
      </Head>
      <HeroSection>
        <HeroTitle>
          Josh&apos;s{' '}
          <span className="text-[#ED3125] sm:whitespace-nowrap">profiles</span>
        </HeroTitle>

        <div className="flex flex-wrap justify-center gap-10 mt-20 px-10 max-w-2xl mx-auto">
          <TreeLink icon={faGithub} href="https://github.com/misterjoshua">
            GitHub
          </TreeLink>
          <TreeLink
            icon={faMastodon}
            href="https://fosstodon.org/@misterjoshua"
          >
            Mastodon
          </TreeLink>
          <TreeLink icon={faTelegram} href="https://t.me/Klonkadonk">
            Telegram
          </TreeLink>
          <TreeLink
            icon={faDiscord}
            href="https://discordapp.com/users/110936588887822336"
          >
            Discord
          </TreeLink>
          <TreeLink
            icon={faSteam}
            href="https://steamcommunity.com/id/klonkadonk/"
          >
            Steam
          </TreeLink>
          <TreeLink href="https://twitter.com/eigenseries" icon={faTwitter}>
            Twitter
          </TreeLink>
        </div>
      </HeroSection>
    </MainLayout>
  );
}

export default Page;

type TreeLinkProps = React.PropsWithChildren<{
  href: string;
  icon: IconProp;
}>;

const TreeLink = (props: TreeLinkProps) => (
  <Link href={props.href} className="flex flex-col text-2xl w-[100px]" rel="me">
    <FontAwesomeIcon icon={props.icon} className="text-[75px]" />
    <div className="mt-4">{props.children}</div>
  </Link>
);
