require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const crypto = require("crypto");

const app = express();
app.use(cors());
app.use(express.json());

/* =========================
   DATABASE CONNECTION
========================= */

mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/secure_p2p", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));


/* =========================
   USER MODEL
========================= */

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  balance: { type: Number, default: 10000 }
});

const User = mongoose.model("User", userSchema);


/* =========================
   TRANSACTION MODEL
========================= */

const transactionSchema = new mongoose.Schema({
  sender: String,
  receiver: String,
  amount: Number,
  sessionCode: String,
  hash: String,
  status: { type: String, default: "SUCCESS" },
  createdAt: { type: Date, default: Date.now }
});

const Transaction = mongoose.model("Transaction", transactionSchema);


/* =========================
   PAYMENT ENGINE LOGIC
========================= */

app.post("/api/payment/send", async (req, res) => {
  try {
    const { senderEmail, receiverEmail, amount, sessionCode } = req.body;

    // 1️⃣ Validate input
    if (!senderEmail || !receiverEmail || !amount || !sessionCode) {
      return res.status(400).json({ message: "All fields required" });
    }

    if (senderEmail === receiverEmail) {
      return res.status(400).json({ message: "Cannot send money to yourself" });
    }

    if (amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    // 2️⃣ Find users
    const sender = await User.findOne({ email: senderEmail });
    const receiver = await User.findOne({ email: receiverEmail });

    if (!sender || !receiver) {
      return res.status(404).json({ message: "User not found" });
    }

    // 3️⃣ Check balance
    if (sender.balance < amount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    // 4️⃣ Secure transaction hash
    const hash = crypto
      .createHash("sha256")
      .update(senderEmail + receiverEmail + amount + sessionCode + Date.now())
      .digest("hex");

    // 5️⃣ Deduct and credit
    sender.balance -= amount;
    receiver.balance += amount;

    await sender.save();
    await receiver.save();

    // 6️⃣ Store transaction
    const transaction = await Transaction.create({
      sender: senderEmail,
      receiver: receiverEmail,
      amount,
      sessionCode,
      hash
    });

    res.status(200).json({
      message: "Payment Successful",
      transaction
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


/* =========================
   CREATE DEMO USERS
========================= */

app.get("/api/setup-demo", async (req, res) => {
  await User.deleteMany();

  await User.create([
    { name: "User One", email: "user1@gmail.com", balance: 10000 },
    { name: "User Two", email: "user2@gmail.com", balance: 10000 }
  ]);

  res.json({ message: "Demo users created" });
});


/* =========================
   GET TRANSACTION HISTORY
========================= */

app.get("/api/transactions", async (req, res) => {
  const transactions = await Transaction.find().sort({ createdAt: -1 });
  res.json(transactions);
});


/* =========================
   START SERVER
========================= */

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
