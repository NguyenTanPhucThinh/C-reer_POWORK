import type { ReactElement, SVGProps } from 'react';
import type { NavIconName } from '@/lib/constants/nav';

type IconProps = SVGProps<SVGSVGElement>;

const iconProps = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const;

export function HomeIcon(props: IconProps) {
  return (
    <svg {...iconProps} {...props}>
      <path d="M3.5 10.8 12 3.5l8.5 7.3" />
      <path d="M5.5 9.5V20h13V9.5" />
      <path d="M9.5 20v-6h5v6" />
    </svg>
  );
}

export function ChallengeIcon(props: IconProps) {
  return (
    <svg {...iconProps} {...props}>
      <circle cx="12" cy="12" r="7.5" />
      <circle cx="12" cy="12" r="3.5" />
      <path d="M12 2.5v2" />
      <path d="M21.5 12h-2" />
      <path d="M12 21.5v-2" />
      <path d="M4.5 12h-2" />
    </svg>
  );
}

export function SubmissionIcon(props: IconProps) {
  return (
    <svg {...iconProps} {...props}>
      <path d="M6.5 3.5h7l4 4V20a1 1 0 0 1-1 1h-10a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" />
      <path d="M13.5 3.5v4h4" />
      <path d="M8.5 14h7" />
      <path d="M8.5 17h4.5" />
      <path d="m9 10 1.7 1.7L14 8.4" />
    </svg>
  );
}

export function ProfileIcon(props: IconProps) {
  return (
    <svg {...iconProps} {...props}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c.8-3.7 3.2-5.5 7-5.5s6.2 1.8 7 5.5" />
    </svg>
  );
}

export function CreateIcon(props: IconProps) {
  return (
    <svg {...iconProps} {...props}>
      <path d="M12 5v14" />
      <path d="M5 12h14" />
      <rect x="3.5" y="3.5" width="17" height="17" rx="4" />
    </svg>
  );
}

export function TalentIcon(props: IconProps) {
  return (
    <svg {...iconProps} {...props}>
      <path d="M12 3.5 14.4 8l5 .7-3.6 3.5.8 5-4.6-2.4-4.6 2.4.8-5L4.6 8.7l5-.7L12 3.5Z" />
      <path d="M12 9.5v3" />
    </svg>
  );
}

export function BookmarkIcon(props: IconProps) {
  return (
    <svg {...iconProps} {...props}>
      <path d="M7 4.5h10a1 1 0 0 1 1 1v15l-6-3.5-6 3.5v-15a1 1 0 0 1 1-1Z" />
    </svg>
  );
}

export function BellIcon(props: IconProps) {
  return (
    <svg {...iconProps} {...props}>
      <path d="M18 10.5a6 6 0 0 0-12 0c0 4-1.5 5-2.5 6h17c-1-1-2.5-2-2.5-6Z" />
      <path d="M9.5 19a2.7 2.7 0 0 0 5 0" />
    </svg>
  );
}

export function HistoryIcon(props: IconProps) {
  return (
    <svg {...iconProps} {...props}>
      <path d="M4 12a8 8 0 1 0 2.4-5.7" />
      <path d="M4 5.5v4h4" />
      <path d="M12 8v4l2.5 2" />
    </svg>
  );
}

export function SettingsIcon(props: IconProps) {
  return (
    <svg {...iconProps} {...props}>
      <path d="M12 8.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7Z" />
      <path d="M19 13.4v-2.8l-2-.5a6 6 0 0 0-.7-1.7l1.1-1.8-2-2-1.8 1.1a6 6 0 0 0-1.6-.7L11.4 2H8.6L8 4a6 6 0 0 0-1.7.7L4.6 3.6l-2 2 1.1 1.8A6 6 0 0 0 3 9.1l-2 .5v2.8l2 .5a6 6 0 0 0 .7 1.7l-1.1 1.8 2 2 1.8-1.1a6 6 0 0 0 1.7.7l.5 2h2.8l.5-2a6 6 0 0 0 1.7-.7l1.8 1.1 2-2-1.1-1.8a6 6 0 0 0 .7-1.7l2-.5Z" />
    </svg>
  );
}

export function CompanyIcon(props: IconProps) {
  return (
    <svg {...iconProps} {...props}>
      <path d="M4.5 20V6a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1v14" />
      <path d="M14.5 10h4a1 1 0 0 1 1 1v9" />
      <path d="M7.5 8.5h3" />
      <path d="M7.5 12h3" />
      <path d="M7.5 15.5h3" />
    </svg>
  );
}

export function PinIcon(props: IconProps) {
  return (
    <svg {...iconProps} {...props}>
      <path d="m14.5 4.5 5 5" />
      <path d="M9.5 9.5 5 14l5 5 4.5-4.5" />
      <path d="m12 7 5 5-5.5 5.5-5-5L12 7Z" />
      <path d="M4 20l4.5-4.5" />
    </svg>
  );
}

