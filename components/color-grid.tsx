"use client";

import { useEffect, useRef } from "react";

interface ColorGridProps {
  grid: number[][][];
}

export default function ColorGrid({ grid }: ColorGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !grid || grid.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rows = grid.length;
    const cols = grid[0].length;

    canvas.width = cols * 20;
    canvas.height = rows * 20;

    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const [r, g, b] = grid[y][x];
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(x * 20, y * 20, 20, 20);
      }
    }
  }, [grid]);

  return (
    <div className="border rounded-lg p-3 bg-muted/10 overflow-hidden shadow-inner">
      <canvas
        ref={canvasRef}
        className="w-full h-auto rounded-md"
        style={{ imageRendering: "pixelated" }}
      />
      <p className="text-xs text-center text-muted-foreground mt-2">
        N52°29&apos;12.547&apos;&apos;, E13°26&apos;35.345&apos;&apos; -{" "}
        {grid.length}×{grid[0]?.length || 0}
      </p>
    </div>
  );
}
