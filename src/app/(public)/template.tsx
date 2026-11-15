import type { ReactNode } from "react";

/** Re-mounts on every navigation: pure-CSS fade/rise (works without JS, no containing-block side effects once finished). */
export default function PublicTemplate({ children }: { children: ReactNode }) {
  return <div className="animate-page-in">{children}</div>;
}
