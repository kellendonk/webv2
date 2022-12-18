import React from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import logo from '../assets/logo-mark.svg';

export const MainLayout: React.FC<React.PropsWithChildren<{}>> = ({
  children,
}) => {
  const NavTextLink = (props: React.PropsWithChildren<{ href: string }>) => (
    <Link
      href={props.href}
      className={clsx([
        'rounded-lg py-1 px-2 text-lg underline text-slate-700 hover:bg-slate-100 hover:text-slate-900 flex items-center gap-2',
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
              <div className="hidden md:flex md:gap-x-5">
                <Link aria-label="Home" href="/" className="flex items-center">
                  <img
                    src={logo}
                    width="50"
                    height="50"
                    alt="The Letter K with fire coming out of it"
                  />
                  is for Kellendonk
                </Link>

                <NavTextLink href="/">Home</NavTextLink>
                <NavTextLink href="https://github.com/misterjoshua">
                  <FontAwesomeIcon icon={faGithub} width={20} />
                  Josh
                </NavTextLink>
                <NavTextLink href="https://github.com/lineape">
                  <FontAwesomeIcon icon={faGithub} width={20} />
                  Eli
                </NavTextLink>
              </div>

              <div className="flex items-center gap-x-5 md:gap-x-8"></div>
            </nav>
          </div>
        </header>

        <main>{children}</main>
      </div>
    </>
  );
};
