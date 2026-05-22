import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { DollarSign, Save, Zap, Info } from "lucide-react";

const VEHICLE_TYPES = ["Sedan", "SUV", "Tricycle", "Motorcycle", "Minivan"];

const VEHICLE_DEFAULTS = {
  Sedan:      { base_fare: 5,  per_km_rate: 2.5, surge_multiplier: 1, minimum_fare: 8 },
  SUV:        { base_fare: 8,  per_km_rate: 3.5, surge_multiplier: 1, minimum_fare: 12 },
  Tricycle:   { base_fare: 3,  per_km_rate: 1.5, surge_multiplier: 1, minimum_fare: 5 },
  Motorcycle: { base_fare: 2,  per_km_rate: 1.2, surge_multiplier: 1, minimum_fare: 4 },
  Minivan:    { base_fare: 10, per_km_rate: 4.0, surge_multiplier: 1, minimum_fare: 15 },
};

const ICONS = { Sedan: "🚗", SUV: "🚙", Tricycle: "🛺", Motorcycle: "🏍️", Minivan: "🚐" };

function calcFare(cfg, km = 5) {
  const fare = (cfg.base_fare + cfg.per_km_rate * km) * cfg.surge_multiplier;
  return Math.max(fare, cfg.minimum_fare || 0).toFixed(2);
}

export default function Pricing() {
  const [configs, setConfigs] = useState({});
  const [ids, setIds] = useState({});
  const [saving, setSaving] = useState({});
  const [saved, setSaved] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    base44.entities.FareConfig.list().then(data => {
      const map = {};
      const idMap = {};
      data.forEach(c => {
        map[c.vehicle_type] = {
          base_fare: c.base_fare,
          per_km_rate: c.per_km_rate,
          surge_multiplier: c.surge_multiplier ?? 1,
          minimum_fare: c.minimum_fare ?? 0,
          is_active: c.is_active ?? true,
        };
        idMap[c.vehicle_type] = c.id;
      });
      // Fill in defaults for any missing vehicle types
      VEHICLE_TYPES.forEach(vt => {
        if (!map[vt]) map[vt] = { ...VEHICLE_DEFAULTS[vt] };
      });
      setConfigs(map);
      setIds(idMap);
      setLoading(false);
    });
  }, []);

  const update = (vt, field, value) => {
    setConfigs(prev => ({ ...prev, [vt]: { ...prev[vt], [field]: value } }));
  };

  const saveConfig = async (vt) => {
    setSaving(p => ({ ...p, [vt]: true }));
    const data = {
      vehicle_type: vt,
      base_fare: Number(configs[vt].base_fare),
      per_km_rate: Number(configs[vt].per_km_rate),
      surge_multiplier: Number(configs[vt].surge_multiplier),
      minimum_fare: Number(configs[vt].minimum_fare),
      is_active: configs[vt].is_active,
    };
    if (ids[vt]) {
      await base44.entities.FareConfig.update(ids[vt], data);
    } else {
      const created = await base44.entities.FareConfig.create(data);
      setIds(p => ({ ...p, [vt]: created.id }));
    }
    setSaving(p => ({ ...p, [vt]: false }));
    setSaved(p => ({ ...p, [vt]: true }));
    setTimeout(() => setSaved(p => ({ ...p, [vt]: false })), 2000);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-hy3n-gold/30 border-t-hy3n-gold rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Pricing Configuration</h1>
        <p className="text-muted-foreground text-sm mt-1">Set base fares, per-km rates, and surge multipliers per vehicle type</p>
      </div>

      {/* Formula explainer */}
      <div className="bg-hy3n-gold/5 border border-hy3n-gold/20 rounded-2xl px-5 py-4 flex items-start gap-3">
        <Info size={16} className="text-hy3n-gold mt-0.5 shrink-0" />
        <div className="text-sm">
          <p className="text-white font-semibold mb-1">Fare Formula</p>
          <p className="text-muted-foreground font-mono text-xs">Fare = max( (Base Fare + Per KM Rate × Distance) × Surge Multiplier, Minimum Fare )</p>
        </div>
      </div>

      {/* Vehicle type cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {VEHICLE_TYPES.map(vt => {
          const cfg = configs[vt] || VEHICLE_DEFAULTS[vt];
          const isSurge = cfg.surge_multiplier > 1;
          return (
            <div key={vt} className={`bg-hy3n-surface border rounded-2xl p-5 transition-colors ${isSurge ? "border-hy3n-gold/50" : "border-hy3n-border"}`}>
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{ICONS[vt]}</span>
                  <div>
                    <h3 className="text-white font-bold">{vt}</h3>
                    {isSurge && (
                      <span className="text-xs text-hy3n-gold flex items-center gap-1">
                        <Zap size={10} /> Surge active
                      </span>
                    )}
                  </div>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-xs text-muted-foreground">Active</span>
                  <div
                    onClick={() => update(vt, "is_active", !cfg.is_active)}
                    className={`w-10 h-5 rounded-full relative transition-colors cursor-pointer ${cfg.is_active ? "bg-hy3n-green" : "bg-hy3n-border"}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${cfg.is_active ? "translate-x-5" : "translate-x-0.5"}`} />
                  </div>
                </label>
              </div>

              {/* Fare preview */}
              <div className="bg-white/5 rounded-xl px-4 py-3 mb-4 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Est. 5km fare</span>
                <span className="text-hy3n-gold font-bold">GHS {calcFare(cfg)}</span>
              </div>

              {/* Inputs */}
              <div className="space-y-3">
                {[
                  { key: "base_fare", label: "Base Fare (GHS)", step: "0.5" },
                  { key: "per_km_rate", label: "Per KM Rate (GHS)", step: "0.1" },
                  { key: "surge_multiplier", label: "Surge Multiplier", step: "0.1", min: "1" },
                  { key: "minimum_fare", label: "Minimum Fare (GHS)", step: "0.5" },
                ].map(f => (
                  <div key={f.key}>
                    <label className="text-xs text-muted-foreground mb-1 block">{f.label}</label>
                    <input
                      type="number"
                      step={f.step}
                      min={f.min || "0"}
                      value={cfg[f.key] ?? ""}
                      onChange={e => update(vt, f.key, e.target.value)}
                      className="w-full bg-hy3n-bg border border-hy3n-border text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-hy3n-gold/60"
                    />
                  </div>
                ))}
              </div>

              <button
                onClick={() => saveConfig(vt)}
                disabled={saving[vt]}
                className={`mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  saved[vt]
                    ? "bg-hy3n-green/20 text-hy3n-green border border-hy3n-green/30"
                    : "bg-hy3n-gold hover:bg-hy3n-gold/90 text-black"
                } disabled:opacity-60`}
              >
                <Save size={15} />
                {saving[vt] ? "Saving…" : saved[vt] ? "Saved ✓" : "Save"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}