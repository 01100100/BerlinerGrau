import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getMetricDescription = (
  value: number,
  type: "brightness" | "saturation",
) => {
  if (type === "brightness") {
    if (value < 30) return "Dark & moody";
    if (value < 50) return "Dim light";
    if (value < 70) return "Moderately bright";
    return "Very bright";
  } else {
    if (value < 20) return "Almost greyscale";
    if (value < 40) return "Muted colors";
    if (value < 60) return "Balanced";
    if (value < 80) return "Vibrant";
    return "Very saturated";
  }
};

// Color metrics helpers
export const calculateColorfulness = (r: number, g: number, b: number) => {
  const rg = Math.abs(r - g);
  const yb = Math.abs(0.5 * (r + g) - b);
  return Math.sqrt(rg * rg + yb * yb);
};

export const calculateChroma = (r: number, g: number, b: number) => {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  return max - min;
};

export const getColorfulnessDescription = (value: number) => {
  if (value < 20) return "Monochromatic";
  if (value < 40) return "Subtle";
  if (value < 60) return "Balanced";
  if (value < 80) return "Vibrant";
  return "Highly colorful";
};
