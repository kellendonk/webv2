import React from 'react';

export const HeroSection: React.FC<React.PropsWithChildren> = ({
  children,
}) => (
  <section>
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 text-center lg:py-32">
      {children}
    </div>
  </section>
);

export const HeroTitle: React.FC<React.PropsWithChildren> = ({ children }) => (
  <h1 className="mx-auto max-w-4xl font-display text-5xl font-medium tracking-tight text-slate-900 sm:text-7xl">
    {children}
  </h1>
);
