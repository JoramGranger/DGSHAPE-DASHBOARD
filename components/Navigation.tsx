'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BarChart3, Calendar, Home } from 'lucide-react'

export default function Navigation() {
  const pathname = usePathname()
  
  const navItems = [
    {
      href: '/',
      label: 'Dashboard',
      icon: <Home className="w-4 h-4" />,
      active: pathname === '/'
    },
    {
      href: '/jobs',
      label: 'Jobs',
      icon: <Calendar className="w-4 h-4" />,
      active: pathname === '/jobs'
    }
  ]

  return (
    <nav className="dashboard-card p-3 inline-flex space-x-1">
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={`
            flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium
            transition-all duration-200 border
            ${item.active ? 'tab-active' : 'tab-inactive'}
          `}
        >
          {item.icon}
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  )
}