import React from 'react';

export const HeroTitle: React.FC<React.PropsWithChildren> = ({ children }) => (
  <h1 className="mx-auto max-w-4xl text-5xl font-medium tracking-tight sm:text-7xl">
    {children}
  </h1>
);
