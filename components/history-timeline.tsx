"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface SkyData {
  timestamp: string
  stats: {
    hex_color: string
    greyness: {
      berlin_grey_index: number
    }
    dominant_color: string
  }
}

interface HistoryTimelineProps {
  historyData: SkyData[]
  selectedIndex: number
  onSelectIndex: (index: number) => void
}

function parseTimestamp(timestamp: string): Date {
  // Format: "2025-03-16_16-21-35"
  const [datePart, timePart] = timestamp.split("_")
  const [year, month, day] = datePart.split("-").map(Number)
  const [hour, minute, second] = timePart.split("-").map(Number)

  // Month is 0-indexed in JS
  return new Date(year, month - 1, day, hour, minute, second)
}

export default function HistoryTimeline({ historyData, selectedIndex, onSelectIndex }: HistoryTimelineProps) {
  // Reverse the history data to show most recent first
  const reversedData = [...historyData].reverse()
  const [visibleStartIndex, setVisibleStartIndex] = useState(0)
  const maxVisibleItems = 7
  const maxIndex = reversedData.length - 1

  // Convert between reversed and original indices
  const reversedIndex = maxIndex - selectedIndex

  // Format timestamp for display
  const formatTime = (timestamp: string) => {
    const date = parseTimestamp(timestamp)
    return date.toLocaleTimeString("en-DE", { hour: "2-digit", minute: "2-digit" })
  }

  // Add this new format function
  const formatDateTime = (timestamp: string) => {
    const date = parseTimestamp(timestamp)
    return date.toLocaleString("en-DE", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    })
  }

  const handlePrevious = () => {
    if (visibleStartIndex > 0) {
      setVisibleStartIndex(visibleStartIndex - 1)
    }
  }

  const handleNext = () => {
    if (visibleStartIndex < reversedData.length - maxVisibleItems) {
      setVisibleStartIndex(visibleStartIndex + 1)
    }
  }

  const handlePreviousSample = () => {
    if (selectedIndex < maxIndex) {
      onSelectIndex(selectedIndex + 1)

      // Adjust visible window based on reversed index
      const newReversedIndex = maxIndex - (selectedIndex + 1)
      if (newReversedIndex >= visibleStartIndex + maxVisibleItems) {
        setVisibleStartIndex(newReversedIndex - maxVisibleItems + 1)
      }
    }
  }

  const handleNextSample = () => {
    if (selectedIndex > 0) {
      onSelectIndex(selectedIndex - 1)

      // Adjust visible window based on reversed index
      const newReversedIndex = maxIndex - (selectedIndex - 1)
      if (newReversedIndex < visibleStartIndex) {
        setVisibleStartIndex(newReversedIndex)
      }
    }
  }

  const visibleData = reversedData.slice(visibleStartIndex, visibleStartIndex + maxVisibleItems)

  return (
    <Card className="mb-4 border-none md:max-w-3xl mx-auto shadow-md bg-background/80 backdrop-blur-sm">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePreviousSample}
            disabled={selectedIndex === maxIndex}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Older
          </Button>
          <div className="text-center bg-muted/30 px-3 py-1 rounded-full">
            <span className="text-sm font-medium">
              {formatDateTime(reversedData[reversedIndex].timestamp)}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextSample}
            disabled={selectedIndex === 0}
            className="gap-1"
          >
            Newer
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={handlePrevious}
            disabled={visibleStartIndex === 0}
            className="shrink-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="flex-1 flex justify-between gap-1">
            {visibleData.map((item, index) => {
              const actualIndex = maxIndex - (visibleStartIndex + index)
              return (
                <div
                  key={item.timestamp}
                  className={`flex flex-col items-center cursor-pointer transition-all ${actualIndex === selectedIndex
                    ? "scale-110 opacity-100"
                    : "opacity-60 hover:opacity-90 hover:scale-105"
                    }`}
                  onClick={() => onSelectIndex(actualIndex)}
                >
                  <div
                    className={`w-10 h-10 rounded-full border-2 shadow-md transition-transform ${actualIndex === selectedIndex ? "border-primary" : "border-transparent"
                      }`}
                    style={{ backgroundColor: item.stats.hex_color }}
                  />
                  <div className="text-xs font-medium mt-1.5 whitespace-nowrap">{formatTime(item.timestamp)}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-0.5">
                    <span className="capitalize">{item.stats.dominant_color}</span>
                    <span className="mx-0.5">•</span>
                    <span>{item.stats.greyness.berlin_grey_index.toFixed(0)}%</span>
                  </div>
                </div>
              )
            })}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleNext}
            disabled={visibleStartIndex >= reversedData.length - maxVisibleItems}
            className="shrink-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

