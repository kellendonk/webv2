import React, { useEffect, useState } from 'react';
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
        <title>Josh&apos;s Online Profile</title>
        <meta
          name="description"
          content="Links to Josh's various online profiles."
        />
      </Head>
      <HeroSection>
        <HeroTitle>
          Josh&apos;s{' '}
          <span className="text-[#fdc214] sm:whitespace-nowrap">
            online profiles
          </span>
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

const TreeLink = (props: TreeLinkProps) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (!isAnimating) return;

    const handle = setTimeout(() => setIsAnimating(false), 1000);

    return () => {
      clearTimeout(handle);
    };
  }, [isAnimating, setIsAnimating]);

  return (
    <div>
      <Link
        href={props.href}
        className="flex flex-col text-2xl w-[100px] hover:text-[#ed3125]"
        rel="me"
        onMouseEnter={() => setIsAnimating(true)}
        onMouseLeave={() => setIsAnimating(false)}
      >
        <FontAwesomeIcon
          icon={props.icon}
          className="text-[75px]"
          bounce={isAnimating}
          dur="1s"
        />
        <div className="mt-4">{props.children}</div>
      </Link>
    </div>
  );
};
