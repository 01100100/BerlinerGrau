"use client";
import { useEffect, useRef, useState } from "react";

interface ColorGridProps {
  grid: number[][][];
  timestamp?: string;
  coordinates?: {
    latitude: string;
    longitude: string;
  };
}

export default function ColorGrid({
  grid,
  coordinates = { latitude: "N52°29'12.547''", longitude: "E13°26'35.345''" },
}: ColorGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredPixel, setHoveredPixel] = useState<{
    x: number;
    y: number;
    color: number[];
  } | null>(null);
  const [isAnimating, setIsAnimating] = useState(true);
  const [tooltipPosition, setTooltipPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);

  useEffect(() => {
    if (!canvasRef.current || !grid || grid.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rows = grid.length;
    const cols = grid[0].length;
    const pixelSize = 20;

    // Set canvas dimensions
    canvas.width = cols * pixelSize;
    canvas.height = rows * pixelSize;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Animation effect on load
    const drawAnimated = () => {
      const drawNextPixel = (currentRow: number, currentCol: number) => {
        if (currentRow >= rows) {
          setIsAnimating(false);
          return;
        }

        const [r, g, b] = grid[currentRow][currentCol];
        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(
          currentCol * pixelSize,
          currentRow * pixelSize,
          pixelSize,
          pixelSize,
        );

        // Move to next pixel
        let nextCol = currentCol + 1;
        let nextRow = currentRow;

        if (nextCol >= cols) {
          nextCol = 0;
          nextRow++;
        }

        setTimeout(() => {
          requestAnimationFrame(() => drawNextPixel(nextRow, nextCol));
        }, 0);
      };

      drawNextPixel(0, 0);
    };

    // Immediate draw without animation
    const drawImmediate = () => {
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const [r, g, b] = grid[y][x];
          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          ctx.fillRect(x * pixelSize, y * pixelSize, pixelSize, pixelSize);
        }
      }
      setIsAnimating(false);
    };

    if (isAnimating) {
      drawAnimated();
    } else {
      drawImmediate();
    }
  }, [grid, isAnimating]);

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !grid) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = Math.floor(((e.clientX - rect.left) * scaleX) / 20);
    const y = Math.floor(((e.clientY - rect.top) * scaleY) / 20);

    if (x >= 0 && x < grid[0].length && y >= 0 && y < grid.length) {
      setHoveredPixel({
        x,
        y,
        color: grid[y][x],
      });
      setTooltipPosition({ x: e.clientX, y: e.clientY });
    } else {
      setHoveredPixel(null);
      setTooltipPosition(null);
    }
  };

  return (
    <div className="relative border rounded-lg p-4 overflow-hidden shadow-xl">
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="w-full h-auto rounded-md cursor-crosshair shadow-inner"
          style={{ imageRendering: "pixelated" }}
          onMouseMove={handleMouseMove}
          onMouseLeave={() => {
            setHoveredPixel(null);
            setTooltipPosition(null);
          }}
        />

        {/* Portal container for tooltips */}
        <div
          id="tooltip-container"
          className="fixed left-0 top-0 w-full h-full pointer-events-none z-50"
        />
      </div>

      {/* Footer with metadata */}
      <div className="mt-3 flex flex-col sm:flex-row justify-between items-center">
        <p className="text-xs text-gray-400 font-mono">
          {coordinates.latitude}, {coordinates.longitude}
        </p>
        <p className="text-xs text-gray-400">
          {grid.length}×{grid[0]?.length || 0} Pixels
        </p>
      </div>

      {/* Tooltip positioned using fixed positioning */}
      {hoveredPixel && tooltipPosition && (
        <div
          className="fixed bg-black/90 text-white text-xs px-2 py-1 rounded pointer-events-none border border-white/10 z-[9999] backdrop-blur-sm"
          style={{
            left: `${tooltipPosition.x + 16}px`,
            top: `${tooltipPosition.y + 16}px`,
            boxShadow: `0 0 10px 2px rgba(${hoveredPixel.color[0]}, ${hoveredPixel.color[1]}, ${hoveredPixel.color[2]}, 0.3)`,
          }}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-sm"
              style={{
                backgroundColor: `rgb(${hoveredPixel.color[0]}, ${hoveredPixel.color[1]}, ${hoveredPixel.color[2]})`,
              }}
            />
            <div>RGB: {hoveredPixel.color.join(", ")}</div>
            <div>
              HEX: #
              {hoveredPixel.color
                .map((c) => c.toString(16).padStart(2, "0"))
                .join("")}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
