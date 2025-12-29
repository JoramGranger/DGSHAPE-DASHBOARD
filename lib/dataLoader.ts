import { format, startOfWeek, startOfMonth, startOfYear, parseISO, isWithinInterval, subDays, subWeeks, subMonths, subYears } from 'date-fns'
import type { DailyData, JobSession, ChartData, TimeRange } from '@/types/dental'

// CSV parsing functions
export function parseCSV(csvText: string): string[][] {
  const lines = csvText.trim().split('\n')
  return lines.map(line => {
    // Simple CSV parsing - handles basic comma separation
    const values = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    values.push(current.trim())
    return values
  })
}

export function parseDailyData(csvText: string): DailyData[] {
  const rows = parseCSV(csvText)
  const headers = rows[0]
  
  return rows.slice(1).map(row => {
    const obj: any = {}
    headers.forEach((header, index) => {
      const cleanHeader = header.trim()
      const value = row[index]?.trim() || ''
      
      if (cleanHeader === 'start_date') {
        obj[cleanHeader] = value
      } else if (['total_sessions', 'completed_sessions', 'material_types', 'total_jobs'].includes(cleanHeader)) {
        obj[cleanHeader] = parseInt(value) || 0
      } else if (['total_duration_minutes', 'avg_duration_minutes', 'success_rate', 'utilization_hours'].includes(cleanHeader)) {
        obj[cleanHeader] = parseFloat(value) || 0
      }
    })
    return obj as DailyData
  })
}

export function parseJobSessions(csvText: string): JobSession[] {
  const rows = parseCSV(csvText)
  const headers = rows[0]
  
  return rows.slice(1).map(row => {
    const obj: any = {}
    headers.forEach((header, index) => {
      const cleanHeader = header.trim()
      const value = row[index]?.trim() || ''
      
      if (['session_id', 'start_hour', 'job_count'].includes(cleanHeader)) {
        obj[cleanHeader] = parseInt(value) || 0
      } else if (['duration_minutes'].includes(cleanHeader)) {
        obj[cleanHeader] = parseFloat(value) || 0
      } else {
        obj[cleanHeader] = value
      }
    })
    return obj as JobSession
  })
}

