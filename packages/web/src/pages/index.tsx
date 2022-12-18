import { MainLayout } from '../components/MainLayout';
import React from 'react';
import clsx from 'clsx';

export function Index() {
  return (
    <MainLayout>
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-20 pb-20 text-center lg:pt-32">
        <h1 className="mx-auto max-w-4xl font-display text-5xl font-medium tracking-tight text-slate-900 sm:text-7xl">
          Website containing a{' '}
          <span className="text-[#ED3125] sm:whitespace-nowrap">
            wide range
          </span>{' '}
          of information and resources on a variety of topics
        </h1>
      </section>

      <section className="bg-gradient-to-br from-[#ED3125] to-[#FDC214]">
        <div className="max-w-2xl md:mx-auto md:text-center xl:max-w-none pt-16">
          <h2 className="font-display text-3xl tracking-tight text-white sm:text-4xl md:text-5xl">
            Random quotes to fill the space
          </h2>
          <p className="mt-6 text-lg tracking-tight">
            This design has a lot of space. I need to fill it with some text or
            it'll be empty. So, I've provided some random quotes courtesy of
            ChatGPT and their respective authors.
          </p>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-16 pb-16 text-center flex flex-wrap justify-center gap-20">
          <QuoteBox className="max-w-[40%]">
            The greatest obstacle to discovering the shape of the universe is
            not ignorance, but the illusion of knowledge. - Dan Simmons
          </QuoteBox>
          <QuoteBox className="max-w-[40%]">
            "The only difference between reality and fiction is that fiction has
            to make sense." - Tom Clancy
          </QuoteBox>
          <QuoteBox className="max-w-[40%]">
            "The future is already here - it's just not evenly distributed." -
            William Gibson
          </QuoteBox>
        </div>
      </section>
    </MainLayout>
  );
}

export default Index;

function QuoteBox(props: React.PropsWithChildren<{ className?: string }>) {
  return (
    <div
      className={clsx(
        'bg-white p-5 border-black border-2 relative',
        props.className
      )}
    >
      <p className="text-xl tracking-tight">{props.children}</p>
      <svg
        width="20"
        height="20"
        className="absolute right-[-2px] bottom-[-20px] "
      >
        <path
          d="M0 0 L19 19 L19 0"
          stroke="black"
          fill="white"
          strokeWidth={2}
        />
      </svg>
    </div>
  );
}
