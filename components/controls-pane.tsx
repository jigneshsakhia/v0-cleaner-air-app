"use client"

import type React from "react"

import { useState } from "react"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Wind, Leaf, Factory, Droplets, Cloud, MapPin, Sparkles, Network } from "@/components/icons"
import type { LayerType } from "@/types/air-quality"

interface ControlsPaneProps {
  activeLayers: LayerType[]
  onLayerToggle: (layer: LayerType) => void
  onPredictClick: () => void
  onClusterClick: () => void
  selectedRegion: string | null
}

const layerConfig: Array<{
  id: LayerType
  label: string
  icon: React.ReactNode
  description: string
}> = [
  {
    id: "co2",
    label: "CO₂",
    icon: <Cloud className="h-4 w-4" />,
    description: "Carbon dioxide levels",
  },
  {
    id: "ghg",
    label: "Greenhouse Gas",
    icon: <Factory className="h-4 w-4" />,
    description: "Total GHG emissions",
  },
  {
    id: "air_pollution",
    label: "Air Pollution",
    icon: <Wind className="h-4 w-4" />,
    description: "Overall air quality index",
  },
  {
    id: "pm25",
    label: "Particulate Matter",
    icon: <Droplets className="h-4 w-4" />,
    description: "PM2.5 concentration",
  },
  {
    id: "ozone",
    label: "Ozone Pollution",
    icon: <Leaf className="h-4 w-4" />,
    description: "Ground-level ozone",
  },
]

export default function ControlsPane({
  activeLayers,
  onLayerToggle,
  onPredictClick,
  onClusterClick,
  selectedRegion,
}: ControlsPaneProps) {
  const [useLocation, setUseLocation] = useState(false)

  const handleUseLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("[v0] User location:", position.coords)
          setUseLocation(true)
        },
        (error) => {
          console.error("[v0] Geolocation error:", error)
        },
      )
    }
  }

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto bg-background p-6 scrollbar-thin">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-balance text-2xl font-bold tracking-tight text-foreground">
          Cleaner air for healthier Future
        </h1>
        <p className="text-pretty text-sm text-muted-foreground">
          Visualize air quality indicators and run ML-backed predictions for environmental decision-making.
        </p>
      </div>

      {/* Location Selector */}
      <div className="space-y-3 rounded-lg border border-border bg-card p-4">
        <Label className="text-sm font-semibold text-foreground">Location</Label>
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start gap-2 bg-transparent"
          onClick={handleUseLocation}
        >
          <MapPin className="h-4 w-4" />
          {useLocation ? "Location detected" : "Use my location"}
        </Button>
        {selectedRegion && (
          <div className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
            Selected: <span className="font-medium text-foreground">{selectedRegion}</span>
          </div>
        )}
      </div>

      {/* Layer Controls */}
      <div className="space-y-3 rounded-lg border border-border bg-card p-4">
        <Label className="text-sm font-semibold text-foreground">Air Quality Layers</Label>
        <div className="space-y-3">
          {layerConfig.map((layer) => (
            <div key={layer.id} className="flex items-start gap-3 rounded-md p-2 transition-colors hover:bg-muted">
              <Checkbox
                id={layer.id}
                checked={activeLayers.includes(layer.id)}
                onCheckedChange={() => onLayerToggle(layer.id)}
                className="mt-0.5"
              />
              <div className="flex flex-1 flex-col gap-1">
                <Label
                  htmlFor={layer.id}
                  className="flex cursor-pointer items-center gap-2 text-sm font-medium text-foreground"
                >
                  {layer.icon}
                  {layer.label}
                </Label>
                <p className="text-xs text-muted-foreground">{layer.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
          <p className="text-pretty">
            Select layers and a region on the map. Click Predict or Cluster to start the ML Agent.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Button onClick={onPredictClick} disabled={activeLayers.length === 0} className="w-full gap-2" size="lg">
            <Sparkles className="h-4 w-4" />
            Predict CO₂ level
          </Button>
          <Button
            onClick={onClusterClick}
            disabled={activeLayers.length === 0}
            variant="secondary"
            className="w-full gap-2"
            size="lg"
          >
            <Network className="h-4 w-4" />
            Clustering of countries
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-auto space-y-2 rounded-lg border border-border bg-card p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Active Layers</span>
          <span className="font-semibold text-foreground">{activeLayers.length}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Regions Loaded</span>
          <span className="font-semibold text-foreground">8</span>
        </div>
      </div>
    </div>
  )
}
