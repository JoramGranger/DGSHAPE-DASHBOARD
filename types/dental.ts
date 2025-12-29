export interface DailyData {
  start_date: string
  total_sessions: number
  total_duration_minutes: number
  avg_duration_minutes: number
  completed_sessions: number
  material_types: number
  success_rate: number
  utilization_hours: number
  total_jobs: number
}

export interface JobSession {
  session_id: number
  session_start: string
  start_date: string
  start_hour: number
  material_type: string | null
  material_color: string | null
  status: 'Completed' | 'Incomplete' | 'In Progress'
  duration_minutes?: number
  job_count: number
}

export interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: number
  icon?: React.ReactNode
  className?: string
}

export interface ChartData {
  date: string
  jobs: number
  success_rate: number
  utilization: number
}

export type TimeRange = 'daily' | 'weekly' | 'monthly' | 'yearly'