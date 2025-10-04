"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sparkles, Network, Loader2, TrendingUp, Users } from "@/components/icons"
import { callMLAgent } from "@/lib/api"
import type { AirQualityFeature, LayerType, AgentResponse } from "@/types/air-quality"

interface ChatAgentModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  action: "predict" | "cluster"
  activeLayers: LayerType[]
  selectedFeature: AirQualityFeature | null
}

interface Message {
  role: "system" | "assistant"
  content: string
  response?: AgentResponse
}

export default function ChatAgentModal({
  open,
  onOpenChange,
  action,
  activeLayers,
  selectedFeature,
}: ChatAgentModalProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) {
      // Initialize chat when modal opens
      const systemMessage: Message = {
        role: "system",
        content:
          action === "predict"
            ? "Predict CO₂ level for the selected region and active layers."
            : "Cluster countries by chosen air-quality signals near this location.",
      }
      setMessages([systemMessage])
      // Automatically trigger the ML agent
      handleRunAgent()
    } else {
      // Reset when closed
      setMessages([])
    }
  }, [open, action])

  const handleRunAgent = async () => {
    if (loading) return

    setLoading(true)

    try {
      // Prepare request
      const bbox: [number, number, number, number] = selectedFeature
        ? [
            selectedFeature.geometry.coordinates[0][0][0] - 5,
            selectedFeature.geometry.coordinates[0][0][1] - 5,
            selectedFeature.geometry.coordinates[0][0][0] + 5,
            selectedFeature.geometry.coordinates[0][0][1] + 5,
          ]
        : [-180, -90, 180, 90]

      const center: [number, number] = selectedFeature
        ? [selectedFeature.geometry.coordinates[0][0][0], selectedFeature.geometry.coordinates[0][0][1]]
        : [0, 0]

      const response = await callMLAgent({
        action,
        location: { bbox, center },
        layers: activeLayers,
        context: {
          selectedFeatureIds: selectedFeature ? [selectedFeature.id] : [],
        },
      })

      // Add response message
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: response.text,
          response,
        },
      ])
    } catch (error) {
      console.error("[v0] ML Agent error:", error)
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, there was an error processing your request. Please try again.",
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const renderChart = (response: AgentResponse) => {
    if (response.action === "predict") {
      const data = response.chartData.x.map((year, i) => ({
        year,
        co2: response.chartData.y[i],
      }))

      const maxValue = Math.max(...data.map((d) => d.co2))
      const minValue = Math.min(...data.map((d) => d.co2))
      const range = maxValue - minValue

      return (
        <div className="mt-4 rounded-lg border border-border bg-card p-4">
          <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
            <TrendingUp className="h-4 w-4" />
            CO₂ Trend Analysis
          </h4>
          <div className="relative h-48 w-full">
            {/* Grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="h-px w-full bg-border/50" />
              ))}
            </div>
            {/* Line chart */}
            <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
              <polyline
                fill="none"
                stroke="rgb(59, 130, 246)"
                strokeWidth="2"
                points={data
                  .map((d, i) => {
                    const x = (i / (data.length - 1)) * 100
                    const y = 100 - ((d.co2 - minValue) / range) * 100
                    return `${x}%,${y}%`
                  })
                  .join(" ")}
              />
              {/* Data points */}
              {data.map((d, i) => {
                const x = (i / (data.length - 1)) * 100
                const y = 100 - ((d.co2 - minValue) / range) * 100
                return (
                  <circle
                    key={i}
                    cx={`${x}%`}
                    cy={`${y}%`}
                    r="4"
                    fill="rgb(59, 130, 246)"
                    className="hover:r-6 transition-all"
                  />
                )
              })}
            </svg>
            {/* X-axis labels */}
            <div className="absolute -bottom-6 flex w-full justify-between text-xs text-muted-foreground">
              {data.map((d, i) => (
                <span key={i}>{d.year}</span>
              ))}
            </div>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-3 text-xs">
            <div className="rounded-md bg-muted p-2">
              <div className="text-muted-foreground">Predicted Value</div>
              <div className="text-lg font-semibold text-foreground">{response.payload.predicted_co2_ppm} ppm</div>
            </div>
            <div className="rounded-md bg-muted p-2">
              <div className="text-muted-foreground">Confidence</div>
              <div className="text-lg font-semibold text-foreground">
                {Math.round(response.payload.confidence * 100)}%
              </div>
            </div>
          </div>
        </div>
      )
    } else {
      const data = response.payload.clusters.map((cluster) => ({
        name: cluster.label,
        count: cluster.members.length,
      }))

      const maxCount = Math.max(...data.map((d) => d.count))

      return (
        <div className="mt-4 space-y-4">
          <div className="rounded-lg border border-border bg-card p-4">
            <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
              <Users className="h-4 w-4" />
              Cluster Distribution
            </h4>
            <div className="space-y-3">
              {data.map((item, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">{item.name}</span>
                    <span className="text-muted-foreground">{item.count} regions</span>
                  </div>
                  <div className="h-8 w-full rounded-md bg-muted">
                    <div
                      className="h-full rounded-md bg-green-500 transition-all duration-500"
                      style={{ width: `${(item.count / maxCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            {response.payload.clusters.map((cluster) => (
              <div key={cluster.cluster_id} className="rounded-lg border border-border bg-card p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-semibold text-foreground">{cluster.label}</span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                    {cluster.members.length} regions
                  </span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {cluster.members.map((member) => (
                    <span
                      key={member}
                      className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground"
                    >
                      {member}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            {action === "predict" ? (
              <>
                <Sparkles className="h-5 w-5 text-chart-1" />
                CO₂ Prediction Agent
              </>
            ) : (
              <>
                <Network className="h-5 w-5 text-chart-2" />
                Clustering Agent
              </>
            )}
          </DialogTitle>
          <DialogDescription className="text-pretty">
            {action === "predict"
              ? "Analyzing air quality data to predict CO₂ levels in the selected region."
              : "Grouping countries based on air quality indicators to identify pollution patterns."}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`rounded-lg p-4 ${
                  message.role === "system"
                    ? "border border-border bg-muted/50 text-sm text-muted-foreground"
                    : "border border-border bg-card"
                }`}
              >
                {message.role === "system" ? (
                  <div className="flex items-start gap-2">
                    <div className="mt-0.5 h-2 w-2 rounded-full bg-chart-1" />
                    <p className="text-pretty">{message.content}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-pretty text-sm leading-relaxed text-foreground">{message.content}</p>
                    {message.response && renderChart(message.response)}
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex items-center justify-center gap-2 rounded-lg border border-border bg-card p-8">
                <Loader2 className="h-5 w-5 animate-spin text-chart-1" />
                <span className="text-sm text-muted-foreground">Processing your request...</span>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={handleRunAgent} disabled={loading} className="gap-2">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Run Again
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
