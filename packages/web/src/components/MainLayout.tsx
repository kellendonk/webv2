import React from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import logo from '../assets/logo-mark.svg';
import Image from 'next/image';

export const MainLayout: React.FC<React.PropsWithChildren> = ({ children }) => {
  const NavTextLink = (props: React.PropsWithChildren<{ href: string }>) => (
    <Link
      href={props.href}
      className={clsx([
        'flex items-center gap-1',
        'rounded-lg py-1 px-2 hover:bg-slate-100 text-lg',
      ])}
    >
      {props.children}
    </Link>
  );

  return (
    <>
      <div className="min-h-100vh">
        <header className="py-5">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <nav className="relative z-50 flex justify-between">
              <Link aria-label="Home" href="/" className="flex items-center">
                <Image src={logo} width="50" height="50" alt="The Letter K" />
                <span className="hidden sm:inline">for Kellendonk</span>
              </Link>

              <div className="flex gap-5">
                <NavTextLink href="https://github.com/misterjoshua">
                  <FontAwesomeIcon icon={faGithub} width={20} />
                  misterjoshua
                </NavTextLink>
                <NavTextLink href="https://github.com/lineape">
                  <FontAwesomeIcon icon={faGithub} width={20} />
                  lineape
                </NavTextLink>
              </div>
            </nav>
          </div>
        </header>

        <main>{children}</main>
      </div>
    </>
  );
};
