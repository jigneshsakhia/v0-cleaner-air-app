"use client"

import { useState } from "react"
import MapPane from "@/components/map-pane"
import ControlsPane from "@/components/controls-pane"
import ChatAgentModal from "@/components/chat-agent-modal"
import airData from "@/data/mock_air_data.json"
import type { AirQualityFeature, LayerType } from "@/types/air-quality"

export default function DashboardClient() {
  const [activeLayers, setActiveLayers] = useState<LayerType[]>([])
  const [selectedFeature, setSelectedFeature] = useState<AirQualityFeature | null>(null)
  const [agentModalOpen, setAgentModalOpen] = useState(false)
  const [agentAction, setAgentAction] = useState<"predict" | "cluster">("predict")

  const handleLayerToggle = (layer: LayerType) => {
    setActiveLayers((prev) => (prev.includes(layer) ? prev.filter((l) => l !== layer) : [...prev, layer]))
  }

  const handleFeatureClick = (feature: AirQualityFeature) => {
    setSelectedFeature(feature)
  }

  const handlePredictClick = () => {
    setAgentAction("predict")
    setAgentModalOpen(true)
  }

  const handleClusterClick = () => {
    setAgentAction("cluster")
    setAgentModalOpen(true)
  }

  return (
    <div className="flex h-screen w-full flex-col lg:flex-row">
      {/* Controls Pane - Left side on desktop, top on mobile */}
      <div className="w-full border-b border-border lg:h-full lg:w-[380px] lg:border-b-0 lg:border-r">
        <ControlsPane
          activeLayers={activeLayers}
          onLayerToggle={handleLayerToggle}
          onPredictClick={handlePredictClick}
          onClusterClick={handleClusterClick}
          selectedRegion={selectedFeature?.properties.name || null}
        />
      </div>

      {/* Map Pane - Right side on desktop, bottom on mobile */}
      <div className="flex-1">
        <MapPane
          data={airData.features as AirQualityFeature[]}
          activeLayers={activeLayers}
          onFeatureClick={handleFeatureClick}
          selectedFeatureId={selectedFeature?.id || null}
        />
      </div>

      {/* Chat Agent Modal */}
      <ChatAgentModal
        open={agentModalOpen}
        onOpenChange={setAgentModalOpen}
        action={agentAction}
        activeLayers={activeLayers}
        selectedFeature={selectedFeature}
      />
    </div>
  )
}
