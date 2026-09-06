"use client";

import { useState } from "react";

const MODES = [
  {
    id: "rboost",
    label: "R-BOOST",
    short: "Maximum Performance",
    description: "Unleashes full hardware potential for competitive gaming. Disables all thermal constraints, locks CPU/GPU at maximum frequencies, and prioritizes the game process above everything else. Expect significant heat and battery drain.",
    details: [
      "CPU governor → performance on all cores (all policies)",
      "CPU max frequency → max available (incl. boost frequencies where present)",
      "CPU min frequency → absolute minimum (widened floor before ceiling)",
      "GPU → max frequency locked (MTK OPP idx 0, Adreno min_pwr=0)",
      "GPU power policy → always_on (Mali), throttling disabled (Adreno)",
      "Thermal → disabled (TZ_MODE=disabled, TZ_POLICY=user_space, F_PERF_ONLY)",
      "stune_boost → 100 (v2) / 1 (v1) on top-app",
      "sched_boost=1, uclamp_min=1024 (max capacity)",
      "core_ctl → disabled (all cores online, min_cpus = max_cpus)",
      "PPM/FPSGO thermal → disabled (MediaTek)",
      "CPU boost frequencies → enabled (scaling_boost_frequencies)",
      "PPM/FPSGO thermal limits → disabled (MediaTek)",
      "sched_boost=1, uclamp_min=1024 (max capacity)",
    ],
    color: "#ff3b1a",
    icon: "RB",
  },
  {
    id: "balance",
    label: "BALANCE",
    short: "Optimized Daily Driver",
    description: "Sweet spot for everyday gaming. Keeps performance high but respects thermal limits. Dynamically scales CPU/GPU based on game demand, maintains reasonable temps, and preserves battery for longer sessions.",
    details: [
      "CPU governor → schedutil (with boost via sched_boost)",
      "CPU frequencies → normal max (no boost frequencies)",
      "CPU min frequency → normal (respects cpuinfo_min_freq)",
      "GPU → coarse_demand power policy (Mali), normal max freq",
      "GPU → throttling enabled (Adreno thermal_pwrlevel active)",
      "Thermal → enabled (step_wise policy, TZ_MODE=enabled)",
      "stune_boost → 1 on top-app",
      "sched_boost=0, uclamp_min=default",
      "core_ctl → enabled (vendor manages core onlining)",
      "PPM/FPSGO thermal → enabled (MediaTek vendor defaults)",
      "CPU boost frequencies → disabled (no scaling_boost_frequencies)",
      "sched_boost=0, uclamp_min=default",
    ],
    color: "#ff8c00",
    icon: "BL",
  },
  {
    id: "eco",
    label: "ECO",
    short: "Battery Saver",
    description: "Extends playtime by aggressively managing power. Caps frequencies, reduces screen refresh when possible, and kills non-essential background work. Performance takes a hit but you get significantly more screen-on time.",
    details: [
      "CPU governor → schedutil (conservative bias)",
      "CPU max frequency → capped at normal max (no boost)",
      "CPU min frequency → normal (widened floor)",
      "GPU → capped at 80% of max frequency (MTK Mali), coarse_demand",
      "GPU → coarse_demand power policy, throttling enabled",
      "Thermal → enabled (step_wise, vendor trip points active)",
      "stune_boost → 0 on top-app (no boost)",
      "core_ctl → enabled (vendor manages core onlining)",
      "PPM/FPSGO thermal → enabled (vendor defaults)",
      "CPU boost frequencies → disabled",
      "sched_boost=0, uclamp_min=default",
      "Thermal throttling → vendor trip points fully active",
    ],
    color: "#22c55e",
    icon: "EC",
  },
  {
    id: "default",
    label: "DEFAULT",
    short: "Stock Behavior",
    description: "Restores your device's factory behavior. All RaiRin tweaks disabled — stock governors, stock thermal policy, stock scheduler. Use for troubleshooting, benchmarking baseline, or when you want zero interference from the module.",
    details: [
      "CPU governor → vendor default (schedutil/ondemand)",
      "CPU frequencies → vendor default curves",
      "GPU → vendor default power policy & frequencies",
      "Thermal → vendor default policy (step_wise/bang_bang)",
      "stune → vendor defaults (boost=0, prefer_idle=0)",
      "core_ctl → vendor default (enabled on most devices)",
      "PPM/FPSGO → vendor defaults (thermal active)",
      "sched features → vendor defaults (NEXT_BUDDY off, TTWU_QUEUE on)",
      "uclamp / sched_boost → vendor defaults",
      "PPM/FPSGO thermal → vendor defaults",
      "CPUDVFS backdoor → not used (vendor DVFS active)",
      "All RaiRin nodes → skipped (module not running)",
    ],
    color: "#3b82f6",
    icon: "DF",
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