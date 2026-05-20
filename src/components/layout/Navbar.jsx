import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuth } from '../../context/useAuth'

const pageTitles = {
  '/': 'Dashboard',
  '/conversions': 'All Conversions',
  '/conversions/pending': 'Pending Conversions',
  '/exchange-rate': 'Exchange Rate',
  '/agents': 'Agents',
  '/audit-logs': 'Audit Logs',
  '/chat': 'Support Chat',
  '/reconciliation': 'Reconciliation',
  '/notifications': 'Send Notification',
}

export default function Navbar({ onMenuToggle }) {
  const { user, logout } = useAuth()
  const { pathname } = useLocation()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const initials = user?.fullName
    ? user.fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'AD'

  const pageTitle = pageTitles[pathname] ?? (pathname.startsWith('/reconciliation') ? 'Reconciliation' : '')

  return (
    <header className="h-16 bg-jade-800 border-b border-jade-700/15 flex items-center px-4 md:px-6 gap-4 shrink-0">
      {/* Mobile menu button */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-2 rounded-xl text-jade-warm hover:text-jade-50 hover:bg-jade-700/15 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {/* Page title */}
      <p className="hidden md:block text-sm font-semibold text-jade-50/70">{pageTitle}</p>

      <div className="flex-1" />

      {/* Admin info + logout */}
      <div className="relative">
        <button
          onClick={() => setDropdownOpen((v) => !v)}
          className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-jade-700/15 transition-colors"
        >
          <div className="w-8 h-8 bg-jade-400 rounded-full flex items-center justify-center shrink-0 ring-2 ring-jade-400/20">
            <span className="text-jade-800 font-bold text-xs">{initials}</span>
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-medium text-jade-50 leading-none">{user?.fullName ?? 'Admin'}</p>
            <p className="text-[11px] text-jade-700 mt-0.5 capitalize">{user?.role ?? 'admin'}</p>
          </div>
          <svg className={`w-4 h-4 text-jade-warm transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {dropdownOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setDropdownOpen(false)}
            />
            <div className="absolute right-0 top-full mt-2 w-52 bg-jade-800 border border-jade-700/30 rounded-xl shadow-2xl shadow-black/30 z-20 overflow-hidden animate-dropdown-enter">
              <div className="px-4 py-3.5 border-b border-jade-700/30">
                <p className="text-sm font-medium text-jade-50">{user?.fullName}</p>
                <p className="text-xs text-jade-warm/60 truncate mt-0.5">{user?.email}</p>
              </div>
              <div className="p-1.5">
                <button
                  onClick={() => { setDropdownOpen(false); logout() }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign out
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
