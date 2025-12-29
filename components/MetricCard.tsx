'use client'

import { TrendingUp, TrendingDown } from 'lucide-react'
import type { MetricCardProps } from '@/types/dental'

export default function MetricCard({ 
  title, 
  value, 
  subtitle, 
  trend, 
  icon, 
  className = '' 
}: MetricCardProps) {
  
  const formatTrend = (trend: number) => {
    const sign = trend > 0 ? '+' : ''
    return `${sign}${trend.toFixed(1)}%`
  }

  const getTrendColor = (trend: number) => {
    if (trend > 0) return 'text-green-600'
    if (trend < 0) return 'text-red-600'
    return 'text-slate-400'
  }

  return (
    <div className={`metric-card ${className}`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          {icon && (
            <div className="p-2 bg-slate-100 rounded-lg">
              {icon}
            </div>
          )}
          <h3 className="text-sm font-medium text-slate-600 uppercase tracking-wide">
            {title}
          </h3>
        </div>
        
        {trend !== undefined && trend !== 0 && (
          <div className={`flex items-center space-x-1 ${getTrendColor(trend)}`}>
            {trend > 0 ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            <span className="text-xs font-medium">
              {formatTrend(trend)}
            </span>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="number-large">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </div>
        
        {subtitle && (
          <p className="text-sm text-slate-500">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  )
}