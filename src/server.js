import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// Fake payment verification example
app.post("/api/verify-payment", (req, res) => {
  const { txnId } = req.body;

  // Simulate verification (replace with real API check)
  if (txnId && txnId.startsWith("UPI")) {
    return res.json({ success: true });
  } else {
    return res.json({ success: false });
  }
});

app.listen(4000, () => console.log("✅ Backend running on port 4000"));
