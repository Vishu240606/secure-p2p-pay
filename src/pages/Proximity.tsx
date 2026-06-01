import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function Proximity() {
  const [status, setStatus] = useState<"searching" | "connected">("searching");
  const location = useLocation();
  const navigate = useNavigate();
  const state = (location.state ?? {}) as { amount?: number };

  useEffect(() => {
    const t = setTimeout(() => setStatus("connected"), 3000);
    return () => clearTimeout(t);
  }, []);

  const sessionCode = String(Math.floor(100000 + Math.random() * 900000));

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6">
      {status === "searching" && (
        <>
          <div className="animate-pulse text-lg mb-6">Searching nearby device…</div>
          <div className="w-24 h-24 border-4 border-primary rounded-full animate-spin" />
        </>
      )}

      {status === "connected" && (
        <>
          <div className="text-primary text-xl mb-4">Secure connection established</div>
          <div className="glass-card px-6 py-4 rounded-xl text-3xl font-mono mb-6">
            {sessionCode}
          </div>
          <button
            onClick={() => navigate("/success", { state: { amount: state.amount ?? 0 } })}
            className="rounded-xl bg-primary px-8 py-3 font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Confirm Payment
          </button>
        </>
      )}
    </div>
  );
}
