import React, { useState, useEffect } from "react";
import axios from "axios";
import "./GiftCard.css";

const BACKEND_URL = "https://giftcardbackend-yjp5.onrender.com"; // ✅ Replace with your backend URL

const GiftCard = () => {
  const [giftCards, setGiftCards] = useState([]);
  const [email, setEmail] = useState("");
  const [txnId, setTxnId] = useState("");
  const [selectedCard, setSelectedCard] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchGiftCards() {
      try {
        const res = await axios.get(`${BACKEND_URL}/api/cards`);
        setGiftCards(res.data);
      } catch (err) {
        console.error("Error loading cards", err);
      }
    }
    fetchGiftCards();
  }, []);

  const generateQR = async (cardId) => {
    if (!email) return alert("Enter your email first!");
    setLoading(true);
    setSelectedCard(cardId);
    setMessage("");

    try {
      const res = await axios.post(`${BACKEND_URL}/api/create-order`, {
        email,
        cardId,
      });
      if (res.data.success) {
        setGiftCards((prev) =>
          prev.map((c) =>
            c.id === cardId
              ? {
                  ...c,
                  qrImage: res.data.qrImage,
                  upi: res.data.upi,
                  orderId: res.data.orderId,
                  payable: res.data.amount,
                  status: "processing",
                }
              : c
          )
        );
        setMessage("✅ Scan the Paytm QR and complete your payment.");
      } else {
        setMessage("❌ Failed to generate QR.");
      }
    } catch (err) {
      console.error("Server error:", err);
      setMessage("❌ Server error.");
    }
    setLoading(false);
  };

  const verifyPayment = async (cardId, orderId) => {
    if (!email || !txnId)
      return alert("Enter your email and UPI transaction ID!");
    setLoading(true);
    setMessage("⏳ Verifying payment...");

    try {
      const res = await axios.post(`${BACKEND_URL}/api/verify-payment`, {
        email,
        txnId,
        orderId,
        cardId,
      });

      if (res.data.success) {
        setGiftCards((prev) =>
          prev.map((c) => (c.id === cardId ? { ...c, status: "verified" } : c))
        );
        setMessage("✅ Payment verified! Gift card sent to your email.");
      } else {
        setMessage("❌ " + res.data.message);
      }
    } catch (err) {
      console.error("Verification error:", err);
      setMessage("❌ Verification error.");
    }
    setLoading(false);
  };

  return (
    <div className="giftcard-page" onContextMenu={(e) => e.preventDefault()}>
      <h1>🎁 Gift Card Store</h1>

      <div className="email-input">
        <input
          type="email"
          placeholder="Enter your email to receive the gift card"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="cards-container">
        {giftCards.map((card) => (
          <div
            key={card.id}
            className={`giftcard-card ${
              card.status === "soldout" ? "card-disabled" : ""
            }`}
          >
            <div
              className={`giftcard-image ${
                card.status !== "verified" ? "blurred" : ""
              }`}
            >
              <img
                src={`${BACKEND_URL}${card.image}`}
                alt={card.brand}
                draggable="false"
              />
              <div
                className={`status-badge ${
                  card.status === "verified"
                    ? "verified"
                    : card.status === "soldout"
                    ? "sold-out"
                    : "available"
                }`}
              >
                {card.status === "verified"
                  ? "✅ Verified"
                  : card.status === "soldout"
                  ? "🔴 Sold Out"
                  : "🟢 Available"}
              </div>
            </div>

            <h2>{card.brand}</h2>
            <p>
              Value: <strong>{card.value}</strong>
            </p>
            <p>Expiry: {card.expiry}</p>
            <p>
              Payable: <strong>{card.payable}</strong>
            </p>

            {card.qrImage && card.status !== "soldout" ? (
              <div className="qr-section">
                <img
                  src={card.qrImage}
                  alt="Paytm QR"
                  className="qr-image"
                  draggable="false"
                />
                <p>
                  Pay <strong>{card.payable}</strong> to{" "}
                  <strong>{card.upi}</strong>
                </p>
                <input
                  type="text"
                  placeholder="Enter UPI Transaction ID"
                  value={txnId}
                  onChange={(e) => setTxnId(e.target.value)}
                />
                <button
                  onClick={() => verifyPayment(card.id, card.orderId)}
                  disabled={loading}
                >
                  {loading ? "Verifying..." : "Verify Payment"}
                </button>
              </div>
            ) : (
              card.status !== "soldout" && (
                <button
                  onClick={() => generateQR(card.id)}
                  disabled={loading || card.status === "verified"}
                >
                  {loading && selectedCard === card.id
                    ? "Generating..."
                    : card.status === "verified"
                    ? "🎉 Purchased"
                    : "🧾 Pay via Paytm"}
                </button>
              )
            )}
          </div>
        ))}
      </div>

      {message && <div className="status-message">{message}</div>}
    </div>
  );
};

export default GiftCard;
