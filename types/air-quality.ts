export interface AirQualityFeature {
  type: "Feature"
  id: string
  properties: {
    name: string
    country: string
    co2: number
    ghg: number
    pm25: number
    ozone: number
    air_pollution_index: number
  }
  geometry: {
    type: "Polygon"
    coordinates: number[][][]
  }
}

export interface AirQualityData {
  type: "FeatureCollection"
  features: AirQualityFeature[]
}

export type LayerType = "co2" | "ghg" | "air_pollution" | "pm25" | "ozone"

export interface AgentRequest {
  action: "predict" | "cluster"
  location: {
    bbox: [number, number, number, number]
    center: [number, number]
  }
  layers: LayerType[]
  context: {
    selectedFeatureIds: string[]
  }
}

export interface PredictResponse {
  status: "ok"
  action: "predict"
  text: string
  payload: {
    predicted_co2_ppm: number
    trend: number[]
    confidence: number
  }
  chartData: {
    x: string[]
    y: number[]
  }
}

export interface ClusterResponse {
  status: "ok"
  action: "cluster"
  text: string
  payload: {
    clusters: Array<{
      cluster_id: number
      label: string
      members: string[]
    }>
  }
  chartData: {
    clustersCount: number[]
  }
}

export type AgentResponse = PredictResponse | ClusterResponse