export function DotsIcon(props: IconProps) {
  return (
    <svg {...iconProps} {...props}>
      <path d="M6.5 12h.01" />
      <path d="M12 12h.01" />
      <path d="M17.5 12h.01" />
    </svg>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <svg {...iconProps} {...props}>
      <path d="M5 7h14" />
      <path d="M5 12h14" />
      <path d="M5 17h14" />
    </svg>
  );
}

export function BrandIcon(props: IconProps) {
  return (
    <svg {...iconProps} {...props}>
      <path d="M12 3.5 19.5 8v8L12 20.5 4.5 16V8L12 3.5Z" />
      <path d="M8.5 10.5 12 8.4l3.5 2.1v4L12 16.6l-3.5-2.1v-4Z" />
    </svg>
  );
}

export function MailIcon(props: IconProps) {
  return (
    <svg {...iconProps} {...props}>
      <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
      <path d="m4 7 8 5.5L20 7" />
    </svg>
  );
}

export function InboxIcon(props: IconProps) {
  return (
    <svg {...iconProps} {...props}>
      <path d="M4 13.5h4l1.5 2.5h5L16 13.5h4" />
      <path d="M4 13.5 6 5.5h12l2 8V18a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-4.5Z" />
    </svg>
  );
}

export function TrophyIcon(props: IconProps) {
  return (
    <svg {...iconProps} {...props}>
      <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <path d="M4 21h16" />
      <path d="M10 15v2.5c0 .8-.7 1.2-1.3 1.5C7.4 19.6 7 20.4 7 21" />
      <path d="M14 15v2.5c0 .8.7 1.2 1.3 1.5.9.6 1.7 1.4 1.7 2" />
      <path d="M18 3.5H6V9a6 6 0 0 0 12 0V3.5Z" />
    </svg>
  );
}

export function RefreshIcon(props: IconProps) {
  return (
    <svg {...iconProps} {...props}>
      <path d="M20 11.5a8 8 0 0 0-13.6-4.3L4 9.5" />
      <path d="M4 4.5v5h5" />
      <path d="M4 12.5a8 8 0 0 0 13.6 4.3L20 14.5" />
      <path d="M20 19.5v-5h-5" />
    </svg>
  );
}

export function RocketIcon(props: IconProps) {
  return (
    <svg {...iconProps} {...props}>
      <path d="M12 3.5c3.5 1.5 5.5 4.8 5.5 9L14 16H10L6.5 12.5c0-4.2 2-7.5 5.5-9Z" />
      <circle cx="12" cy="9.5" r="1.8" />
      <path d="M10 16c-2 .6-3 2-3 4.5 2.5 0 3.9-1 4.5-3" />
      <path d="M14 16c2 .6 3 2 3 4.5-2.5 0-3.9-1-4.5-3" />
    </svg>
  );
}

export function ChartIcon(props: IconProps) {
  return (
    <svg {...iconProps} {...props}>
      <path d="M4 4v16h16" />
      <path d="M8 16v-4" />
      <path d="M12.5 16V8" />
      <path d="M17 16v-6" />
    </svg>
  );
}

export function UsersIcon(props: IconProps) {
  return (
    <svg {...iconProps} {...props}>
      <path d="M16 20v-1.5a4 4 0 0 0-4-4H6.5a4 4 0 0 0-4 4V20" />
      <circle cx="9.2" cy="7.5" r="3.5" />
      <path d="M21.5 20v-1.5a4 4 0 0 0-3-3.85" />
      <path d="M15.5 4.15a4 4 0 0 1 0 7.7" />
    </svg>
  );
}

export function ClipboardIcon(props: IconProps) {
  return (
    <svg {...iconProps} {...props}>
      <rect x="5" y="4.5" width="14" height="16" rx="2" />
      <path d="M9 4.5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 4.5v1.5H9V4.5Z" />
      <path d="M9 11h6" />
      <path d="M9 14.5h4" />
    </svg>
  );
}

export function TargetIcon(props: IconProps) {
  return (
    <svg {...iconProps} {...props}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1" />
    </svg>
  );
}

export function ZapIcon(props: IconProps) {
  return (
    <svg {...iconProps} {...props}>
      <path d="M13 3 5 13.5h6L10 21l8-10.5h-6L13 3Z" />
    </svg>
  );
}

export function RepeatIcon(props: IconProps) {
  return (
    <svg {...iconProps} {...props}>
      <path d="m17 3 3 3-3 3" />
      <path d="M4 12V9.5A3.5 3.5 0 0 1 7.5 6H20" />
      <path d="m7 21-3-3 3-3" />
      <path d="M20 12v2.5A3.5 3.5 0 0 1 16.5 18H4" />
    </svg>
  );
}

const icons: Record<NavIconName, (props: IconProps) => ReactElement> = {
  home: HomeIcon,
  challenge: ChallengeIcon,
  submission: SubmissionIcon,
  profile: ProfileIcon,
  create: CreateIcon,
  talent: TalentIcon,
  bookmark: BookmarkIcon,
  notification: BellIcon,
  settings: SettingsIcon,
};

export function SidebarNavIcon({ name, className }: { name: NavIconName; className?: string }) {
  const Icon = icons[name];
  return <Icon className={className} />;
}
