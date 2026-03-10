import { type ReactNode } from "react";

export function AppLayout({ sidebar, main }: { sidebar: ReactNode; main: ReactNode }) {
  return (
    <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
      <div style={{ width: 255, flexShrink: 0, display: "flex", flexDirection: "column", background: "var(--surface)", borderRight: "1px solid var(--border)", overflow: "hidden" }}>
        {sidebar}
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {main}
      </div>
    </div>
  );
}
