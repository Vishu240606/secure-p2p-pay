import { useState } from "react";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

export default function SendMoney() {
  const [amount, setAmount] = useState("");
  const navigate = useNavigate();

  const handlePayment = async () => {
    const numericAmount = Number(amount);
    if (!numericAmount) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("balance")
      .eq("id", user.id)
      .single();

    if (!profile) return;

    if (profile.balance < numericAmount) {
      alert("Insufficient balance");
      return;
    }

    const newBalance = profile.balance - numericAmount;

    await supabase
      .from("profiles")
      .update({ balance: newBalance })
      .eq("id", user.id);

    const tokenId = crypto.randomUUID();

    await supabase.from("transactions").insert({
      sender_id: user.id,
      amount: numericAmount,
      token_id: tokenId,
      status: "completed",
    });

    navigate("/success", { state: { amount: numericAmount } });
  };

  return (
    <div className="p-6 text-white">
      <h1 className="text-xl mb-4">Send Money</h1>

      <input
        type="number"
        placeholder="Enter amount"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="p-2 text-black"
      />

      <button
        onClick={handlePayment}
        className="ml-4 bg-green-500 px-4 py-2"
      >
        Send
      </button>
    </div>
  );
}
