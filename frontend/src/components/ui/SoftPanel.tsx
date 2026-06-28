import type { PropsWithChildren } from "react";

interface SoftPanelProps extends PropsWithChildren {
  className?: string;
}

export function SoftPanel({ children, className = "" }: SoftPanelProps) {
  return <section className={`soft-panel ${className}`.trim()}>{children}</section>;
}
