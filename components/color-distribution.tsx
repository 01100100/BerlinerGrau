"use client";

interface ColorDistributionProps {
  distribution: {
    [key: string]: number;
  };
}

const colorMap: Record<string, string> = {
  pink: "#FFC0CB",
  black: "#000000",
  brown: "#A52A2A",
  gray: "#808080",
  blue: "#0000FF",
  white: "#FFFFFF",
  green: "#008000",
  yellow: "#FFFF00",
  orange: "#FFA500",
  red: "#FF0000",
  purple: "#800080",
};

export default function ColorDistribution({
  distribution,
}: ColorDistributionProps) {
  const sortedColors = Object.entries(distribution).sort(
    ([, a], [, b]) => b - a,
  );

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {sortedColors.map(([color, percentage]) => (
          <div key={color} className="group">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-sm shadow-sm transition-transform group-hover:scale-110"
                  style={{ backgroundColor: colorMap[color] || color }}
                />
                <span className="text-sm font-medium capitalize">{color}</span>
              </div>
              <span className="text-sm font-mono">
                {percentage.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-muted/50 rounded-full h-2.5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all group-hover:opacity-90"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: colorMap[color] || color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
