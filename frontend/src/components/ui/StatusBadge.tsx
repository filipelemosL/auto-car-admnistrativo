interface StatusBadgeProps {
  tone: "default" | "success" | "warning" | "danger" | "info";
  label: string;
}

export function StatusBadge({ tone, label }: StatusBadgeProps) {
  return <span className={`status-badge status-${tone}`}>{label}</span>;
}
