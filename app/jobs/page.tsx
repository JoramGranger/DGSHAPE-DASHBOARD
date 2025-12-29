'use client'

import { useState, useEffect, useMemo } from 'react'
import { Calendar, Clock, Search, Filter, ChevronLeft, ChevronRight, Download, FileText } from 'lucide-react'
import { format, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear, isWithinInterval } from 'date-fns'
import { loadCSVData } from '@/lib/dataLoader'
import type { JobSession } from '@/types/dental'

type FilterType = 'date' | 'week' | 'month' | 'year'
type SortField = 'session_start' | 'material_type' | 'status' | 'duration_minutes'
type SortDirection = 'asc' | 'desc'

interface JobFilters {
  type: FilterType
  date: string
  materialType: string
  status: string
  search: string
}

const ITEMS_PER_PAGE = 25

export default function JobsPage() {
  const [jobs, setJobs] = useState<JobSession[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [sortField, setSortField] = useState<SortField>('session_start')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  
  const [filters, setFilters] = useState<JobFilters>({
    type: 'date',
    date: new Date().toISOString().split('T')[0], // Today
    materialType: '',
    status: '',
    search: ''
  })

  useEffect(() => {
    loadJobs()
  }, [])

  const loadJobs = async () => {
    setLoading(true)
    try {
      const { jobSessions, error } = await loadCSVData()
      if (error) {
        // Use fallback data if CSV not found
        setJobs(generateFallbackJobs())
      } else {
        setJobs(jobSessions)
      }
    } catch (err) {
      setJobs(generateFallbackJobs())
    } finally {
      setLoading(false)
    }
  }

  // Filter and sort jobs
  const filteredAndSortedJobs = useMemo(() => {
    let filtered = jobs

    // Date/time filtering
    if (filters.date) {
      const filterDate = parseISO(filters.date)
      filtered = filtered.filter(job => {
        const jobDate = parseISO(job.start_date)
        
        switch (filters.type) {
          case 'date':
            return format(jobDate, 'yyyy-MM-dd') === filters.date
          case 'week':
            return isWithinInterval(jobDate, {
              start: startOfWeek(filterDate),
              end: endOfWeek(filterDate)
            })
          case 'month':
            return isWithinInterval(jobDate, {
              start: startOfMonth(filterDate),
              end: endOfMonth(filterDate)
            })
          case 'year':
            return isWithinInterval(jobDate, {
              start: startOfYear(filterDate),
              end: endOfYear(filterDate)
            })
          default:
            return true
        }
      })
    }

    // Material type filtering
    if (filters.materialType) {
      filtered = filtered.filter(job => 
        job.material_type?.toLowerCase().includes(filters.materialType.toLowerCase())
      )
    }

    // Status filtering
    if (filters.status) {
      filtered = filtered.filter(job => job.status === filters.status)
    }

    // Search filtering
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      filtered = filtered.filter(job =>
        job.material_type?.toLowerCase().includes(searchLower) ||
        job.material_color?.toLowerCase().includes(searchLower) ||
        job.status.toLowerCase().includes(searchLower) ||
        job.session_id.toString().includes(searchLower)
      )
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue: any = a[sortField]
      let bValue: any = b[sortField]

      if (sortField === 'session_start') {
        aValue = new Date(a.session_start || a.start_date).getTime()
        bValue = new Date(b.session_start || b.start_date).getTime()
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return filtered
  }, [jobs, filters, sortField, sortDirection])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedJobs.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const currentJobs = filteredAndSortedJobs.slice(startIndex, endIndex)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
    setCurrentPage(1)
  }

  const handleFilterChange = (key: keyof JobFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1)
  }

  const resetFilters = () => {
    setFilters({
      type: 'date',
      date: new Date().toISOString().split('T')[0],
      materialType: '',
      status: '',
      search: ''
    })
    setCurrentPage(1)
  }

  const exportToCSV = () => {
    const headers = ['Session ID', 'Date', 'Time', 'Material Type', 'Material Color', 'Status', 'Duration (min)']
    const csvContent = [
      headers.join(','),
      ...filteredAndSortedJobs.map(job => [
        job.session_id,
        job.start_date,
        format(parseISO(job.session_start || job.start_date), 'HH:mm'),
        job.material_type || '',
        job.material_color || '',
        job.status,
        job.duration_minutes?.toFixed(1) || ''
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `jobs_${filters.type}_${filters.date}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getFilterLabel = () => {
    if (!filters.date) return ''
    const date = parseISO(filters.date)
    
    switch (filters.type) {
      case 'week':
        return `Week of ${format(startOfWeek(date), 'MMM dd, yyyy')}`
      case 'month':
        return format(date, 'MMMM yyyy')
      case 'year':
        return format(date, 'yyyy')
      default:
        return format(date, 'MMM dd, yyyy')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen p-6 bg-gradient-to-br from-slate-50 via-white to-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-slate-200 rounded w-1/4"></div>
            <div className="h-64 bg-slate-200 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-6 bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 text-shadow">
                Job Management
              </h1>
              <p className="text-slate-600 text-lg mt-2">
                Filter and manage dental machine jobs
              </p>
            </div>
            
            <button
              onClick={exportToCSV}
              className="btn-primary flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
          </div>
        </header>

        {/* Filters */}
        <div className="dashboard-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-800 flex items-center space-x-2">
              <Filter className="w-5 h-5" />
              <span>Filters</span>
            </h3>
            <button
              onClick={resetFilters}
              className="text-sm text-slate-500 hover:text-slate-700"
            >
              Reset Filters
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Filter Type */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                Filter By
              </label>
              <select
                value={filters.type}
                onChange={(e) => handleFilterChange('type', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="date">Specific Date</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
                <option value="year">Year</option>
              </select>
            </div>

            {/* Date Picker */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                {filters.type === 'date' ? 'Date' : 
                 filters.type === 'week' ? 'Week of' :
                 filters.type === 'month' ? 'Month' : 'Year'}
              </label>
              <input
                type="date"
                value={filters.date}
                onChange={(e) => handleFilterChange('date', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Material Type Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                Material Type
              </label>
              <select
                value={filters.materialType}
                onChange={(e) => handleFilterChange('materialType', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Materials</option>
                <option value="Pan Dental">Pan Dental</option>
                <option value="Denture Care">Denture Care</option>
                <option value="hyperDENT">hyperDENT</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Status</option>
                <option value="Completed">Completed</option>
                <option value="Incomplete">Incomplete</option>
                <option value="In Progress">In Progress</option>
              </select>
            </div>

            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-1">
                Search
              </label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange('search', e.target.value)}
                  placeholder="Search jobs..."
                  className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Active Filter Display */}
          {(filters.date || filters.materialType || filters.status || filters.search) && (
            <div className="flex items-center space-x-2 text-sm text-slate-600">
              <span>Showing jobs for:</span>
              <span className="material-badge">{getFilterLabel()}</span>
              {filters.materialType && (
                <span className="material-badge">{filters.materialType}</span>
              )}
              {filters.status && (
                <span className="success-badge">{filters.status}</span>
              )}
              {filters.search && (
                <span className="error-badge">"{filters.search}"</span>
              )}
            </div>
          )}
        </div>

        {/* Results Summary */}
        <div className="flex items-center justify-between text-sm text-slate-600">
          <span>
            Showing {startIndex + 1}-{Math.min(endIndex, filteredAndSortedJobs.length)} of {filteredAndSortedJobs.length} jobs
          </span>
          <span>
            Page {currentPage} of {totalPages}
          </span>
        </div>

        {/* Jobs Table */}
        <div className="dashboard-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th 
                    className="text-left py-3 px-4 text-sm font-medium text-slate-600 uppercase cursor-pointer hover:bg-slate-50"
                    onClick={() => handleSort('session_start')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Date & Time</span>
                      {sortField === 'session_start' && (
                        <span className="text-blue-600">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 uppercase">
                    Session ID
                  </th>
                  <th 
                    className="text-left py-3 px-4 text-sm font-medium text-slate-600 uppercase cursor-pointer hover:bg-slate-50"
                    onClick={() => handleSort('material_type')}
                  >
                    <div className="flex items-center space-x-1">
                      <span>Material</span>
                      {sortField === 'material_type' && (
                        <span className="text-blue-600">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-600 uppercase">
                    Color/Shade
                  </th>
                  <th 
                    className="text-right py-3 px-4 text-sm font-medium text-slate-600 uppercase cursor-pointer hover:bg-slate-50"
                    onClick={() => handleSort('duration_minutes')}
                  >
                    <div className="flex items-center justify-end space-x-1">
                      <span>Duration</span>
                      {sortField === 'duration_minutes' && (
                        <span className="text-blue-600">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th 
                    className="text-center py-3 px-4 text-sm font-medium text-slate-600 uppercase cursor-pointer hover:bg-slate-50"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center justify-center space-x-1">
                      <span>Status</span>
                      {sortField === 'status' && (
                        <span className="text-blue-600">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {currentJobs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12">
                      <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-slate-500">No jobs found matching your filters</p>
                    </td>
                  </tr>
                ) : (
                  currentJobs.map((job) => (
                    <tr 
                      key={job.session_id}
                      className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-4 px-4">
                        <div className="text-sm">
                          <div className="font-medium text-slate-900">
                            {format(parseISO(job.start_date), 'MMM dd, yyyy')}
                          </div>
                          <div className="font-mono text-slate-600">
                            {format(parseISO(job.session_start || job.start_date), 'HH:mm')}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-mono text-sm text-slate-800">
                        #{job.session_id}
                      </td>
                      <td className="py-4 px-4">
                        {job.material_type ? (
                          <span className="material-badge">
                            {job.material_type}
                          </span>
                        ) : (
                          <span className="text-slate-400">Unknown</span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-sm text-slate-700">
                        {job.material_color || 'N/A'}
                      </td>
                      <td className="py-4 px-4 text-right font-mono text-sm text-slate-800">
                        {job.duration_minutes ? `${job.duration_minutes.toFixed(1)} min` : 'N/A'}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={
                          job.status === 'Completed' ? 'success-badge' :
                          job.status === 'Incomplete' ? 'error-badge' :
                          'material-badge'
                        }>
                          {job.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between dashboard-card">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-slate-600 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <div className="flex items-center space-x-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3 py-2 text-sm rounded-lg ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-slate-600 hover:text-slate-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// Fallback sample data
function generateFallbackJobs(): JobSession[] {
  const jobs: JobSession[] = []
  const materials = ['Pan Dental', 'Denture Care', 'hyperDENT']
  const colors = ['A1', 'A2', 'A3', 'A4', 'WhiteWax']
  const statuses: ('Completed' | 'Incomplete' | 'In Progress')[] = ['Completed', 'Incomplete', 'In Progress']
  
  for (let i = 1; i <= 100; i++) {
    const date = new Date()
    date.setDate(date.getDate() - Math.floor(Math.random() * 90)) // Last 90 days
    date.setHours(8 + Math.floor(Math.random() * 10), Math.floor(Math.random() * 60))
    
    jobs.push({
      session_id: 1000 + i,
      session_start: date.toISOString(),
      start_date: date.toISOString().split('T')[0],
      start_hour: date.getHours(),
      material_type: materials[Math.floor(Math.random() * materials.length)],
      material_color: colors[Math.floor(Math.random() * colors.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      duration_minutes: 5 + Math.random() * 25,
      job_count: 1
    })
  }
  
  return jobs.sort((a, b) => 
    new Date(b.session_start).getTime() - new Date(a.session_start).getTime()
  )
}