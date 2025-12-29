'use client'

import { Calendar, Clock, BarChart3, TrendingUp } from 'lucide-react'
import type { TimeRange } from '@/types/dental'

interface TimeRangeSelectorProps {
  activeRange: TimeRange
  onRangeChange: (range: TimeRange) => void
}

export default function TimeRangeSelector({ activeRange, onRangeChange }: TimeRangeSelectorProps) {
  
  const ranges: { key: TimeRange; label: string; icon: React.ReactNode }[] = [
    { key: 'daily', label: 'Daily', icon: <Clock className="w-4 h-4" /> },
    { key: 'weekly', label: 'Weekly', icon: <Calendar className="w-4 h-4" /> },
    { key: 'monthly', label: 'Monthly', icon: <BarChart3 className="w-4 h-4" /> },
    { key: 'yearly', label: 'Yearly', icon: <TrendingUp className="w-4 h-4" /> }
  ]

  return (
    <div className="dashboard-card p-2 inline-flex space-x-1">
      {ranges.map((range) => (
        <button
          key={range.key}
          onClick={() => onRangeChange(range.key)}
          className={`
            flex items-center space-x-2 px-4 py-2 rounded-lg text-sm
            transition-all duration-200 border
            ${activeRange === range.key ? 'tab-active' : 'tab-inactive'}
          `}
        >
          {range.icon}
          <span>{range.label}</span>
        </button>
      ))}
    </div>
  )
}