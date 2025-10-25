import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import dotenv from "dotenv";
import Payment from "./models/Payment.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ✅ Verify payment endpoint
app.post("/api/verify-payment", async (req, res) => {
  const { email, txnId, cardId } = req.body;

  if (!email || !txnId || !cardId) {
    return res
      .status(400)
      .json({ success: false, message: "Missing required fields" });
  }

  try {
    // 🔹 Check if card is already sold
    const sold = await Payment.findOne({ cardId, status: "verified" });
    if (sold) {
      return res.json({
        success: false,
        message: "This gift card is already sold out.",
        soldOut: true,
      });
    }

    // 🔹 Check if transaction ID was used before
    const existingTxn = await Payment.findOne({ txnId });
    if (existingTxn) {
      return res.json({
        success: true,
        message: "Transaction already verified earlier.",
      });
    }

    // Create a new payment record
    const newPayment = new Payment({
      email,
      txnId,
      cardId,
      status: "pending",
    });
    await newPayment.save();

    // 🔹 Simulate verification: if txnId starts with "UPI", mark verified
    if (txnId.startsWith("UPI")) {
      newPayment.status = "verified";
      await newPayment.save();
      return res.json({
        success: true,
        message: "✅ Payment verified successfully",
      });
    } else {
      return res.json({
        success: false,
        message: "Payment could not be verified automatically.",
      });
    }
  } catch (error) {
    console.error("Error verifying payment:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});

// ✅ Fetch all sold-out cards
app.get("/api/sold-out", async (req, res) => {
  try {
    // find all cards where status = verified
    const verifiedPayments = await Payment.find({ status: "verified" });
    const soldOutCards = verifiedPayments.map((p) => p.cardId);
    res.json({ soldOutCards });
  } catch (error) {
    console.error("Error fetching sold-out cards:", error);
    res.status(500).json({ soldOutCards: [] });
  }
});

// ✅ Admin: view all payments
app.get("/api/payments", async (req, res) => {
  try {
    const payments = await Payment.find().sort({ createdAt: -1 });
    res.json(payments);
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Error fetching payments" });
  }
});

// ✅ Admin: manually mark a payment as verified
app.post("/api/payments/verify", async (req, res) => {
  const { txnId } = req.body;
  try {
    const payment = await Payment.findOne({ txnId });
    if (!payment)
      return res.status(404).json({ success: false, message: "Txn not found" });

    payment.status = "verified";
    await payment.save();
    res.json({ success: true, message: "Payment marked as verified" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Error updating payment" });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
