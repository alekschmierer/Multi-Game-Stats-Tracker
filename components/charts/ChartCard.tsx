export default function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-border rounded-xl p-5 bg-card shadow-sm">
      <h3 className="font-black uppercase tracking-tight text-sm opacity-70">{title}</h3>
      <p className="text-xs text-muted-foreground mb-4">{subtitle}</p>
      {children}
    </div>
  );
}
