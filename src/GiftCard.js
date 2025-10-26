import React, { useState, useEffect } from "react";
import axios from "axios";
import "./GiftCard.css";

const BACKEND_URL = "https://giftcardbackend-yjp5.onrender.com"; // 🔗 Replace with your backend URL

const GiftCard = () => {
  const [giftCards, setGiftCards] = useState([]);
  const [email, setEmail] = useState("");
  const [txnId, setTxnId] = useState("");
  const [selectedCard, setSelectedCard] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // 🟢 Fetch available cards
  useEffect(() => {
    async function fetchCards() {
      try {
        const res = await axios.get(`${BACKEND_URL}/api/cards`);
        setGiftCards(res.data);
      } catch (err) {
        console.error("Error loading cards:", err);
      }
    }
    fetchCards();
  }, []);

  // 🧾 Generate QR
  const generateQR = async (cardId) => {
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
                  upi: res.data.upi,
                  orderId: res.data.orderId,
                  payable: res.data.amount,
                  status: "processing",
                }
              : c
          )
        );
        setMessage("✅ Scan the Paytm QR to complete your payment.");
      } else {
        setMessage("❌ Failed to generate QR.");
      }
    } catch (err) {
      console.error(err);
      setMessage("❌ Server error while generating QR.");
    }

    setLoading(false);
  };

  // 🟩 Verify Payment
  const verifyPayment = async (cardId, orderId) => {
    if (!email || !txnId)
      return alert("Enter both email and UPI Transaction ID.");

    setLoading(true);
    setMessage("⏳ Verifying your payment...");

    try {
      const res = await axios.post(`${BACKEND_URL}/api/verify-payment`, {
        email,
        txnId,
        orderId,
        cardId,
      });

      if (res.data.success) {
        setGiftCards((prev) =>
          prev.map((c) =>
            c.id === cardId
              ? { ...c, status: "verified", downloadUrl: res.data.downloadUrl }
              : c
          )
        );
        setMessage("✅ Payment verified! Gift card sent to your email.");
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
    <div className="giftcard-page" onContextMenu={(e) => e.preventDefault()}>
       <div className="contact-admin">
        <p>
          📧 Need help? Contact Admin:{" "}
          <a href="mailto:srajendra923@gmail.com">srajendra923@gmail.com</a>
        </p>
      </div>
      <h1>🎁 Gift Card Store</h1>

      <div className="email-input">
        <input
          type="email"
          placeholder="Enter your email to receive your gift card"
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
            {/* 🔒 Image section (blurred until verified) */}
            <div
              className={`giftcard-image ${
                card.status !== "verified" ? "blurred" : ""
              }`}
            >
              <img
                src={`${BACKEND_URL}${card.image}`}
                alt={card.brand}
                draggable="false"
                onContextMenu={(e) => e.preventDefault()}
              />
              <div className={`status-badge ${card.status || "available"}`}>
                {card.status === "verified"
                  ? "✅ Verified"
                  : card.status === "soldout"
                  ? "🔴 Sold Out"
                  : "🟢 Available"}
              </div>
            </div>

            {/* Gift Card Details */}
            <h2>{card.brand}</h2>
            <p>
              Value: <strong>{card.value}</strong>
            </p>
            <p>Expiry: {card.expiry}</p>
            <p>
              Payable Amount: <strong>₹{card.payable}</strong>
            </p>

            {/* Payment QR section */}
            {card.qrImage && card.status !== "soldout" ? (
              <div className="qr-section">
                <img
                  src={card.qrImage}
                  alt="Paytm QR"
                  className="qr-image"
                  draggable="false"
                />
               
                <input
                  type="text"
                  placeholder="Enter UPI Transaction ID (e.g. T123456789)"
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

            {/* ✅ Download button (only when verified) */}
            {card.status === "verified" && card.downloadUrl && (
              <a
                href={card.downloadUrl}
                className="download-btn"
                download
                target="_blank"
                rel="noreferrer"
              >
                ⬇️ Download Gift Card
              </a>
            )}
          </div>
        ))}
      </div>

      {message && <div className="status-message">{message}</div>}
    </div>
  );
};

export default GiftCard;
