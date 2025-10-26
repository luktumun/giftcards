import React, { useState, useEffect } from "react";
import axios from "axios";
import "./GiftCard.css";

const BACKEND_URL = "https://giftcardbackend-yjp5.onrender.com"; // change this

const GiftCard = () => {
  const [giftCards, setGiftCards] = useState([]);
  const [email, setEmail] = useState("");
  const [selectedCard, setSelectedCard] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadCards() {
      try {
        const res = await axios.get(`${BACKEND_URL}/api/cards`);
        setGiftCards(res.data);
      } catch (err) {
        console.error("Error fetching cards:", err);
      }
    }
    loadCards();
  }, []);

  const createOrder = async (cardId) => {
    if (!email) return alert("Please enter your email first!");
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
                  orderId: res.data.orderId,
                  upi: res.data.upi,
                  payable: res.data.amount,
                  status: "processing",
                }
              : c
          )
        );
        setMessage("✅ Scan Paytm QR and complete your payment.");
      } else {
        setMessage("❌ Failed to create order.");
      }
    } catch {
      setMessage("❌ Server error while creating order.");
    }
    setLoading(false);
  };

  const verifyPayment = async (cardId, orderId) => {
    setLoading(true);
    setMessage("⏳ Checking payment status...");
    try {
      const res = await axios.post(`${BACKEND_URL}/api/verify-payment`, {
        orderId,
      });
      if (res.data.success) {
        setGiftCards((prev) =>
          prev.map((c) => (c.id === cardId ? { ...c, status: "verified" } : c))
        );
        setMessage("✅ Payment verified! Gift card sent to your email.");
      } else {
        setMessage("❌ " + res.data.message);
      }
    } catch {
      setMessage("❌ Error verifying payment.");
    }
    setLoading(false);
  };

  return (
    <div className="giftcard-page" onContextMenu={(e) => e.preventDefault()}>
      <h1>🎁 Gift Card Store</h1>

      <div className="email-input">
        <input
          type="email"
          placeholder="Enter your email to receive the card"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="cards-container">
        {giftCards.map((card) => (
          <div key={card.id} className="giftcard-card">
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
              <div className={`status-badge ${card.status || "available"}`}>
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
            <p>
              Payable: <strong>₹{card.payable}</strong>
            </p>
            <p>Expiry: {card.expiry}</p>

            {card.qrImage && (
              <div className="qr-section">
                <img src={card.qrImage} alt="QR Code" className="qr-image" />
                <p>
                  Pay ₹{card.payable} to {card.upi}
                </p>
                <button
                  onClick={() => verifyPayment(card.id, card.orderId)}
                  disabled={loading}
                >
                  {loading ? "Checking..." : "Verify Payment"}
                </button>
              </div>
            )}

            {!card.qrImage && (
              <button
                onClick={() => createOrder(card.id)}
                disabled={loading || card.status === "verified"}
              >
                {loading && selectedCard === card.id
                  ? "Generating..."
                  : card.status === "verified"
                  ? "🎉 Purchased"
                  : "🧾 Pay via Paytm"}
              </button>
            )}
          </div>
        ))}
      </div>

      {message && <div className="status-message">{message}</div>}
    </div>
  );
};

export default GiftCard;
