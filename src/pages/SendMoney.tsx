import { supabase } from "../lib/supabase";
import { v4 as uuidv4 } from "uuid";

import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function SendMoney() {
  const [amount, setAmount] = useState("");
  const navigate = useNavigate();

  const handleSend = () => {
    if (!amount) return;
    navigate("/proximity", { state: { amount } });
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center p-6">
      
      <h1 className="text-2xl font-semibold mb-8">Send Money</h1>

      <div className="text-5xl font-bold mb-8">
        ₹ {amount || "0"}
      </div>

      <div className="grid grid-cols-3 gap-4 w-full max-w-xs">
        {[1,2,3,4,5,6,7,8,9,"",0,"←"].map((num, i) => (
          <button
            key={i}
            onClick={() => {
              if (num === "←") setAmount(amount.slice(0, -1));
              else if (num !== "") setAmount(amount + num);
            }}
            className="bg-gray-800 rounded-xl py-4 text-xl hover:bg-gray-700"
          >
            {num}
          </button>
        ))}
      </div>

      <button
        onClick={handleSend}
        className="mt-8 bg-emerald-500 px-8 py-3 rounded-xl font-semibold hover:bg-emerald-400 transition"
      >
        Continue
      </button>
    </div>
  );
}
