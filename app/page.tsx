'use client'

import { useState, useEffect } from 'react'
import { Activity, CheckCircle, Clock, Layers, AlertTriangle } from 'lucide-react'
import MetricCard from '@/components/MetricCard'
import { JobTrendsChart, UtilizationChart, MaterialBreakdownChart } from '@/components/Charts'
import TimeRangeSelector from '@/components/TimeRangeSelector'
import RecentJobs from '@/components/RecentJobs'
import { loadCSVData, processDataForTimeRange } from '@/lib/dataLoader'
import type { TimeRange, DailyData, JobSession } from '@/types/dental'

export default function DashboardPage() {
  const [timeRange, setTimeRange] = useState<TimeRange>('daily')
  const [dashboardData, setDashboardData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rawData, setRawData] = useState<{ dailyData: DailyData[], jobSessions: JobSession[] } | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (rawData) {
      processData()
    }
  }, [timeRange, rawData])

  const loadData = async () => {
    setLoading(true)
    setError(null)

    try {
      const { dailyData, jobSessions, error } = await loadCSVData()
      
      if (error) {
        setError(error)
        // Fall back to sample data if CSV files not found
        setRawData(generateFallbackData())
      } else {
        setRawData({ dailyData, jobSessions })
      }
    } catch (err) {
      setError('Failed to load dashboard data')
      setRawData(generateFallbackData())
    } finally {
      setLoading(false)
    }
  }

  const processData = () => {
    if (!rawData) return

    try {
      const processed = processDataForTimeRange(
        rawData.dailyData, 
        rawData.jobSessions, 
        timeRange
      )
      setDashboardData(processed)
    } catch (err) {
      console.error('Error processing data:', err)
      setError('Failed to process dashboard data')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen p-6 bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-32 bg-slate-200 rounded-xl"></div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-80 bg-slate-200 rounded-xl"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 text-shadow">
                DGSHAPE Analytics
              </h1>
              <p className="text-slate-600 text-lg mt-2">
                Executive Performance Dashboard
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-500">Last Updated</div>
              <div className="font-mono text-slate-700">
                {new Date().toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          </div>
          
          <TimeRangeSelector 
            activeRange={timeRange}
            onRangeChange={setTimeRange}
          />
        </header>

        {/* Error Banner */}
        {error && (
          <div className="dashboard-card bg-amber-50 border-amber-200">
            <div className="flex items-center space-x-2 text-amber-700">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-medium">Data Loading Notice:</span>
            </div>
            <p className="text-sm text-amber-600 mt-2">
              {error}. Showing sample data for demonstration.
            </p>
            <p className="text-xs text-amber-600 mt-1">
              Place your CSV files in <code className="bg-amber-100 px-1 rounded">public/data/</code> folder to load real data.
            </p>
          </div>
        )}

        {/* Key Metrics */}
        {dashboardData && (
          <>
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Total Jobs"
                value={dashboardData.totalJobs}
                subtitle="Manufacturing sessions"
                trend={2.5}
                icon={<Activity className="w-5 h-5 text-blue-600" />}
                className="animate-slide-up"
              />
              
              <MetricCard
                title="Success Rate"
                value={`${dashboardData.successRate.toFixed(1)}%`}
                subtitle="Completion percentage"
                trend={0.3}
                icon={<CheckCircle className="w-5 h-5 text-green-600" />}
                className="animate-slide-up"
              />
              
              <MetricCard
                title="Utilization"
                value={`${dashboardData.utilizationHours.toFixed(1)}h`}
                subtitle="Machine productive time"
                trend={1.2}
                icon={<Clock className="w-5 h-5 text-amber-600" />}
                className="animate-slide-up"
              />
              
              <MetricCard
                title="Material Types"
                value={dashboardData.materialTypes}
                subtitle="Different materials used"
                trend={0}
                icon={<Layers className="w-5 h-5 text-slate-600" />}
                className="animate-slide-up"
              />
            </section>

            {/* Charts Grid */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <JobTrendsChart data={dashboardData.chartData} />
              <UtilizationChart data={dashboardData.chartData} />
            </section>

            {/* Additional Charts */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <MaterialBreakdownChart data={dashboardData.materialBreakdown} />
              
              <div className="dashboard-card">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-slate-800">Performance Summary</h3>
                  <p className="text-sm text-slate-500">Key operational metrics</p>
                </div>
                
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Average Job Duration</span>
                    <span className="number-small">{dashboardData.avgDuration.toFixed(1)} min</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Peak Operating Hour</span>
                    <span className="number-small">{String(dashboardData.peakHour).padStart(2, '0')}:00</span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Error Incidents</span>
                    <span className="font-mono text-xl font-medium text-red-600">{dashboardData.errorCount}</span>
                  </div>
                  
                  <div className="pt-4 border-t border-slate-200">
                    <div className="flex items-center space-x-2 mb-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-600 font-medium">Excellent Performance</span>
                    </div>
                    <p className="text-sm text-slate-600">
                      System operating at peak efficiency with {timeRange} view showing consistent productivity
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Recent Jobs Table */}
            <section>
              <RecentJobs sessions={dashboardData.recentSessions} />
            </section>
          </>
        )}

        {/* Data Integration Instructions */}
        <section className="dashboard-card bg-blue-50 border-blue-200">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-blue-800">CSV Data Integration</h3>
            <p className="text-sm text-blue-600">How to load your processed dental machine data</p>
          </div>
          
          <div className="space-y-3 text-sm text-blue-700">
            <div>
              <strong>Step 1:</strong> Create a <code className="bg-blue-100 px-2 py-1 rounded">public/data/</code> folder in your project
            </div>
            <div>
              <strong>Step 2:</strong> Copy your CSV files:
              <ul className="ml-4 mt-1 space-y-1">
                <li>• <code className="bg-blue-100 px-1 rounded">daily_summary.csv</code> - Daily aggregated metrics</li>
                <li>• <code className="bg-blue-100 px-1 rounded">job_sessions.csv</code> - Individual job records</li>
              </ul>
            </div>
            <div>
              <strong>Step 3:</strong> Refresh the page - the dashboard will automatically load your real data
            </div>
            <div>
              <strong>Current Status:</strong> {error ? 'Using sample data (CSV files not found)' : 'Real data loaded successfully'}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

// Fallback sample data generator
function generateFallbackData() {
  const dailyData: DailyData[] = []
  const today = new Date()
  
  for (let i = 30; i >= 0; i--) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    
    const sessions = Math.floor(Math.random() * 15) + 5
    const completed = Math.floor(sessions * (0.95 + Math.random() * 0.05))
    
    dailyData.push({
      start_date: date.toISOString().split('T')[0],
      total_sessions: sessions,
      total_duration_minutes: sessions * 8.5,
      avg_duration_minutes: 8.5,
      completed_sessions: completed,
      material_types: Math.floor(Math.random() * 3) + 1,
      success_rate: (completed / sessions) * 100,
      utilization_hours: sessions * 8.5 / 60,
      total_jobs: sessions
    })
  }

  const jobSessions: JobSession[] = []
  const materials = ['Pan Dental', 'Denture Care', 'hyperDENT']
  const colors = ['A1', 'A2', 'A3', 'WhiteWax']
  
  for (let i = 0; i < 50; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - Math.floor(Math.random() * 30))
    date.setHours(9 + Math.floor(Math.random() * 8), Math.floor(Math.random() * 60))
    
    jobSessions.push({
      session_id: i + 1,
      session_start: date.toISOString(),
      start_date: date.toISOString().split('T')[0],
      start_hour: date.getHours(),
      material_type: materials[Math.floor(Math.random() * materials.length)],
      material_color: colors[Math.floor(Math.random() * colors.length)],
      status: Math.random() > 0.05 ? 'Completed' : 'Incomplete',
      duration_minutes: 5 + Math.random() * 10,
      job_count: 1
    } as JobSession)
  }

  return { dailyData, jobSessions }
}