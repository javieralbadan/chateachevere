import React, { JSX } from 'react';

interface HeadingProps {
  level?: 1 | 2 | 3 | 4;
  children: React.ReactNode;
}

export const Heading: React.FC<HeadingProps> = ({ level = 1, children }) => {
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  const sizes = {
    1: 'text-4xl font-semibold mb-4',
    2: 'text-3xl font-semibold mb-3',
    3: 'text-2xl font-medium mb-2',
    4: 'text-xl font-medium mb-1',
  };

  return <Tag className={sizes[level]}>{children}</Tag>;
};
