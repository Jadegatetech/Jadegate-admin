import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

export default function Navbar({ onMenuToggle }) {
  const { user, logout } = useAuth()
  const [dropdownOpen, setDropdownOpen] = useState(false)

  const initials = user?.fullName
    ? user.fullName.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'AD'

  return (
    <header className="h-16 bg-jade-800 border-b border-jade-700/20 flex items-center px-4 gap-4 shrink-0">
      {/* Mobile menu button */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-2 rounded-lg text-jade-warm hover:text-jade-50 hover:bg-jade-700/20 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      <div className="flex-1" />

      {/* Admin info + logout */}
      <div className="relative">
        <button
          onClick={() => setDropdownOpen((v) => !v)}
          className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-jade-700/20 transition-colors"
        >
          <div className="w-8 h-8 bg-jade-400 rounded-full flex items-center justify-center shrink-0">
            <span className="text-jade-800 font-bold text-xs">{initials}</span>
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-sm font-medium text-jade-50 leading-none">{user?.fullName ?? 'Admin'}</p>
            <p className="text-xs text-jade-700 mt-0.5">{user?.role ?? 'admin'}</p>
          </div>
          <svg className="w-4 h-4 text-jade-warm" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {dropdownOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setDropdownOpen(false)}
            />
            <div className="absolute right-0 top-full mt-2 w-48 bg-jade-800 border border-jade-700/40 rounded-xl shadow-xl z-20 py-1 overflow-hidden">
              <div className="px-4 py-3 border-b border-jade-700/40">
                <p className="text-sm font-medium text-jade-50">{user?.fullName}</p>
                <p className="text-xs text-jade-warm truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => { setDropdownOpen(false); logout() }}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-400/10 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
