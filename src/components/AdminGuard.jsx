import { useEffect, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { base44 } from "@/api/base44Client";

export default function AdminGuard() {
  const [status, setStatus] = useState("loading"); // loading | admin | user | unauthenticated

  useEffect(() => {
    base44.auth.isAuthenticated().then(async (authed) => {
      if (!authed) { setStatus("unauthenticated"); return; }
      const user = await base44.auth.me();
      setStatus(user?.role === "admin" ? "admin" : "user");
    });
  }, []);

  if (status === "loading") return (
    <div className="fixed inset-0 flex items-center justify-center bg-hy3n-bg">
      <div className="w-8 h-8 border-4 border-hy3n-gold/30 border-t-hy3n-gold rounded-full animate-spin" />
    </div>
  );

  if (status === "unauthenticated") return <Navigate to="/login" replace />;

  if (status === "user") return (
    <div className="fixed inset-0 flex items-center justify-center bg-hy3n-bg">
      <div className="text-center space-y-3">
        <div className="text-4xl">🚫</div>
        <h2 className="text-white font-bold text-xl">Admin Access Only</h2>
        <p className="text-muted-foreground text-sm">Your account does not have admin privileges.</p>
        <button onClick={() => base44.auth.logout()} className="mt-4 px-4 py-2 bg-hy3n-red text-white rounded-xl text-sm">
          Sign Out
        </button>
      </div>
    </div>
  );

  return <Outlet />;
}