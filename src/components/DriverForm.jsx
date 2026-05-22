import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X } from "lucide-react";

const fields = [
  { key: "full_name", label: "Full Name", type: "text", required: true },
  { key: "phone", label: "Phone", type: "text", required: true },
  { key: "email", label: "Email", type: "email" },
  { key: "vehicle_model", label: "Vehicle Model", type: "text" },
  { key: "vehicle_plate", label: "Vehicle Plate", type: "text" },
  { key: "license_number", label: "License Number", type: "text" },
  { key: "city", label: "City", type: "text" },
  { key: "total_rides", label: "Total Rides", type: "number" },
  { key: "total_earnings", label: "Total Earnings (GHS)", type: "number" },
  { key: "rating", label: "Rating (1-5)", type: "number" },
];

export default function DriverForm({ driver, onClose, onSaved }) {
  const [form, setForm] = useState({
    full_name: driver?.full_name || "",
    phone: driver?.phone || "",
    email: driver?.email || "",
    vehicle_type: driver?.vehicle_type || "Sedan",
    vehicle_model: driver?.vehicle_model || "",
    vehicle_plate: driver?.vehicle_plate || "",
    license_number: driver?.license_number || "",
    city: driver?.city || "",
    status: driver?.status || "Active",
    total_rides: driver?.total_rides || "",
    total_earnings: driver?.total_earnings || "",
    rating: driver?.rating || "",
    is_online: driver?.is_online || false,
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const data = { ...form };
    if (data.total_rides) data.total_rides = Number(data.total_rides);
    if (data.total_earnings) data.total_earnings = Number(data.total_earnings);
    if (data.rating) data.rating = Number(data.rating);
    if (driver?.id) {
      await base44.entities.Driver.update(driver.id, data);
    } else {
      await base44.entities.Driver.create(data);
    }
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
      <div className="bg-hy3n-surface border border-hy3n-border rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-hy3n-border">
          <h2 className="font-semibold text-white">{driver ? "Edit Driver" : "Add Driver"}</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-white"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {fields.map(f => (
              <div key={f.key} className={f.key === "full_name" || f.key === "email" ? "col-span-2" : ""}>
                <label className="text-xs text-muted-foreground font-medium mb-1 block">{f.label}</label>
                <input
                  type={f.type}
                  value={form[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  required={f.required}
                  className="w-full bg-hy3n-bg border border-hy3n-border text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-hy3n-gold/60"
                />
              </div>
            ))}
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1 block">Status</label>
              <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}
                className="w-full bg-hy3n-bg border border-hy3n-border text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-hy3n-gold/60">
                {["Active","Inactive","Suspended","Pending"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1 block">Vehicle Type</label>
              <select value={form.vehicle_type} onChange={e => setForm(p => ({ ...p, vehicle_type: e.target.value }))}
                className="w-full bg-hy3n-bg border border-hy3n-border text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-hy3n-gold/60">
                {["Sedan","SUV","Tricycle","Motorcycle","Minivan"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="col-span-2 flex items-center gap-2">
              <input type="checkbox" id="is_online" checked={form.is_online} onChange={e => setForm(p => ({ ...p, is_online: e.target.checked }))} className="rounded" />
              <label htmlFor="is_online" className="text-sm text-white">Currently Online</label>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 border border-hy3n-border text-muted-foreground hover:text-white py-2.5 rounded-xl text-sm transition-colors">Cancel</button>
            <button type="submit" disabled={saving} className="flex-1 bg-hy3n-gold hover:bg-hy3n-gold/90 text-black font-semibold py-2.5 rounded-xl text-sm transition-colors disabled:opacity-60">
              {saving ? "Saving..." : "Save Driver"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}