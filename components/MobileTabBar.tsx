'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, CalendarSearch, Zap, Users, BookOpen } from 'lucide-react';

const SKY = '#0EA5E9';

const TABS = [
  { label: 'Home',     href: '/',              Icon: Home           },
  { label: 'Events',   href: '/events',        Icon: CalendarSearch  },
  { label: 'Features', href: '/features',      Icon: Zap             },
  { label: 'Trips',    href: '/trips',         Icon: Users           },
  { label: 'How It Works', href: '/how-it-works', Icon: BookOpen    },
];

export default function MobileTabBar() {
  const pathname = usePathname();

  return (
    // Only visible on mobile — hidden md and up
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      style={{
        background: 'rgba(255,255,255,0.97)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(0,0,0,0.08)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex items-stretch justify-around h-16 px-1">
        {TABS.map(({ label, href, Icon }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center gap-0.5 flex-1 py-2 relative"
            >
              {/* Active indicator line */}
              {active && (
                <span
                  className="absolute top-1 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                  style={{ background: SKY }}
                />
              )}
              <Icon
                size={20}
                strokeWidth={active ? 2.5 : 1.8}
                style={{ color: active ? SKY : '#94A3B8' }}
              />
              <span
                className="text-[9px] font-semibold leading-none text-center"
                style={{ color: active ? SKY : '#94A3B8' }}
              >
                {label === 'How It Works' ? 'How It Works' : label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}