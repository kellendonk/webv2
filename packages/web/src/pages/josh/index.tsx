import React, { HTMLAttributes, useEffect, useState } from 'react';
import { HeroTitle } from '../../components/HeroTitle';
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
import { GradientText } from '../../components/GradientText';

import joshProfile from '../../assets/josh-profile.jpg';
import Image from 'next/image';
import clsx from 'clsx';

export function Page() {
  return (
    <MainLayout>
      <Head>
        <title>Josh&apos;s Online Profiles</title>
        <meta
          name="description"
          content="Links to Josh's various online profiles."
        />
      </Head>

      <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10 pt-20 text-center lg:py-16 lg:pt-32">
        <HeroTitle>
          Hi I&apos;m <GradientText>Josh</GradientText>
        </HeroTitle>

        <div className="flex mt-16 justify-center items-center gap-8 md:gap-16 flex-wrap md:flex-nowrap">
          <Image
            src={joshProfile}
            alt="Josh's Picture"
            width="250"
            height="250"
            className="rounded-full"
          />
          <div className="shrink text-left">
            <Para>
              I&apos;m a Cloud Solutions Architect and Software Developer from
              Calgary, Alberta 🇨🇦. I am intimately familiar with the AWS cloud.
            </Para>
            <Para>
              Most days, you can find me hacking on a SaaS product or helping my
              team deliver top-quality products. My most-used programming
              languages in 2022 were: TypeScript, Go, and Python.
            </Para>
            <Para>
              Lately, I&apos;ve been exploring ways to increase the
              manageability of cloud-based projects. I aim to reduce the
              cognitive burden of using cloud products. As you might imagine,
              I&apos;ve been closely following developments in the emerging
              Infrastructure from Code movement.
            </Para>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10 text-center lg:py-16">
        <HeroTitle>
          Josh&apos;s <GradientText>online profiles</GradientText>
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
      </section>
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

  // Cause hover animation to run only once. (1 second animation duration)
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

const Para = (props: HTMLAttributes<HTMLParagraphElement>) => (
  <p {...props} className={clsx('my-6 leading-7', props.className)}>
    {props.children}
  </p>
);
