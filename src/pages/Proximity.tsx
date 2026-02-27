import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function Proximity() {
  const [status, setStatus] = useState("searching");
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setTimeout(() => setStatus("connected"), 3000);
  }, []);

  const sessionCode = Math.floor(100000 + Math.random() * 900000);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6">

      {status === "searching" && (
        <>
          <div className="animate-pulse text-lg mb-6">
            Searching nearby device...
          </div>
          <div className="w-24 h-24 border-4 border-emerald-500 rounded-full animate-spin"></div>
        </>
      )}

      {status === "connected" && (
        <>
          <div className="text-emerald-400 text-xl mb-4">
            Secure connection established
          </div>

          <div className="bg-gray-800 px-6 py-4 rounded-xl text-3xl font-mono mb-6">
            {sessionCode}
          </div>

          <button
            onClick={() => navigate("/success", { state: { amount: location.state.amount } })}
            className="bg-emerald-500 px-8 py-3 rounded-xl font-semibold hover:bg-emerald-400"
          >
            Confirm Payment
          </button>
        </>
      )}
    </div>
  );
}
