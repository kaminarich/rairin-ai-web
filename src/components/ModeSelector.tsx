"use client";

import { useState } from "react";
import { useLanguage } from "@/components/Language";

const MODES = [
  {
    id: "rboost",
    label: "R-BOOST",
    short: { en: "Maximum Performance", id: "Performa Maksimum" },
    description: { en: "Unleashes full hardware potential for competitive gaming. Disables thermal constraints, locks CPU/GPU at maximum frequencies, and prioritizes the game process. Expect significant heat and battery drain.", id: "Membuka potensi penuh perangkat keras untuk game kompetitif. Menonaktifkan batas termal, mengunci CPU/GPU pada frekuensi maksimum, dan memprioritaskan proses game. Suhu dan konsumsi baterai akan meningkat." },
    details: [
      { en: "CPU governor → performance on all cores (all policies)", id: "Governor CPU → performance pada semua core (semua policy)" },
      { en: "CPU max frequency → max available (incl. boost frequencies where present)", id: "Frekuensi maksimum CPU → nilai tertinggi yang tersedia (termasuk boost jika ada)" },
      { en: "CPU min frequency → absolute minimum (widened floor before ceiling)", id: "Frekuensi minimum CPU → nilai terendah absolut" },
      { en: "GPU → max frequency locked (MTK OPP idx 0, Adreno min_pwr=0)", id: "GPU → frekuensi maksimum dikunci (MTK OPP idx 0, Adreno min_pwr=0)" },
      { en: "GPU power policy → always_on (Mali), throttling disabled (Adreno)", id: "Kebijakan daya GPU → always_on (Mali), throttling dinonaktifkan (Adreno)" },
      { en: "Thermal → disabled (TZ_MODE=disabled, TZ_POLICY=user_space, F_PERF_ONLY)", id: "Termal → dinonaktifkan (TZ_MODE=disabled, TZ_POLICY=user_space, F_PERF_ONLY)" },
      { en: "stune_boost → 100 (v2) / 1 (v1) on top-app", id: "stune_boost → 100 (v2) / 1 (v1) pada top-app" },
      { en: "sched_boost=1, uclamp_min=1024 (max capacity)", id: "sched_boost=1, uclamp_min=1024 (kapasitas maksimum)" },
      { en: "core_ctl → disabled (all cores online, min_cpus = max_cpus)", id: "core_ctl → dinonaktifkan (semua core online, min_cpus = max_cpus)" },
      { en: "PPM/FPSGO thermal → disabled (MediaTek)", id: "Termal PPM/FPSGO → dinonaktifkan (MediaTek)" },
      { en: "CPU boost frequencies → enabled (scaling_boost_frequencies)", id: "Frekuensi boost CPU → diaktifkan (scaling_boost_frequencies)" },
      { en: "PPM/FPSGO thermal limits → disabled (MediaTek)", id: "Batas termal PPM/FPSGO → dinonaktifkan (MediaTek)" },
      { en: "sched_boost=1, uclamp_min=1024 (max capacity)", id: "sched_boost=1, uclamp_min=1024 (kapasitas maksimum)" },
    ],
    color: "#ff3b1a",
    icon: "RB",
  },
  {
    id: "balance",
    label: "BALANCE",
    short: { en: "Optimized Daily Driver", id: "Optimal untuk Harian" },
    description: { en: "Balanced for everyday gaming. Keeps performance high while respecting thermal limits, scaling CPU/GPU with demand, and preserving battery for longer sessions.", id: "Seimbang untuk game sehari-hari. Menjaga performa tinggi dengan batas termal, menyesuaikan CPU/GPU sesuai beban, dan menghemat baterai untuk sesi lebih lama." },
    details: [
      { en: "CPU governor → schedutil (with boost via sched_boost)", id: "Governor CPU → schedutil (boost melalui sched_boost)" },
      { en: "CPU frequencies → normal max (no boost frequencies)", id: "Frekuensi CPU → maksimum normal (tanpa frekuensi boost)" },
      { en: "CPU min frequency → normal (respects cpuinfo_min_freq)", id: "Frekuensi minimum CPU → normal (mengikuti cpuinfo_min_freq)" },
      { en: "GPU → coarse_demand power policy (Mali), normal max freq", id: "GPU → kebijakan daya coarse_demand (Mali), frekuensi maksimum normal" },
      { en: "GPU → throttling enabled (Adreno thermal_pwrlevel active)", id: "GPU → throttling aktif (thermal_pwrlevel Adreno aktif)" },
      { en: "Thermal → enabled (step_wise policy, TZ_MODE=enabled)", id: "Termal → diaktifkan (policy step_wise, TZ_MODE=enabled)" },
      { en: "stune_boost → 1 on top-app", id: "stune_boost → 1 pada top-app" },
      { en: "sched_boost=0, uclamp_min=default", id: "sched_boost=0, uclamp_min=default" },
      { en: "core_ctl → enabled (vendor manages core onlining)", id: "core_ctl → diaktifkan (vendor mengelola core online)" },
      { en: "PPM/FPSGO thermal → enabled (MediaTek vendor defaults)", id: "Termal PPM/FPSGO → diaktifkan (bawaan vendor MediaTek)" },
      { en: "CPU boost frequencies → disabled (no scaling_boost_frequencies)", id: "Frekuensi boost CPU → dinonaktifkan (tanpa scaling_boost_frequencies)" },
      { en: "sched_boost=0, uclamp_min=default", id: "sched_boost=0, uclamp_min=default" },
    ],
    color: "#ff8c00",
    icon: "BL",
  },
  {
    id: "eco",
    label: "ECO",
    short: { en: "Battery Saver", id: "Penghemat Baterai" },
    description: { en: "Extends playtime through aggressive power management. Caps frequencies, reduces refresh rate when possible, and stops non-essential background work at a performance cost.", id: "Memperpanjang waktu bermain melalui pengelolaan daya agresif. Membatasi frekuensi, mengurangi refresh rate jika memungkinkan, dan menghentikan proses latar yang tidak penting dengan penurunan performa." },
    details: [
      { en: "CPU governor → schedutil (conservative bias)", id: "Governor CPU → schedutil (bias konservatif)" },
      { en: "CPU max frequency → capped at normal max (no boost)", id: "Frekuensi maksimum CPU → dibatasi pada maksimum normal (tanpa boost)" },
      { en: "CPU min frequency → normal (widened floor)", id: "Frekuensi minimum CPU → normal" },
      { en: "GPU → capped at 80% of max frequency (MTK Mali), coarse_demand", id: "GPU → dibatasi 80% dari frekuensi maksimum (MTK Mali), coarse_demand" },
      { en: "GPU → coarse_demand power policy, throttling enabled", id: "GPU → kebijakan daya coarse_demand, throttling aktif" },
      { en: "Thermal → enabled (step_wise, vendor trip points active)", id: "Termal → diaktifkan (step_wise, trip point vendor aktif)" },
      { en: "stune_boost → 0 on top-app (no boost)", id: "stune_boost → 0 pada top-app (tanpa boost)" },
      { en: "core_ctl → enabled (vendor manages core onlining)", id: "core_ctl → diaktifkan (vendor mengelola core online)" },
      { en: "PPM/FPSGO thermal → enabled (vendor defaults)", id: "Termal PPM/FPSGO → diaktifkan (bawaan vendor)" },
      { en: "CPU boost frequencies → disabled", id: "Frekuensi boost CPU → dinonaktifkan" },
      { en: "sched_boost=0, uclamp_min=default", id: "sched_boost=0, uclamp_min=default" },
      { en: "Thermal throttling → vendor trip points fully active", id: "Thermal throttling → trip point vendor aktif sepenuhnya" },
    ],
    color: "#22c55e",
    icon: "EC",
  },
  {
    id: "default",
    label: "DEFAULT",
    short: { en: "Stock Behavior", id: "Perilaku Bawaan" },
    description: { en: "Restores factory behavior. All RaiRin tweaks are disabled: stock governors, thermal policy, and scheduler. Use for troubleshooting or baseline benchmarks.", id: "Mengembalikan perilaku bawaan pabrik. Semua penyesuaian RaiRin dinonaktifkan: governor, kebijakan termal, dan scheduler bawaan. Gunakan untuk pemecahan masalah atau benchmark dasar." },
    details: [
      { en: "CPU governor → vendor default (schedutil/ondemand)", id: "Governor CPU → bawaan vendor (schedutil/ondemand)" },
      { en: "CPU frequencies → vendor default curves", id: "Frekuensi CPU → kurva bawaan vendor" },
      { en: "GPU → vendor default power policy & frequencies", id: "GPU → kebijakan daya dan frekuensi bawaan vendor" },
      { en: "Thermal → vendor default policy (step_wise/bang_bang)", id: "Termal → kebijakan bawaan vendor (step_wise/bang_bang)" },
      { en: "stune → vendor defaults (boost=0, prefer_idle=0)", id: "stune → bawaan vendor (boost=0, prefer_idle=0)" },
      { en: "core_ctl → vendor default (enabled on most devices)", id: "core_ctl → bawaan vendor (aktif pada sebagian besar perangkat)" },
      { en: "PPM/FPSGO → vendor defaults (thermal active)", id: "PPM/FPSGO → bawaan vendor (termal aktif)" },
      { en: "sched features → vendor defaults (NEXT_BUDDY off, TTWU_QUEUE on)", id: "Fitur sched → bawaan vendor (NEXT_BUDDY mati, TTWU_QUEUE aktif)" },
      { en: "uclamp / sched_boost → vendor defaults", id: "uclamp / sched_boost → bawaan vendor" },
      { en: "PPM/FPSGO thermal → vendor defaults", id: "Termal PPM/FPSGO → bawaan vendor" },
      { en: "CPUDVFS backdoor → not used (vendor DVFS active)", id: "Backdoor CPUDVFS → tidak digunakan (DVFS vendor aktif)" },
      { en: "All RaiRin nodes → skipped (module not running)", id: "Semua node RaiRin → dilewati (modul tidak berjalan)" },
    ],
    color: "#3b82f6",
    icon: "DF",
  },
];

export default function InteractiveModeSelector() {
  const { language } = useLanguage();
  const [selected, setSelected] = useState<string>("rboost");

  const mode = MODES.find(m => m.id === selected) || MODES[0];

  return (
    <div className="mode-selector" data-reveal>
      <div className="mode-tabs" role="tablist" aria-label={language === "id" ? "Mode performa" : "Performance modes"}>
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
            <span className="mode-short">{mode.short[language]}</span>
          </div>
        </div>
        <p className="mode-description">{mode.description[language]}</p>
        <div className="mode-details">
          <h5>{language === "id" ? "Perubahan teknis:" : "What actually changes:"}</h5>
          <ul>
            {mode.details.map((detail, i) => (
              <li key={i}>
                <span className="detail-dot" style={{ "--accent-color": mode.color } as React.CSSProperties} />
                {detail[language]}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
