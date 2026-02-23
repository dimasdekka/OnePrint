/**
 * Card Component
 * Reusable card container with consistent styling
 */

import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
}

export const Card: React.FC<CardProps> = ({
  children,
  className = "",
  padding = "md",
}) => {
  const paddingStyles = {
    none: "p-0",
    sm: "p-4",
    md: "p-8",
    lg: "p-12",
  };

  return (
    <div
      className={`bg-white rounded-2xl shadow-2xl ${paddingStyles[padding]} ${className}`}
    >
      {children}
    </div>
  );
};
