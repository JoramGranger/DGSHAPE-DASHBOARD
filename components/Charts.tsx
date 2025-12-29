'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts'
import type { ChartData } from '@/types/dental'

interface JobTrendsChartProps {
  data: ChartData[]
}

export function JobTrendsChart({ data }: JobTrendsChartProps) {
  return (
    <div className="chart-card">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-800">Job Performance Trends</h3>
        <p className="text-sm text-slate-500">Daily job volume and success rate over time</p>
      </div>
      
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis 
            dataKey="date" 
            stroke="#64748b"
            fontSize={12}
            fontFamily="Inter"
          />
          <YAxis 
            yAxisId="jobs"
            orientation="left"
            stroke="#3b82f6"
            fontSize={12}
          />
          <YAxis 
            yAxisId="rate"
            orientation="right"
            stroke="#10b981"
            fontSize={12}
            domain={[95, 100]}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e2e8f0',
              borderRadius: '8px'
            }}
          />
          <Line
            yAxisId="jobs"
            type="monotone"
            dataKey="jobs"
            stroke="#3b82f6"
            strokeWidth={3}
            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
            name="Total Jobs"
          />
          <Line
            yAxisId="rate"
            type="monotone"
            dataKey="success_rate"
            stroke="#10b981"
            strokeWidth={3}
            dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
            name="Success Rate (%)"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

interface UtilizationChartProps {
  data: ChartData[]
}

export function UtilizationChart({ data }: UtilizationChartProps) {
  return (
    <div className="chart-card">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-800">Machine Utilization</h3>
        <p className="text-sm text-slate-500">Productive hours per time period</p>
      </div>
      
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis 
            dataKey="date" 
            stroke="#64748b"
            fontSize={12}
          />
          <YAxis 
            stroke="#64748b"
            fontSize={12}
          />
          <Tooltip 
            formatter={(value: any) => [`${value} hrs`, 'Utilization']}
            contentStyle={{
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              border: '1px solid #e2e8f0',
              borderRadius: '8px'
            }}
          />
          <Bar 
            dataKey="utilization" 
            fill="#f59e0b"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

interface MaterialBreakdownProps {
  data: { material: string; count: number; color: string }[]
}

export function MaterialBreakdownChart({ data }: MaterialBreakdownProps) {
  return (
    <div className="chart-card">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-800">Material Usage</h3>
        <p className="text-sm text-slate-500">Distribution by material type</p>
      </div>
      
      <div className="flex items-center justify-between h-64">
        <ResponsiveContainer width="60%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={80}
              dataKey="count"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        
        <div className="w-40 space-y-3">
          {data.map((item) => (
            <div key={item.material} className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <div>
                <div className="text-sm font-medium text-slate-800">
                  {item.material}
                </div>
                <div className="text-xs text-slate-600">
                  {item.count} jobs
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}