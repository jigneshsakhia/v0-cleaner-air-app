import { type NextRequest, NextResponse } from "next/server"
import type { AgentRequest, AgentResponse } from "@/types/air-quality"
import airData from "@/data/mock_air_data.json"

export async function POST(request: NextRequest) {
  try {
    const body: AgentRequest = await request.json()
    const { action, location, layers } = body

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 800))

    if (action === "predict") {
      // Find features within bbox
      const featuresInBbox = airData.features.filter((feature) => {
        const coords = feature.geometry.coordinates[0]
        const featureLng = coords[0][0]
        const featureLat = coords[0][1]

        return (
          featureLng >= location.bbox[0] &&
          featureLat >= location.bbox[1] &&
          featureLng <= location.bbox[2] &&
          featureLat <= location.bbox[3]
        )
      })

      // Calculate average CO2
      const avgCo2 =
        featuresInBbox.length > 0
          ? featuresInBbox.reduce((sum, f) => sum + f.properties.co2, 0) / featuresInBbox.length
          : 410

      // Add random variation
      const delta = (Math.random() - 0.5) * 8
      const predicted = Math.round((avgCo2 + delta) * 10) / 10

      // Generate trend data
      const trend = Array.from({ length: 5 }, (_, i) => {
        return Math.round((predicted - 7 + i * 1.8 + Math.random() * 2) * 10) / 10
      })

      const confidence = Math.round((0.6 + Math.random() * 0.3) * 100) / 100

      const response: AgentResponse = {
        status: "ok",
        action: "predict",
        text: `Predicted average CO₂ level in selected region: ${predicted} ppm (${delta > 0 ? "+" : ""}${Math.round(delta * 10) / 10} ppm vs baseline). Confidence: ${confidence}.`,
        payload: {
          predicted_co2_ppm: predicted,
          trend,
          confidence,
        },
        chartData: {
          x: ["2019", "2020", "2021", "2022", "2023"],
          y: trend,
        },
      }

      return NextResponse.json(response)
    } else if (action === "cluster") {
      // Mock clustering
      const countries = Array.from(new Set(airData.features.map((f) => f.properties.country)))

      // Randomly assign to 3 clusters
      const clusters = [
        { cluster_id: 0, label: "Low Pollution", members: [] as string[] },
        { cluster_id: 1, label: "Moderate", members: [] as string[] },
        { cluster_id: 2, label: "High Risk", members: [] as string[] },
      ]

      countries.forEach((country) => {
        const clusterIdx = Math.floor(Math.random() * 3)
        clusters[clusterIdx].members.push(country)
      })

      const response: AgentResponse = {
        status: "ok",
        action: "cluster",
        text: `Found 3 clusters based on air quality indicators: ${clusters[0].members.length} regions with low pollution, ${clusters[1].members.length} with moderate levels, and ${clusters[2].members.length} at high risk.`,
        payload: {
          clusters,
        },
        chartData: {
          clustersCount: clusters.map((c) => c.members.length),
        },
      }

      return NextResponse.json(response)
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error) {
    console.error("[v0] ML Agent API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
