import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {}

export const Card: React.FC<CardProps> = ({ className, children, ...props }) => {
  return (
    <div
      className={`bg-white p-4 rounded shadow ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
