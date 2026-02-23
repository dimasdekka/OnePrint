/**
 * Spinner Component
 * Loading spinner with size variants
 */

import React from "react";

interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  color?: "blue" | "white" | "gray";
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = "md",
  className = "",
  color = "blue",
}) => {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-4",
    lg: "w-12 h-12 border-4",
  };

  const colorClasses = {
    blue: "border-blue-600 border-t-transparent",
    white: "border-white border-t-transparent",
    gray: "border-gray-600 border-t-transparent",
  };

  return (
    <div
      className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full animate-spin ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
};
