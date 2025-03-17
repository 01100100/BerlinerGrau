"use client"

import { getMetricDescription, calculateColorfulness, calculateChroma, getColorfulnessDescription } from "@/lib/utils"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Cloud, Info, Thermometer } from "lucide-react"
import ColorGrid from "@/components/color-grid"
import ColorDistribution from "@/components/color-distribution"
import HistoryTimeline from "@/components/history-timeline"

interface GreynessData {
  avg_greyness_level: number
  grey_percentage: number
  berlin_grey_index: number
  description: string
}

interface ColorDistributionData {
  [key: string]: number
}

interface Stats {
  average_rgb: [number, number, number]
  hex_color: string
  dominant_color: string
  brightness_percent: number
  color_variety: number
  hsv: number[]
  mood: string
  greyness: GreynessData
  color_distribution: ColorDistributionData
  temperature_feel: string
  time_of_day_feel: string
  colorfulness?: number  // New optional property
  chroma?: number       // New optional property
}

interface SkyData {
  timestamp: string
  grid: number[][][]
  stats: Stats
}

// Helper function to parse timestamp
function parseTimestamp(timestamp: string): Date {
  // Format: "2025-03-16_16-21-35"
  const [datePart, timePart] = timestamp.split("_")
  const [year, month, day] = datePart.split("-").map(Number)
  const [hour, minute, second] = timePart.split("-").map(Number)

  // Month is 0-indexed in JavaScript Date
  return new Date(year, month - 1, day, hour, minute, second)
}

