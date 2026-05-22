import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Search, ClipboardList, Clock, CheckCircle, XCircle, Eye, RefreshCw } from "lucide-react";
import ApplicationDetailModal from "../components/ApplicationDetailModal";

const statusColors = {
  "Pending": "text-hy3n-gold bg-hy3n-gold/10",
  "Under Review": "text-blue-400 bg-blue-400/10",
  "Approved": "text-hy3n-green bg-hy3n-green/10",
  "Rejected": "text-hy3n-red bg-hy3n-red/10",
};

const statusIcons = {
  "Pending": Clock,
  "Under Review": RefreshCw,
  "Approved": CheckCircle,
  "Rejected": XCircle,
};

export default function DriverApplications() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [selected, setSelected] = useState(null);

  const fetchApplications = () => {
    setLoading(true);
    base44.entities.DriverApplication.list("-created_date", 200).then(data => {
      setApplications(data);
      setLoading(false);
    });
  };

  useEffect(() => { fetchApplications(); }, []);

  const counts = {
    All: applications.length,
    Pending: applications.filter(a => a.status === "Pending").length,
    "Under Review": applications.filter(a => a.status === "Under Review").length,
    Approved: applications.filter(a => a.status === "Approved").length,
    Rejected: applications.filter(a => a.status === "Rejected").length,
  };

  const filtered = applications.filter(a => {
    const matchSearch = !search ||
      a.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      a.phone?.toLowerCase().includes(search.toLowerCase()) ||
      a.email?.toLowerCase().includes(search.toLowerCase()) ||
      a.vehicle_plate?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "All" || a.status === filterStatus;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white">Driver Applications</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Review and approve new driver sign-ups</p>
        </div>
        <button
          onClick={fetchApplications}
          className="flex items-center gap-2 bg-hy3n-surface border border-hy3n-border hover:border-hy3n-gold/40 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
        >
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Status summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { status: "Pending", label: "Awaiting Review", color: "bg-hy3n-gold", icon: Clock },
          { status: "Under Review", label: "Under Review", color: "bg-blue-500", icon: RefreshCw },
          { status: "Approved", label: "Approved", color: "bg-hy3n-green", icon: CheckCircle },
          { status: "Rejected", label: "Rejected", color: "bg-hy3n-red", icon: XCircle },
        ].map(({ status, label, color, icon: Icon }) => (
          <button
            key={status}
            onClick={() => setFilterStatus(filterStatus === status ? "All" : status)}
            className={`bg-hy3n-surface border rounded-2xl p-4 text-left transition-all hover:scale-[1.02] ${
              filterStatus === status ? "border-hy3n-gold/50" : "border-hy3n-border"
            }`}
          >
            <div className={`w-8 h-8 rounded-xl ${color}/15 flex items-center justify-center mb-2`}>
              <Icon size={16} className={color.replace("bg-", "text-")} />
            </div>
            <p className="text-2xl font-bold text-white">{counts[status]}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
          </button>
        ))}
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, phone, email, plate..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-hy3n-surface border border-hy3n-border text-white placeholder:text-muted-foreground rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-hy3n-gold/60"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {["All", "Pending", "Under Review", "Approved", "Rejected"].map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                filterStatus === s ? "bg-hy3n-gold text-black" : "bg-hy3n-surface border border-hy3n-border text-muted-foreground hover:text-white"
              }`}
            >
              {s} {counts[s] > 0 && s !== "All" ? `(${counts[s]})` : ""}
            </button>
          ))}
        </div>
      </div>

      {/* Applications list */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-7 h-7 border-4 border-hy3n-gold/30 border-t-hy3n-gold rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-hy3n-surface border border-hy3n-border rounded-2xl flex flex-col items-center justify-center py-20 gap-3">
          <ClipboardList size={40} className="text-muted-foreground/40" />
          <p className="text-muted-foreground text-sm">No applications found</p>
          {filterStatus === "Pending" && (
            <p className="text-xs text-muted-foreground/60">New applications from the driver portal will appear here</p>
          )}
        </div>
      ) : (
        <div className="bg-hy3n-surface border border-hy3n-border rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground text-xs uppercase tracking-wide border-b border-hy3n-border bg-white/2">
                  <th className="text-left px-5 py-3">Applicant</th>
                  <th className="text-left px-5 py-3 hidden md:table-cell">Vehicle</th>
                  <th className="text-left px-5 py-3 hidden lg:table-cell">City</th>
                  <th className="text-left px-5 py-3">Status</th>
                  <th className="text-left px-5 py-3 hidden sm:table-cell">Applied</th>
                  <th className="text-right px-5 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(app => {
                  const StatusIcon = statusIcons[app.status] || Clock;
                  return (
                    <tr key={app.id} className="border-b border-hy3n-border/40 hover:bg-white/3 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-hy3n-gold/10 border border-hy3n-gold/20 flex items-center justify-center text-hy3n-gold font-bold text-xs shrink-0">
                            {app.full_name?.charAt(0) || "?"}
                          </div>
                          <div>
                            <p className="text-white font-medium leading-tight">{app.full_name}</p>
                            <p className="text-muted-foreground text-xs">{app.phone}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 hidden md:table-cell">
                        <p className="text-white text-xs">{app.vehicle_model || app.vehicle_type || "—"}</p>
                        <p className="text-muted-foreground text-xs">{app.vehicle_plate || ""}</p>
                      </td>
                      <td className="px-5 py-3 hidden lg:table-cell text-muted-foreground text-xs">{app.city || "—"}</td>
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${statusColors[app.status]}`}>
                          <StatusIcon size={11} />
                          {app.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 hidden sm:table-cell text-muted-foreground text-xs">
                        {app.created_date ? new Date(app.created_date).toLocaleDateString() : "—"}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <button
                          onClick={() => setSelected(app)}
                          className="inline-flex items-center gap-1.5 text-xs text-hy3n-gold border border-hy3n-gold/30 hover:bg-hy3n-gold/10 px-3 py-1.5 rounded-lg transition-colors"
                        >
                          <Eye size={13} /> Review
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selected && (
        <ApplicationDetailModal
          application={selected}
          onClose={() => setSelected(null)}
          onUpdated={() => { setSelected(null); fetchApplications(); }}
        />
      )}
    </div>
  );
}