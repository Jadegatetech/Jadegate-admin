import { NavLink } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { getPendingConversions } from '../../api/conversions'
import { getSessions } from '../../api/chat'
import { useAuth } from '../../context/useAuth'
import jadeLogo from '../../assets/Jade 1.1.png'

const navItems = [
  {
    to: '/',
    exact: true,
    label: 'Dashboard',
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    to: '/conversions',
    label: 'All Conversions',
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
  },
  {
    to: '/conversions/pending',
    label: 'Pending',
    badge: true,
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    to: '/exchange-rate',
    label: 'Exchange Rate',
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  {
    to: '/agents',
    label: 'Agents',
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    to: '/audit-logs',
    label: 'Audit Logs',
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    to: '/reconciliation',
    label: 'Reconciliation',
    adminOnly: true,
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 17v-6m4 6V7m4 10v-4M5 21h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    to: '/notifications',
    label: 'Notifications',
    adminOnly: true,
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
  },
  {
    to: '/chat',
    label: 'Support Chat',
    chatBadge: true,
    icon: (
      <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
    ),
  },
]

export default function Sidebar({ mobile = false, onClose }) {
  const { user } = useAuth()
  const { data: pendingData } = useQuery({
    queryKey: ['pendingConversions', 1],
    queryFn: () => getPendingConversions({ page: 1, limit: 1 }),
    refetchInterval: 30_000,
    select: (res) => res.data?.pagination?.total ?? 0,
  })

  const { data: unreadCount } = useQuery({
    queryKey: ['chatUnread'],
    queryFn: () => getSessions({ status: 'open' }),
    refetchInterval: 30_000,
    select: (res) => {
      const sessions = res.data?.data ?? res.data?.sessions ?? []
      return sessions.reduce((sum, s) => sum + (s.unreadCount ?? 0), 0)
    },
  })

  const pendingCount = pendingData ?? 0
  const chatUnread = unreadCount ?? 0
  const visibleNavItems = navItems.filter((item) => !item.adminOnly || user?.role === 'admin')

  const base = 'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200'
  const active = 'bg-jade-400/12 text-jade-400 shadow-[inset_0_0_0_1px_rgba(39,234,175,0.15)]'
  const inactive = 'text-jade-warm/80 hover:text-jade-50 hover:bg-jade-700/15'

  return (
    <aside className={`flex flex-col h-full ${mobile ? 'w-full' : 'w-[260px]'} bg-jade-800 border-r border-jade-700/15`}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 h-16 border-b border-jade-700/15 shrink-0">
        <div className="w-8 h-8 flex items-center justify-center shrink-0">
          <img src={jadeLogo} alt="Jadegate" className="h-8 w-auto" />
        </div>
        <div>
          <p className="font-bold text-jade-50 text-sm leading-none tracking-tight">Jadegate</p>
          <p className="text-[11px] text-jade-700 mt-0.5">Admin Panel</p>
        </div>
        {mobile && (
          <button onClick={onClose} className="ml-auto p-1 rounded-lg text-jade-warm hover:text-jade-50 hover:bg-jade-700/20">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        <p className="text-[10px] font-semibold text-jade-700/60 uppercase tracking-widest px-3 mb-2">Navigation</p>
        {visibleNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.exact}
            onClick={mobile ? onClose : undefined}
            className={({ isActive }) => `${base} ${isActive ? active : inactive}`}
          >
            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-jade-700/10 group-hover:bg-jade-700/20 transition-colors shrink-0">
              {item.icon}
            </span>
            <span className="flex-1">{item.label}</span>
            {item.badge && pendingCount > 0 && (
              <span className="bg-jade-400 text-jade-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center leading-tight">
                {pendingCount > 99 ? '99+' : pendingCount}
              </span>
            )}
            {item.chatBadge && chatUnread > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center leading-tight">
                {chatUnread > 99 ? '99+' : chatUnread}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-jade-700/15">
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-jade-700/50">
          <span>NGN</span>
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
          <span>RMB Platform</span>
        </div>
      </div>
    </aside>
  )
}
