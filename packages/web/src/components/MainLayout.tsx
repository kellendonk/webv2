import React from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGithub } from '@fortawesome/free-brands-svg-icons';
import logo from '../assets/logo-mark.svg';
import Image from 'next/image';
import {
  faEdit,
  faPersonFalling,
  faSignIn,
  faSignOut,
} from '@fortawesome/free-solid-svg-icons';
import { useLoginContext } from '../login/LoginContext';

export const MainLayout: React.FC<React.PropsWithChildren> = ({ children }) => {
  const loginContext = useLoginContext();

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
      <div className="min-h-[100vh] flex flex-col justify-between">
        <header className="py-5 sm:py-10 shrink-0">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <nav className="relative z-50 flex justify-between">
              <Link aria-label="Home" href="/" className="flex items-center">
                <Image src={logo} width="50" height="50" alt="The Letter K" />
                <span className="hidden sm:inline">for Kellendonk</span>
              </Link>

              <div className="flex gap-5">
                <NavTextLink href="/josh">
                  <FontAwesomeIcon icon={faPersonFalling} width={20} />
                  Josh
                </NavTextLink>
                <NavTextLink href="https://github.com/lineape">
                  <FontAwesomeIcon icon={faGithub} width={20} />
                  Eli
                </NavTextLink>
              </div>
            </nav>
          </div>
        </header>

        <main className="grow">{children}</main>

        <footer className="bg-black text-white shink-0">
          <div className="mx-auto max-w-7xl flex gap-4 justify-end items-center p-2">
            {!loginContext.loggedIn && (
              <button onClick={loginContext.login}>
                <FontAwesomeIcon
                  icon={faSignIn}
                  height="20"
                  className="min-h-[20px]"
                  aria-label="Sign In"
                />
              </button>
            )}

            {loginContext.loggedIn && (
              <button onClick={loginContext.logout}>
                <FontAwesomeIcon
                  icon={faSignOut}
                  height="20"
                  className="min-h-[20px]"
                  aria-label="Sign Out"
                />
              </button>
            )}

            <a
              href="https://github.com/kellendonk/webv2"
              target="_blank"
              rel="noreferrer"
              aria-label="View GitHub"
            >
              <FontAwesomeIcon
                icon={faGithub}
                height="20"
                className="min-h-[20px]"
                aria-label="GitHub Logo"
              />
            </a>
            <a
              href="https://gitpod.io/#https://github.com/kellendonk/webv2"
              target="_blank"
              rel="noreferrer"
              aria-label="Edit with GitPod"
            >
              <FontAwesomeIcon
                icon={faEdit}
                height="20"
                className="min-h-[20px]"
                aria-label="Edit Icon"
              />
            </a>
          </div>
        </footer>
      </div>
    </>
  );
};
