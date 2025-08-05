import React from 'react';
import { cn } from '../../lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ children, className, ...props }) => {
  return (
    <div
      className={cn(
        "rounded-lg border bg-white dark:bg-gray-900 shadow-sm",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};