export default function Home() {
  const [currentData, setCurrentData] = useState<SkyData | null>(null)
  const [historyData, setHistoryData] = useState<SkyData[]>([])
  const [selectedHistoryIndex, setSelectedHistoryIndex] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("current")

  useEffect(() => {
    async function fetchData() {
      try {
        // Fetch current data
        const currentResponse = await fetch(
          "https://raw.githubusercontent.com/01100100/BerlinerGrau/refs/heads/main/public/data/current.json",
        )
        const currentData = await currentResponse.json()
        setCurrentData(currentData)

        // Fetch history data
        const historyResponse = await fetch(
          "https://raw.githubusercontent.com/01100100/BerlinerGrau/refs/heads/main/public/data/history.json",
        )
        const historyData = await historyResponse.json()
        setHistoryData(historyData)
      } catch (error) {
        console.error("Error fetching sky data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h1 className="text-muted-foreground">Gathering the greyness... ⛅️</h1>
        </div>
      </div>
    )
  }

  if (!currentData) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
          <h2 className="mt-4 text-2xl font-semibold">Failed to load data</h2>
          <p className="text-muted-foreground">Please try again later</p>
        </div>
      </div>
    )
  }

  // Get the active data based on the selected tab
  const activeData = activeTab === "current" ? currentData : historyData[selectedHistoryIndex] || currentData

  // Format timestamp for display
  const timestamp = parseTimestamp(activeData.timestamp)
  const formattedDate = timestamp.toLocaleDateString("en-DE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
  const formattedTime = timestamp.toLocaleTimeString("en-DE", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <main className="container mx-auto py-8 px-4">
        <div className="mb-2 text-center">
          <h1 className="text-4xl font-bold mb-2">Berliner Grau 🎨</h1>
          <p className="text-m text-muted-foreground">Quantifying the seasonal greyness of Berlin</p>
        </div>

        <Tabs defaultValue="current" value={activeTab} onValueChange={setActiveTab} className="mb-2">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="current">Now</TabsTrigger>
            <TabsTrigger value="history">Historical Archive</TabsTrigger>
          </TabsList>

          <TabsContent value="current">
          </TabsContent>

          <TabsContent value="history">
            {historyData.length > 0 && (
              <HistoryTimeline
                historyData={historyData}
                selectedIndex={selectedHistoryIndex}
                onSelectIndex={setSelectedHistoryIndex}
              />
            )}
          </TabsContent>
        </Tabs>

        {/* Main color sample card */}
        <Card className="mb-4 overflow-hidden border-2 w-full md:max-w-3xl mx-auto" style={{ borderColor: activeData.stats.hex_color }}>
          <CardHeader className="pb-2">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div>
                <CardTitle className="text-2xl">
                  {activeTab === "current" ? "Neukölln Skyline" : "Historic Neukölln"}
                </CardTitle>
                <CardDescription>
                  {formattedDate} @ {formattedTime}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full">
                <div className="w-6 h-6 rounded-full border" style={{ backgroundColor: activeData.stats.hex_color }} />
                <span className="font-mono text-sm">{activeData.stats.hex_color}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="mx-auto">
            <div className="flex flex-col gap-6">
              <div className="mx-auto">
                <ColorGrid grid={activeData.grid} />
              </div>
              <div className="w-full space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">BGI -- Berlin Grey Index</h3>
                    <span className="text-lg font-bold">{activeData.stats.greyness.berlin_grey_index.toFixed(1)}%</span>
                  </div>
                  <Progress value={activeData.stats.greyness.berlin_grey_index} className="h-3 rounded-full" />
                  <p className="text-sm text-muted-foreground mt-2 italic">"{activeData.stats.greyness.description}"</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-sm text-muted-foreground">Dominant Color</p>
                    <p className="text-lg font-medium capitalize">{activeData.stats.dominant_color}</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-sm text-muted-foreground">Mood</p>
                    <p className="text-lg font-medium capitalize">{activeData.stats.mood}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="flex items-center gap-1 px-3 py-1">
                    <Cloud className="h-3.5 w-3.5" />
                    {activeData.stats.time_of_day_feel}
                  </Badge>
                  <Badge variant="secondary" className="flex items-center gap-1 px-3 py-1">
                    <Thermometer className="h-3.5 w-3.5" />
                    {activeData.stats.temperature_feel}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Metrics grid */}
        <div className="grid gap-6 md:grid-cols-2 w-full md:max-w-3xl mx-auto">
          <Card>
            <CardContent className="pt-6">
              <ColorDistribution
                distribution={activeData.stats.color_distribution}
              />
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="space-y-6">
                {/* Brightness and Saturation metrics */}
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium">Brightness</span>
                      <span className="text-sm font-mono">{activeData.stats.brightness_percent.toFixed(1)}%</span>
                    </div>
                    <Progress value={activeData.stats.brightness_percent} className="h-2.5 bg-muted/50 [&>div]:bg-yellow-500/80" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {getMetricDescription(activeData.stats.brightness_percent, 'brightness')}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium">Color Saturation</span>
                      <span className="text-sm font-mono">{activeData.stats.hsv[1].toFixed(1)}%</span>
                    </div>
                    <Progress value={activeData.stats.hsv[1]} className="h-2.5 bg-muted/50 [&>div]:bg-violet-500/80" />
                    <p className="text-xs text-muted-foreground mt-1">
                      {getMetricDescription(activeData.stats.hsv[1], 'saturation')}
                    </p>
                  </div>
                </div>

                {/* Colorfulness and Chroma metrics */}
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium">Colorfulness</span>
                      <span className="text-sm font-mono">
                        {(activeData.stats.colorfulness || calculateColorfulness(
                          activeData.stats.average_rgb[0], activeData.stats.average_rgb[1], activeData.stats.average_rgb[2]
                        )).toFixed(1)}
                      </span>
                    </div>
                    <Progress
                      value={activeData.stats.colorfulness || calculateColorfulness(activeData.stats.average_rgb[0], activeData.stats.average_rgb[1], activeData.stats.average_rgb[2])}
                      className="h-2.5 bg-muted/50 [&>div]:bg-teal-500/80"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {getColorfulnessDescription(activeData.stats.colorfulness ||
                        calculateColorfulness(activeData.stats.average_rgb[0], activeData.stats.average_rgb[1], activeData.stats.average_rgb[2]))}
                    </p>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium">Chroma</span>
                      <span className="text-sm font-mono">
                        {(activeData.stats.chroma || calculateChroma(
                          ...activeData.stats.average_rgb
                        )).toFixed(1)}
                      </span>
                    </div>
                    <Progress
                      value={activeData.stats.chroma || calculateChroma(...activeData.stats.average_rgb)}
                      className="h-2.5 bg-muted/50 [&>div]:bg-cyan-500/80"
                    />
                  </div>
                </div>

                {/* HSV Values */}
                <div>
                  <p className="text-sm font-medium mb-2">HSV Values</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-muted/50 rounded-lg p-2 text-center">
                      <p className="text-xs text-muted-foreground">Hue</p>
                      <p className="font-medium">{activeData.stats.hsv[0]}°</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-2 text-center">
                      <p className="text-xs text-muted-foreground">Saturation</p>
                      <p className="font-medium">{activeData.stats.hsv[1]}%</p>
                    </div>
                    <div className="bg-muted/50 rounded-lg p-2 text-center">
                      <p className="text-xs text-muted-foreground">Value</p>
                      <p className="font-medium">{activeData.stats.hsv[2]}%</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p className="flex items-center justify-center gap-1">
            <Info className="h-3.5 w-3.5" />
            Captured by a Raspberry Pi camera through a window in Berlin 🌤️
          </p>
        </div>
      </main>
    </div>
  )
}

