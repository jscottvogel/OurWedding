import { StorageImage } from './StorageImage';

type LogoType = 'TEXT_ONLY' | 'STEWARD' | 'RINGS' | 'CROSS' | 'DOVE' | 'HEART' | 'CUSTOM' | string | null | undefined;

interface SiteLogoProps {
  type?: LogoType;
  customKey?: string | null;
  className?: string;
  color?: string;
}

export function SiteLogo({ type, customKey, className = "w-8 h-8", color = "currentColor" }: SiteLogoProps) {
  if (!type || type === 'TEXT_ONLY') {
    return null;
  }

  if (type === 'CUSTOM' && customKey) {
    return <StorageImage storageKey={customKey} alt="Site Logo" className={`object-contain ${className}`} />;
  }

  const svgProps = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: "1.5",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  switch (type) {
    case 'STEWARD':
      // Elegant 'W' and 'S' intertwined or an abstract wreath
      return (
        <svg {...svgProps}>
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" strokeWidth="1" />
          <path d="M7 11l2 5l2.5-4L14 16l3-6" strokeWidth="1.5" />
          <circle cx="12" cy="7" r="1.5" fill={color} stroke="none" />
        </svg>
      );
    case 'RINGS':
      return (
        <svg {...svgProps}>
          <circle cx="9" cy="12" r="5" />
          <circle cx="15" cy="12" r="5" />
        </svg>
      );
    case 'CROSS':
      return (
        <svg {...svgProps}>
          <path d="M12 3v18M7 8h10" />
        </svg>
      );
    case 'DOVE':
      return (
        <svg {...svgProps}>
          <path d="M22 6c0 0-4.5 4.5-6 4.5-1.5 0-2.5-1-4-2S9 6 6 8c-3 2-4 6-4 6s3 0 5-2c2-2 3-2 5-1 2 1 4 4 6 5s4-2 4-2-2-4-2-6z" />
          <circle cx="16" cy="9" r="0.5" fill={color} stroke="none" />
        </svg>
      );
    case 'HEART':
      return (
        <svg {...svgProps}>
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      );
    default:
      return null;
  }
}
