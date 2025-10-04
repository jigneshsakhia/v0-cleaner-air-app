import type { LayerType } from "@/types/air-quality"

// Color scales for different layers (low to high pollution)
export const layerColors: Record<LayerType, { low: string; mid: string; high: string }> = {
  co2: {
    low: "rgb(34, 197, 94)", // green
    mid: "rgb(234, 179, 8)", // yellow
    high: "rgb(239, 68, 68)", // red
  },
  ghg: {
    low: "rgb(34, 197, 94)",
    mid: "rgb(234, 179, 8)",
    high: "rgb(239, 68, 68)",
  },
  air_pollution: {
    low: "rgb(34, 197, 94)",
    mid: "rgb(234, 179, 8)",
    high: "rgb(239, 68, 68)",
  },
  pm25: {
    low: "rgb(34, 197, 94)",
    mid: "rgb(234, 179, 8)",
    high: "rgb(239, 68, 68)",
  },
  ozone: {
    low: "rgb(34, 197, 94)",
    mid: "rgb(234, 179, 8)",
    high: "rgb(239, 68, 68)",
  },
}

// Thresholds for each layer (adjust based on real-world data)
export const layerThresholds: Record<LayerType, { low: number; high: number }> = {
  co2: { low: 405, high: 415 },
  ghg: { low: 0.9, high: 1.3 },
  air_pollution: { low: 50, high: 150 },
  pm25: { low: 15, high: 50 },
  ozone: { low: 0.03, high: 0.045 },
}

export function getColorForValue(layer: LayerType, value: number): string {
  const threshold = layerThresholds[layer]
  const colors = layerColors[layer]

  if (value <= threshold.low) {
    return colors.low
  } else if (value >= threshold.high) {
    return colors.high
  } else {
    // Interpolate between mid and high
    return colors.mid
  }
}

export function getOpacityForLayers(activeLayersCount: number): number {
  // Reduce opacity when multiple layers are active
  return Math.max(0.3, 0.7 / activeLayersCount)
}