// Data processing for different time ranges
export function processDataForTimeRange(
  dailyData: DailyData[], 
  sessions: JobSession[], 
  timeRange: TimeRange
) {
  const now = new Date()
  let startDate: Date
  let groupBy: (date: Date) => string

  switch (timeRange) {
    case 'daily':
      startDate = subDays(now, 30)
      groupBy = (date) => format(date, 'MMM dd')
      break
    case 'weekly':
      startDate = subWeeks(now, 12)
      groupBy = (date) => format(startOfWeek(date), 'MMM dd')
      break
    case 'monthly':
      startDate = subMonths(now, 12)
      groupBy = (date) => format(startOfMonth(date), 'MMM yyyy')
      break
    case 'yearly':
      startDate = subYears(now, 5)
      groupBy = (date) => format(startOfYear(date), 'yyyy')
      break
  }

  // Filter data for time range
  const filteredDaily = dailyData.filter(item => {
    try {
      const itemDate = parseISO(item.start_date)
      return isWithinInterval(itemDate, { start: startDate, end: now })
    } catch {
      return false
    }
  })

  const filteredSessions = sessions.filter(session => {
    try {
      const sessionDate = parseISO(session.start_date)
      return isWithinInterval(sessionDate, { start: startDate, end: now })
    } catch {
      return false
    }
  })

  // Group data by time period
  const groupedData = groupDataByPeriod(filteredDaily, groupBy)
  
  // Calculate summary metrics
  const totalJobs = filteredSessions.length
  const completedJobs = filteredSessions.filter(s => s.status === 'Completed').length
  const successRate = totalJobs > 0 ? (completedJobs / totalJobs) * 100 : 0
  const totalUtilization = filteredDaily.reduce((sum, item) => sum + (item.utilization_hours || 0), 0)
  
  // Material breakdown
  const materialCounts = new Map<string, number>()
  filteredSessions.forEach(session => {
    if (session.material_type) {
      const current = materialCounts.get(session.material_type) || 0
      materialCounts.set(session.material_type, current + 1)
    }
  })

  const materialBreakdown = Array.from(materialCounts.entries())
    .map(([material, count]) => ({
      material,
      count,
      color: getMaterialColor(material)
    }))
    .sort((a, b) => b.count - a.count)

  // Recent sessions
  const recentSessions = filteredSessions
    .sort((a, b) => new Date(b.session_start || b.start_date).getTime() - new Date(a.session_start || a.start_date).getTime())
    .slice(0, 10)

  // Calculate additional metrics
  const totalDuration = filteredSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0)
  const avgDuration = totalJobs > 0 ? totalDuration / totalJobs : 0
  
  const errorCount = filteredSessions.filter(s => s.status === 'Incomplete').length
  const materialTypes = materialCounts.size

  // Peak hour calculation
  const hourCounts = new Map<number, number>()
  filteredSessions.forEach(session => {
    if (session.start_hour !== undefined) {
      const current = hourCounts.get(session.start_hour) || 0
      hourCounts.set(session.start_hour, current + 1)
    }
  })
  
  const peakHour = Array.from(hourCounts.entries())
    .reduce((max, [hour, count]) => 
      count > (hourCounts.get(max[0]) || 0) ? [hour, count] : max, [9, 0])[0]

  return {
    totalJobs,
    successRate,
    utilizationHours: totalUtilization,
    materialTypes,
    avgDuration,
    peakHour,
    errorCount,
    chartData: groupedData,
    materialBreakdown,
    recentSessions
  }
}

function groupDataByPeriod(data: DailyData[], groupBy: (date: Date) => string): ChartData[] {
  const grouped = new Map<string, DailyData[]>()
  
  data.forEach(item => {
    try {
      const date = parseISO(item.start_date)
      const key = groupBy(date)
      if (!grouped.has(key)) {
        grouped.set(key, [])
      }
      grouped.get(key)!.push(item)
    } catch {
      // Skip invalid dates
    }
  })

  return Array.from(grouped.entries())
    .map(([date, items]) => {
      const totalJobs = items.reduce((sum, item) => sum + (item.total_sessions || 0), 0)
      const totalCompleted = items.reduce((sum, item) => sum + (item.completed_sessions || 0), 0)
      const successRate = totalJobs > 0 ? (totalCompleted / totalJobs) * 100 : 0
      const utilization = items.reduce((sum, item) => sum + (item.utilization_hours || 0), 0)

      return {
        date,
        jobs: totalJobs,
        success_rate: Math.round(successRate * 10) / 10,
        utilization: Math.round(utilization * 10) / 10
      }
    })
    .sort((a, b) => a.date.localeCompare(b.date))
}

function getMaterialColor(material: string): string {
  const colors: Record<string, string> = {
    'Pan Dental': '#3b82f6',
    'Denture Care': '#10b981',
    'hyperDENT': '#f59e0b',
    'Unknown': '#6b7280'
  }
  return colors[material] || colors.Unknown
}

// Load CSV files from public folder
export async function loadCSVData() {
  try {
    // Load daily summary data
    const dailyResponse = await fetch('/data/daily_summary.csv')
    const dailyText = await dailyResponse.text()
    const dailyData = parseDailyData(dailyText)

    // Load job sessions data
    const sessionsResponse = await fetch('/data/job_sessions.csv')
    const sessionsText = await sessionsResponse.text()
    const jobSessions = parseJobSessions(sessionsText)

    return { dailyData, jobSessions, error: null }
  } catch (error) {
    console.error('Error loading CSV data:', error)
    return { dailyData: [], jobSessions: [], error: 'Failed to load data files' }
  }
}