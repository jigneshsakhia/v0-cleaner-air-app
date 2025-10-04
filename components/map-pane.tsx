"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import type { AirQualityFeature, LayerType } from "@/types/air-quality"
import { getColorForValue, getOpacityForLayers } from "@/lib/color-utils"

interface MapPaneProps {
  data: AirQualityFeature[]
  activeLayers: LayerType[]
  onFeatureClick: (feature: AirQualityFeature) => void
  selectedFeatureId: string | null
}

export default function MapPane({ data, activeLayers, onFeatureClick, selectedFeatureId }: MapPaneProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const geoJsonLayerRef = useRef<any>(null)
  const [isLeafletReady, setIsLeafletReady] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== "undefined" && window.L) {
      setIsLeafletReady(true)
      return
    }

    const cssLink = document.createElement("link")
    cssLink.rel = "stylesheet"
    cssLink.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    cssLink.integrity = "sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY="
    cssLink.crossOrigin = ""
    document.head.appendChild(cssLink)

    const script = document.createElement("script")
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
    script.integrity = "sha256-20nQCchB9co0qIjJZRGuk2/Z9VM+kNiyxNV1lvTlZBo="
    script.crossOrigin = ""
    script.async = false

    script.onload = () => {
      if (window.L) {
        setIsLeafletReady(true)
      } else {
        setLoadError("Leaflet loaded but not available")
      }
    }

    script.onerror = () => {
      setLoadError("Failed to load Leaflet from CDN")
    }

    document.head.appendChild(script)

    return () => {
      if (cssLink.parentNode) cssLink.parentNode.removeChild(cssLink)
      if (script.parentNode) script.parentNode.removeChild(script)
    }
  }, [])

  const getFeatureStyle = useCallback(
    (feature: AirQualityFeature) => {
      const isSelected = feature.id === selectedFeatureId
      const opacity = getOpacityForLayers(activeLayers.length || 1)

      if (activeLayers.length === 0) {
        return {
          fillColor: "rgb(100, 116, 139)",
          fillOpacity: 0.3,
          color: isSelected ? "rgb(59, 130, 246)" : "rgb(71, 85, 105)",
          weight: isSelected ? 3 : 1,
        }
      }

      const primaryLayer = activeLayers[0]
      const value = feature.properties[primaryLayer === "air_pollution" ? "air_pollution_index" : primaryLayer]
      const fillColor = getColorForValue(primaryLayer, value)

      return {
        fillColor,
        fillOpacity: opacity,
        color: isSelected ? "rgb(59, 130, 246)" : "rgb(71, 85, 105)",
        weight: isSelected ? 3 : 1,
      }
    },
    [activeLayers, selectedFeatureId],
  )

  useEffect(() => {
    if (!isLeafletReady || !mapContainerRef.current || mapRef.current) {
      return
    }

    mapRef.current = window.L.map(mapContainerRef.current, {
      center: [20, 0],
      zoom: 2,
      zoomControl: true,
      scrollWheelZoom: true,
    })

    window.L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(mapRef.current)
  }, [isLeafletReady])

  useEffect(() => {
    if (!mapRef.current || !isLeafletReady) {
      return
    }

    if (geoJsonLayerRef.current) {
      mapRef.current.removeLayer(geoJsonLayerRef.current)
    }

    geoJsonLayerRef.current = window.L.geoJSON(
      { type: "FeatureCollection", features: data },
      {
        style: (feature: any) => getFeatureStyle(feature as AirQualityFeature),
        onEachFeature: (feature: any, layer: any) => {
          const props = feature.properties

          const popupContent = `
            <div style="padding: 12px; min-width: 220px; background: white; border-radius: 8px;">
              <h3 style="font-weight: 600; font-size: 16px; margin-bottom: 12px; color: #0f172a;">${props.name}</h3>
              <div style="display: flex; flex-direction: column; gap: 6px; font-size: 14px;">
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #64748b;">Country:</span>
                  <span style="font-weight: 500; color: #0f172a;">${props.country}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #64748b;">CO₂:</span>
                  <span style="font-weight: 500; color: #0f172a;">${props.co2} ppm</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #64748b;">PM2.5:</span>
                  <span style="font-weight: 500; color: #0f172a;">${props.pm25} µg/m³</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #64748b;">Ozone:</span>
                  <span style="font-weight: 500; color: #0f172a;">${props.ozone}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #64748b;">Pollution Index:</span>
                  <span style="font-weight: 500; color: #0f172a;">${props.air_pollution_index}</span>
                </div>
              </div>
            </div>
          `

          layer.bindPopup(popupContent, {
            maxWidth: 300,
            className: "custom-popup",
            autoPan: true,
            autoPanPadding: [50, 50],
            closeButton: true,
          })

          layer.on("click", () => {
            onFeatureClick(feature as AirQualityFeature)
          })

          layer.on("mouseover", () => {
            layer.setStyle({
              weight: 2,
              fillOpacity: 0.7,
            })
          })

          layer.on("mouseout", () => {
            const style = getFeatureStyle(feature as AirQualityFeature)
            layer.setStyle(style)
          })
        },
      },
    ).addTo(mapRef.current)

    return () => {
      if (geoJsonLayerRef.current && mapRef.current) {
        mapRef.current.removeLayer(geoJsonLayerRef.current)
      }
    }
  }, [data, activeLayers, selectedFeatureId, getFeatureStyle, onFeatureClick, isLeafletReady])

  useEffect(() => {
    return () => {
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
    }
  }, [])

  return (
    <div className="relative h-full w-full">
      {!isLeafletReady && (
        <div className="flex h-full w-full items-center justify-center bg-background">
          <div className="text-center">
            <div className="mb-2 text-lg font-medium text-foreground">
              {loadError ? "Error loading map" : "Loading map..."}
            </div>
            <div className="text-sm text-muted-foreground">{loadError || "Initializing Leaflet from CDN"}</div>
          </div>
        </div>
      )}

      <div ref={mapContainerRef} className="h-full w-full z-0" style={{ display: isLeafletReady ? "block" : "none" }} />

      {activeLayers.length > 0 && (
        <div className="absolute bottom-6 right-6 z-[400] rounded-lg border border-border bg-card p-4 shadow-lg">
          <h4 className="mb-2 text-sm font-semibold text-foreground">Active Layer: {activeLayers[0].toUpperCase()}</h4>
          <div className="flex items-center gap-2 text-xs">
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded-sm bg-[rgb(34,197,94)]" />
              <span className="text-muted-foreground">Low</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded-sm bg-[rgb(234,179,8)]" />
              <span className="text-muted-foreground">Medium</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-3 w-3 rounded-sm bg-[rgb(239,68,68)]" />
              <span className="text-muted-foreground">High</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

declare global {
  interface Window {
    L: any
  }
}
