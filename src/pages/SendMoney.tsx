const handlePayment = async () => {
  try {
    const numericAmount = Number(amount);

    if (!numericAmount || numericAmount <= 0) {
      alert("Enter a valid amount");
      return;
    }

    // Get logged in user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      alert("User not authenticated");
      return;
    }

    const userId = user.id;

    // 1️⃣ Get current balance
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("balance")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      alert("Could not fetch balance");
      return;
    }

    if (profile.balance < numericAmount) {
      alert("Insufficient balance");
      return;
    }

    // 2️⃣ Deduct balance safely
    const newBalance = profile.balance - numericAmount;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ balance: newBalance })
      .eq("id", userId);

    if (updateError) {
      alert("Failed to update balance");
      return;
    }

    // 3️⃣ Generate secure token
    const tokenId = crypto.randomUUID();

    // 4️⃣ Insert transaction
    const { error: txError } = await supabase
      .from("transactions")
      .insert({
        sender_id: userId,
        amount: numericAmount,
        token_id: tokenId,
        status: "completed",
      });

    if (txError) {
      alert("Transaction failed");
      return;
    }

    // 5️⃣ Navigate to success page
    navigate("/success", { state: { amount: numericAmount } });

  } catch (err) {
    console.error("Payment error:", err);
    alert("Something went wrong");
  }
};
