import type { ReactNode } from "react";

/**
 * The exact icon set used by the reference site: 24×24 grid, 1.5 stroke (1.6 on two chevrons),
 * round caps/joins. Sizes are set per use, exactly as in the reference.
 */
type P = { size?: number; className?: string; strokeWidth?: number };

function Icon({ size = 16, className, strokeWidth = 1.5, children }: P & { children: ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable="false" className={className}>
      {children}
    </svg>
  );
}

export const IconArrowUpRight = (p: P) => <Icon size={15} {...p}><path d="M7 17 17 7M8 7h9v9" /></Icon>;
export const IconArrowLeft = (p: P) => <Icon size={16} {...p}><path d="M20 12H4M10 6l-6 6 6 6" /></Icon>;
export const IconArrowRight = (p: P) => <Icon size={16} {...p}><path d="M4 12h16M14 6l6 6-6 6" /></Icon>;
export const IconArrowDown = (p: P) => <Icon size={12} strokeWidth={1.6} {...p}><path d="M12 5v14M6 13l6 6 6-6" /></Icon>;
export const IconPlus = (p: P) => <Icon size={16} {...p}><path d="M12 5v14M5 12h14" /></Icon>;
export const IconCheck = (p: P) => <Icon size={15} {...p}><path d="m5 12.5 4.5 4.5L19 7.5" /></Icon>;
export const IconSwap = (p: P) => <Icon size={18} strokeWidth={1.6} {...p}><path d="m9 7-5 5 5 5M15 7l5 5-5 5" /></Icon>;
export const IconMoon = (p: P) => <Icon size={18} {...p}><path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11Z" /></Icon>;

export function IconStar({ size = 13, className }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="none" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden focusable="false" className={className}>
      <path d="m12 3.2 2.6 5.5 6 .8-4.4 4.1 1.1 5.9L12 16.6l-5.3 2.9 1.1-5.9L3.4 9.5l6-.8L12 3.2Z" />
    </svg>
  );
}

export const IconLeaf = ({ size = 22, className }: P) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden focusable="false" className={className}>
    <path d="M12 2.5c4.6 3.4 6.3 8.4 3.4 13.2A4 4 0 0 1 12 17.8a4 4 0 0 1-3.4-2.1C5.7 10.9 7.4 5.9 12 2.5Z" stroke="currentColor" strokeWidth="1.3" />
    <path d="M12 7v14.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
  </svg>
);
