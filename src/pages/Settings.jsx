import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Shield, UserPlus, Trash2, CheckCircle, XCircle, Clock, AlertTriangle, Copy, RefreshCw } from "lucide-react";

const SUPER_ADMIN_EMAILS = (import.meta.env.VITE_SUPER_ADMIN_EMAILS || "yawgad23@gmail.com")
  .split(",")
  .map(e => e.trim().toLowerCase())
  .filter(Boolean);

export default function Settings() {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("admin");
  const [currentUser, setCurrentUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [adminList, user] = await Promise.all([
        base44.entities.AdminAccess.list("-created_date", 100),
        base44.auth.me()
      ]);
      setAdmins(adminList);
      setCurrentUser(user);
    } catch (e) {
      setAdmins([]);
    }
    setLoading(false);
  };

  const isSuperAdmin = () => {
    return SUPER_ADMIN_EMAILS.includes(currentUser?.email?.toLowerCase());
  };

  const addAdmin = async () => {
    if (!newEmail.trim()) return;
    setSaving(true);
    try {
      await base44.entities.AdminAccess.create({
        email: newEmail.toLowerCase().trim(),
        name: newName.trim() || newEmail.split("@")[0],
        role: newRole,
        is_active: true,
        created_by: currentUser?.email,
        last_login: null,
        revoked_at: null,
        revoked_by: null
      });
      setNewEmail("");
      setNewName("");
      setNewRole("admin");
      setShowAddForm(false);
      loadData();
    } catch (e) {
      alert("Failed to add admin: " + e.message);
    }
    setSaving(false);
  };

  const revokeAccess = async (admin) => {
    if (!confirm(`Revoke access for ${admin.email}? They will no longer be able to log into the admin dashboard.`)) return;
    try {
      await base44.entities.AdminAccess.update(admin.id, {
        is_active: false,
        revoked_at: new Date().toISOString(),
        revoked_by: currentUser?.email
      });
      loadData();
    } catch (e) {
      alert("Failed to revoke: " + e.message);
    }
  };

  const restoreAccess = async (admin) => {
    try {
      await base44.entities.AdminAccess.update(admin.id, {
        is_active: true,
        revoked_at: null,
        revoked_by: null
      });
      loadData();
    } catch (e) {
      alert("Failed to restore: " + e.message);
    }
  };

  const deleteAdmin = async (admin) => {
    if (!confirm(`Permanently delete ${admin.email} from admin list?`)) return;
    try {
      await base44.entities.AdminAccess.delete(admin.id);
      loadData();
    } catch (e) {
      alert("Failed to delete: " + e.message);
    }
  };

  const copyAccessCode = () => {
    navigator.clipboard.writeText("HY3N-ADMIN-2024");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-4 border-hy3n-gold/30 border-t-hy3n-gold rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage admin access and security</p>
      </div>

      {/* Access Code Section */}
      <div className="bg-hy3n-surface border border-hy3n-border rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-xl bg-hy3n-gold/10">
            <Shield className="w-5 h-5 text-hy3n-gold" />
          </div>
          <div>
            <h2 className="font-semibold text-white">Admin Access Code</h2>
            <p className="text-xs text-muted-foreground">Required for all admin logins (2-factor security)</p>
          </div>
        </div>

        <div className="bg-hy3n-bg border border-hy3n-border rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Current access code:</p>
            <p className="text-white font-mono font-bold text-lg tracking-wider">HY3N-ADMIN-2024</p>
          </div>
          <button
            onClick={copyAccessCode}
            className="px-3 py-2 bg-hy3n-gold/10 border border-hy3n-gold/30 rounded-lg text-hy3n-gold text-sm flex items-center gap-2 hover:bg-hy3n-gold/20 transition"
          >
            <Copy size={14} />
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>

        <div className="mt-3 flex items-start gap-2 text-xs text-muted-foreground">
          <AlertTriangle size={14} className="shrink-0 mt-0.5 text-yellow-500" />
          <p>To change the access code, update the <code className="text-white bg-white/10 px-1 rounded">MASTER_ACCESS_CODE</code> value in <code className="text-white bg-white/10 px-1 rounded">AdminGuard.jsx</code>. Share the code only with trusted staff.</p>
        </div>
      </div>

      {/* Admin Users Section */}
      <div className="bg-hy3n-surface border border-hy3n-border rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-hy3n-border flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-white">Admin Users</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{admins.filter(a => a.is_active).length} active admins</p>
          </div>
          {isSuperAdmin() && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="px-3 py-2 bg-hy3n-gold text-black text-sm font-medium rounded-xl flex items-center gap-2 hover:bg-hy3n-gold/90 transition"
            >
              <UserPlus size={14} />
              Add Admin
            </button>
          )}
        </div>

        {/* Add form */}
        {showAddForm && (
          <div className="px-6 py-4 border-b border-hy3n-border bg-hy3n-bg/50">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="Email address"
                className="px-3 py-2 bg-hy3n-bg border border-hy3n-border rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-hy3n-gold"
              />
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Display name"
                className="px-3 py-2 bg-hy3n-bg border border-hy3n-border rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-hy3n-gold"
              />
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="px-3 py-2 bg-hy3n-bg border border-hy3n-border rounded-lg text-white text-sm focus:outline-none focus:border-hy3n-gold"
              >
                <option value="admin">Admin</option>
                <option value="viewer">Viewer (read-only)</option>
              </select>
            </div>
            <div className="flex gap-2 mt-3">
              <button
                onClick={addAdmin}
                disabled={saving || !newEmail}
                className="px-4 py-2 bg-hy3n-gold text-black text-sm font-medium rounded-lg disabled:opacity-50 hover:bg-hy3n-gold/90 transition"
              >
                {saving ? "Adding..." : "Add to Whitelist"}
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-white/5 text-white text-sm rounded-lg hover:bg-white/10 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Super admins (always shown) */}
        <div className="px-6 py-3 border-b border-hy3n-border/50">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-2">Super Admins (permanent)</p>
          {SUPER_ADMIN_EMAILS.map(email => (
            <div key={email} className="flex items-center gap-3 py-2">
              <div className="w-8 h-8 rounded-full bg-hy3n-gold/20 flex items-center justify-center">
                <Shield size={14} className="text-hy3n-gold" />
              </div>
              <div className="flex-1">
                <p className="text-white text-sm font-medium">{email}</p>
                <p className="text-xs text-hy3n-gold">Super Admin (cannot be removed)</p>
              </div>
              <span className="px-2 py-0.5 bg-green-500/10 text-green-400 text-xs rounded-full font-medium">Active</span>
            </div>
          ))}
        </div>

        {/* Admin list */}
        <div className="divide-y divide-hy3n-border/50">
          {admins.length === 0 && (
            <div className="px-6 py-8 text-center text-muted-foreground text-sm">
              No additional admins added yet. Click "Add Admin" to invite team members.
            </div>
          )}
          {admins.map(admin => (
            <div key={admin.id} className={`px-6 py-3 flex items-center gap-3 ${!admin.is_active ? "opacity-50" : ""}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${admin.is_active ? "bg-green-500/10" : "bg-red-500/10"}`}>
                {admin.is_active ? <CheckCircle size={14} className="text-green-400" /> : <XCircle size={14} className="text-red-400" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-sm font-medium truncate">{admin.name || admin.email}</p>
                <p className="text-xs text-muted-foreground">{admin.email}</p>
              </div>
              <div className="hidden sm:block text-right">
                <p className="text-xs text-muted-foreground">
                  {admin.last_login ? `Last login: ${new Date(admin.last_login).toLocaleDateString()}` : "Never logged in"}
                </p>
                <p className="text-xs text-muted-foreground capitalize">{admin.role}</p>
              </div>
              <div className="flex items-center gap-1">
                {admin.is_active ? (
                  <span className="px-2 py-0.5 bg-green-500/10 text-green-400 text-xs rounded-full font-medium">Active</span>
                ) : (
                  <span className="px-2 py-0.5 bg-red-500/10 text-red-400 text-xs rounded-full font-medium">Revoked</span>
                )}
              </div>
              {isSuperAdmin() && (
                <div className="flex items-center gap-1 ml-2">
                  {admin.is_active ? (
                    <button
                      onClick={() => revokeAccess(admin)}
                      className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition"
                      title="Revoke access"
                    >
                      <XCircle size={16} />
                    </button>
                  ) : (
                    <button
                      onClick={() => restoreAccess(admin)}
                      className="p-1.5 text-green-400 hover:bg-green-500/10 rounded-lg transition"
                      title="Restore access"
                    >
                      <RefreshCw size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => deleteAdmin(admin)}
                    className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition"
                    title="Delete permanently"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Security Info */}
      <div className="bg-hy3n-surface border border-hy3n-border rounded-2xl p-6">
        <h2 className="font-semibold text-white mb-3">How Admin Security Works</h2>
        <div className="space-y-3 text-sm text-muted-foreground">
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-hy3n-gold/10 text-hy3n-gold flex items-center justify-center text-xs font-bold shrink-0">1</span>
            <p><span className="text-white font-medium">Login:</span> User logs in with Google or email/password (Base44 auth)</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-hy3n-gold/10 text-hy3n-gold flex items-center justify-center text-xs font-bold shrink-0">2</span>
            <p><span className="text-white font-medium">Whitelist Check:</span> System verifies the user's email is in the admin whitelist (super admin list or AdminAccess entity)</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-hy3n-gold/10 text-hy3n-gold flex items-center justify-center text-xs font-bold shrink-0">3</span>
            <p><span className="text-white font-medium">Access Code:</span> User must enter the admin access code (second factor). Locks after 5 failed attempts for 30 minutes.</p>
          </div>
          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-hy3n-gold/10 text-hy3n-gold flex items-center justify-center text-xs font-bold shrink-0">4</span>
            <p><span className="text-white font-medium">Session:</span> Verification is stored per browser session. Closing the browser requires re-verification.</p>
          </div>
        </div>
        <div className="mt-4 p-3 bg-yellow-500/5 border border-yellow-500/20 rounded-xl">
          <p className="text-xs text-yellow-400 flex items-start gap-2">
            <AlertTriangle size={14} className="shrink-0 mt-0.5" />
            <span>To remove a former employee: Find them in the list above and click the revoke button. They will immediately lose access even if they know the access code.</span>
          </p>
        </div>
      </div>
    </div>
  );
}