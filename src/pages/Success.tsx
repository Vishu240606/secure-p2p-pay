import { useLocation, useNavigate } from "react-router-dom";

export default function Success() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-6">

      <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mb-6 animate-bounce">
        ✓
      </div>

      <h2 className="text-2xl font-semibold mb-2">
        Payment Successful
      </h2>

      <div className="text-lg mb-6">
        ₹ {location.state?.amount}
      </div>

      <button
        onClick={() => navigate("/dashboard")}
        className="bg-emerald-500 px-8 py-3 rounded-xl font-semibold hover:bg-emerald-400"
      >
        Back to Dashboard
      </button>

    </div>
  );
}
