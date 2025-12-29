'use client'

import { CheckCircle, XCircle, Clock } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import type { JobSession } from '@/types/dental'

interface RecentJobsProps {
  sessions: JobSession[]
}

export default function RecentJobs({ sessions }: RecentJobsProps) {
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'Incomplete':
        return <XCircle className="w-4 h-4 text-red-600" />
      default:
        return <Clock className="w-4 h-4 text-amber-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Completed':
        return 'success-badge'
      case 'Incomplete':
        return 'error-badge'
      default:
        return 'material-badge'
    }
  }

  const formatTime = (timestamp: string) => {
    try {
      return format(parseISO(timestamp), 'HH:mm')
    } catch {
      return 'N/A'
    }
  }

  const formatDate = (date: string) => {
    try {
      return format(parseISO(date), 'MMM dd')
    } catch {
      return 'N/A'
    }
  }

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'N/A'
    return `${Math.round(minutes)} min`
  }

  return (
    <div className="dashboard-card">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Recent Job Sessions</h3>
          <p className="text-sm text-slate-500">Latest manufacturing activities</p>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-12">
          <Clock className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">No recent sessions found</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left pb-3 text-sm font-medium text-slate-600 uppercase">Date</th>
                <th className="text-left pb-3 text-sm font-medium text-slate-600 uppercase">Time</th>
                <th className="text-left pb-3 text-sm font-medium text-slate-600 uppercase">Material</th>
                <th className="text-left pb-3 text-sm font-medium text-slate-600 uppercase">Color</th>
                <th className="text-right pb-3 text-sm font-medium text-slate-600 uppercase">Duration</th>
                <th className="text-center pb-3 text-sm font-medium text-slate-600 uppercase">Status</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr 
                  key={session.session_id} 
                  className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  <td className="py-4 text-sm text-slate-800">
                    {formatDate(session.start_date)}
                  </td>
                  <td className="py-4 font-mono text-sm text-slate-700">
                    {formatTime(session.session_start)}
                  </td>
                  <td className="py-4 text-sm">
                    {session.material_type ? (
                      <span className="material-badge">
                        {session.material_type}
                      </span>
                    ) : (
                      <span className="text-slate-400">Unknown</span>
                    )}
                  </td>
                  <td className="py-4 text-sm text-slate-700">
                    {session.material_color || 'N/A'}
                  </td>
                  <td className="py-4 text-right font-mono text-sm text-slate-800">
                    {formatDuration(session.duration_minutes)}
                  </td>
                  <td className="py-4 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      {getStatusIcon(session.status)}
                      <span className={getStatusBadge(session.status)}>
                        {session.status}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}