import React, { useState, useEffect } from "react";
import axios from "axios";
import "./GiftCard.css";

const BACKEND_URL = "https://your-backend-url.onrender.com"; // change this

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
        const res = await axios.get(`${BACKEND_URL}/api/payments`);
        setGiftCards(res.data);
      } catch {
        setGiftCards([
          {
            id: 1,
            brand: "EasyMyTrip Hotels Gift Card",
            value: "₹500",
            expiry: "22 Oct 2026",
            image:
              "https://www.dropbox.com/scl/fi/x8ohhl0z5g88eew3rb4ab/easymytrip.png?raw=1",
            status: "available",
          },
          {
            id: 2,
            brand: "Resonate Gift Card",
            value: "₹1000",
            expiry: "22 Oct 2026",
            image:
              "https://www.dropbox.com/scl/fi/pxcih0ejv03yc0jf2b5or/resonategiftcard.png?raw=1",
            status: "available",
          },
        ]);
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
          prev.map((card) =>
            card.id === cardId
              ? {
                  ...card,
                  qrImage: res.data.qrImage,
                  upi: res.data.upi,
                  orderId: res.data.orderId,
                  payable: res.data.amount,
                }
              : card
          )
        );
        setMessage("✅ Scan QR or pay via Paytm UPI ID below!");
      } else {
        setMessage("❌ Failed to generate QR.");
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Error creating order.");
    }
    setLoading(false);
  };

  const verifyPayment = async (cardId, orderId) => {
    if (!email || !txnId) return alert("Enter your email and transaction ID!");

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
          prev.map((card) =>
            card.id === cardId ? { ...card, status: "verified" } : card
          )
        );
        setMessage("✅ Verified! Gift card sent to your email!");
      } else {
        setMessage("❌ " + res.data.message);
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Verification error.");
    }
    setLoading(false);
  };

  return (
    <div className="giftcard-page">
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
              <img src={card.image} alt={card.brand} />
              <div className="status-badge">
                {card.status === "verified" ? "✅ Verified" : "🔒 Locked"}
              </div>
            </div>

            <h2>{card.brand}</h2>
            <p>
              Value: <strong>{card.value}</strong>
            </p>
            <p>Expiry: {card.expiry}</p>

            {card.qrImage ? (
              <div className="qr-section">
                <img src={card.qrImage} alt="Paytm QR" className="qr-image" />
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
            )}
          </div>
        ))}
      </div>

      {message && <div className="status-message">{message}</div>}
    </div>
  );
};

export default GiftCard;
