import type { AgentRequest, AgentResponse } from "@/types/air-quality"

export async function callMLAgent(request: AgentRequest): Promise<AgentResponse> {
  const response = await fetch("/api/mock/agent", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  })

  if (!response.ok) {
    throw new Error("Failed to call ML agent")
  }

  return response.json()
}
