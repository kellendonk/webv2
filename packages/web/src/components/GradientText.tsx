import React from 'react';

export const GradientText = ({ children }: React.PropsWithChildren) => (
  <span className="sm:whitespace-nowrap bg-clip-text from-[#ed3125] to-[#fdc214] bg-gradient-to-br text-transparent bold">
    {children}
  </span>
);
