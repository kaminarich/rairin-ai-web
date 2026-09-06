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
};

export default function InteractiveModeSelector() {
  const [selected, setSelected] = useState<string>("rboost");
  const [expanded, setExpanded] = useState<string | null>(null);

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
            onClick={() => {
              setSelected(m.id);
              setExpanded(m.id);
            }}
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

      <style jsx>{`
        .mode-selector {
          margin-top: 16px;
        }
        .mode-tabs {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          margin-bottom: 16px;
        }
        .mode-tab {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 16px;
          border: 1px solid var(--line);
          border-radius: 999px;
          background: linear-gradient(180deg, var(--floor-lo), var(--floor-hi));
          color: var(--ink-dim);
          font-family: var(--mono);
          font-size: 12px;
          font-weight: 600;
          letter-spacing: 0.08em;
          cursor: pointer;
          transition: all 0.15s ease;
          box-shadow:
            inset 0 2px 5px rgba(0,0,0,0.8),
            inset 0 -1px 0 rgba(255,255,255,0.06);
        }
        .mode-tab:hover {
          color: var(--ink);
          filter: brightness(1.15);
        }
        .mode-tab.active {
          color: #fff;
          border-color: transparent;
          background: linear-gradient(180deg, var(--accent-color), color-mix(in srgb, var(--accent-color) 70%, black));
          box-shadow:
            inset 0 2px 4px rgba(0,0,0,0.4),
            inset 0 -1px 0 rgba(255,255,255,0.16),
            0 0 20px color-mix(in srgb, var(--accent-color) 40%, transparent);
        }
        .mode-icon {
          font-size: 14px;
        }
        .mode-panel {
          padding: 20px;
          border: 1px solid var(--line);
          border-radius: 16px;
          background: linear-gradient(180deg, var(--panel-hi) 0%, var(--panel-mid) 50%, var(--panel-lo) 100%);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.18),
            inset 0 -2px 6px rgba(0,0,0,0.5);
          animation: panel-in 0.25s cubic-bezier(0.22, 0.8, 0.25, 1);
        }
        @keyframes panel-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: none; }
        }
        .mode-header {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-bottom: 14px;
          padding-bottom: 14px;
          border-bottom: 1px solid var(--line);
        }
        .mode-icon-large {
          font-size: 36px;
          filter: drop-shadow(0 0 12px var(--accent-color));
        }
        .mode-title-row {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .mode-title {
          font-size: 20px;
          font-weight: 700;
          color: var(--ink);
          text-shadow: 0 0 16px var(--accent-color);
        }
        .mode-short {
          font-family: var(--mono);
          font-size: 12px;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--ink-dim);
        }
        .mode-description {
          color: var(--ink-dim);
          line-height: 1.7;
          margin-bottom: 18px;
          font-size: 14px;
        }
        .mode-details h5 {
          font-family: var(--mono);
          font-size: 11px;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: var(--ink-faint);
          margin-bottom: 10px;
        }
        .mode-details ul {
          list-style: none;
          display: grid;
          gap: 8px;
        }
        .mode-details li {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          font-size: 13px;
          color: var(--ink-dim);
          line-height: 1.55;
        }
        .detail-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          flex: none;
          margin-top: 5px;
          background: var(--accent-color);
          box-shadow: 0 0 8px var(--accent-color);
        }
      `}
    </div>
  );
}