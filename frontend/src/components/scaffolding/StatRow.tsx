interface StatItem {
  label: string;
  value: string | number;
}

interface StatRowProps {
  stats: StatItem[];
}

export function StatRow({ stats }: StatRowProps) {
  return (
    <div className="flex flex-wrap gap-x-12 gap-y-6 py-6 border-y border-border/10">
      {stats.map((stat, index) => (
        <div key={index} className="flex flex-col gap-1">
          <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.2em]">
            {stat.label}
          </span>
          <span className="text-2xl font-serif text-foreground">{stat.value}</span>
        </div>
      ))}
    </div>
  );
}
