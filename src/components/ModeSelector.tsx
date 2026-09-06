"use client";

import { useState } from "react";

const MODES = [
  {
    id: "rboost",
    label: "R-BOOST",
    short: "Maximum Performance",
    description: "Unleashes the full potential of your device. Removes all power and thermal constraints, maxes out CPU/GPU frequencies, disables thermal throttling, and prioritizes game processes above everything else. Use for competitive play where every frame matters. Expect higher battery drain and heat.",
    details: [
      "CPU governor → performance on all cores",
      "GPU max frequency locked",
      "Thermal throttling disabled",
      "Scheduler → FIFO/RT priority for game",
      "Background tasks frozen",
      "Memory compaction aggressive",
      "I/O scheduler → deadline for game",
    ],
    color: "#ff3b1a",
    icon: "⚡",
  },
  {
    id: "balance",
    label: "BALANCE",
    short: "Optimized Daily Driver",
    description: "The sweet spot for everyday gaming. Keeps performance high but respects thermal limits. Dynamically scales CPU/GPU based on game demand, maintains reasonable temps, and preserves battery for longer sessions. Best for extended play sessions.",
    details: [
      "CPU governor → schedutil with boost",
      "GPU frequency scaled to load",
      "Thermal throttling at 85°C",
      "Scheduler → fair share with game boost",
      "Background tasks limited",
      "Memory management balanced",
      "I/O scheduler → bfq",
    ],
    color: "#ff8c00",
    icon: "⚖️",
  },
  {
    id: "eco",
    label: "ECO",
    short: "Battery Saver",
    description: "Extends playtime by aggressively managing power. Caps frequencies, enables aggressive doze, reduces screen refresh when possible, and kills non-essential background work. Performance takes a hit but you get significantly more screen-on time.",
    details: [
      "CPU governor → powersave",
      "GPU frequency capped at 50%",
      "Thermal throttling at 70°C",
      "Scheduler → batch/idle for background",
      "Non-essential services stopped",
      "Memory compaction minimal",
      "Screen refresh → 60Hz cap",
    ],
    color: "#22c55e",
    icon: "🔋",
  },
  {
    id: "default",
    label: "DEFAULT",
    short: "Stock Behavior",
    description: "Restores your device's factory behavior. All RaiRin tweaks disabled, stock governors, stock thermal policy, stock scheduler. Use for troubleshooting, benchmarking baseline, or when you want zero interference from the module.",
    details: [
      "CPU governor → stock (schedutil/ondemand)",
      "GPU frequency → stock curve",
      "Thermal throttling → stock trip points",
      "Scheduler → stock CFS",
      "All background services normal",
      "Memory management → stock",
      "I/O scheduler → stock (cfq/bfq)",
    ],
    color: "#3b82f6",
    icon: "📱",
  },
];

export default function InteractiveModeSelector() {
  const [selected, setSelected] = useState<string>("rboost");

  const mode = MODES.find(m => m.id === selected) || MODES[0];

  return (
    <div className="mode-selector" data-reveal>
      <div className="mode-tabs" role="tablist" aria-label="Performance modes">
        {MODES.map((m) => (
          <button
            key={m.id}
            role="tab"
            aria-selected={selected === m.id}
            aria-controls={`panel-${m.id}`}
            id={`tab-${m.id}`}
            className={`mode-tab${selected === m.id ? " active" : ""}`}
            onClick={() => setSelected(m.id)}
            style={{ "--accent-color": m.color } as React.CSSProperties}
          >
            <span className="mode-icon">{m.icon}</span>
            <span className="mode-label">{m.label}</span>
          </button>
        ))}
      </div>

      <div className="mode-panel" id={`panel-${selected}`} role="tabpanel" aria-labelledby={`tab-${selected}`}>
        <div className="mode-header" style={{ "--accent-color": mode.color } as React.CSSProperties}>
          <span className="mode-icon-large">{mode.icon}</span>
          <div className="mode-title-row">
            <h4 className="mode-title">{mode.label}</h4>
            <span className="mode-short">{mode.short}</span>
          </div>
        </div>
        <p className="mode-description">{mode.description}</p>
        <div className="mode-details">
          <h5>What actually changes:</h5>
          <ul>
            {mode.details.map((detail, i) => (
              <li key={i}>
                <span className="detail-dot" style={{ "--accent-color": mode.color } as React.CSSProperties} />
                {detail}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}