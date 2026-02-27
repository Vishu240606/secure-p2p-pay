const handlePayment = async () => {
  const numericAmount = Number(amount);
  if (!numericAmount) return;

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id;
  if (!userId) return;

  // 1️⃣ Get current balance
  const { data: profile } = await supabase
    .from("profiles")
    .select("balance")
    .eq("id", userId)
    .single();

  if (!profile) return;

  if (profile.balance < numericAmount) {
    alert("Insufficient balance");
    return;
  }

  // 2️⃣ Deduct balance
  const newBalance = profile.balance - numericAmount;

  await supabase
    .from("profiles")
    .update({ balance: newBalance })
    .eq("id", userId);

  // 3️⃣ Generate secure token
  const tokenId = crypto.randomUUID();

  // 4️⃣ Insert transaction
  await supabase.from("transactions").insert({
    sender_id: userId,
    amount: numericAmount,
    token_id: tokenId,
    status: "completed",
  });

  navigate("/success", { state: { amount } });
};
