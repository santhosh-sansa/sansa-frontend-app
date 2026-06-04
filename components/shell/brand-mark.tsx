export function BrandMark({ className }: { className?: string }) {
  return (
    <div
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary via-primary to-accent text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 ${className ?? ''}`}
      aria-hidden
    >
      S
    </div>
  );
}
