interface LegendItem {
  color: string
  label: string
}

interface LegendProps {
  items: LegendItem[]
}

export function Legend({ items }: LegendProps) {
  if (items.length === 0) return null

  return (
    <div className="absolute right-4 top-4 z-10 rounded-md border bg-card/90 px-3 py-2 shadow-sm backdrop-blur-sm">
      <p className="mb-1.5 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
        Layers
      </p>
      <div className="space-y-1">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <div
              className="h-2.5 w-2.5 rounded-sm"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-xs text-foreground">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
