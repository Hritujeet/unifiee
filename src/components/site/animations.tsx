import React from "react";

export interface AnimationProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  delay?: number;
  direction?: "up" | "down" | "left" | "right" | "none";
  blur?: boolean;
  duration?: number;
  [key: string]: unknown;
}

export function FadeIn({ children, className, ...props }: AnimationProps) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
}

export function StaggerContainer({
  children,
  className,
  ...props
}: AnimationProps) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
}

export function FadeInItem({ children, className, ...props }: AnimationProps) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
}
