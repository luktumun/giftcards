import React, { useState, useEffect } from "react";
import "./GiftCard.css";

const BACKEND_URL =
  "https://giftcardbackend-yjp5.onrender.com/api/verify-payment";

const GiftCard = () => {
  const [paidStatus, setPaidStatus] = useState({});
  const [emailInputs, setEmailInputs] = useState({});
  const [transactionInputs, setTransactionInputs] = useState({});
  const [errorMessages, setErrorMessages] = useState({});
  const [loadingCards, setLoadingCards] = useState({});
  const [soldOutCards, setSoldOutCards] = useState([]);

  const giftCards = [
    {
      id: 1,
      image:
        "https://www.dropbox.com/scl/fi/x8ohhl0z5g88eew3rb4ab/easymytrip.png?rlkey=0v2i8vfj30f8ltjexpb56lo0m&st=xkpwjqkn&raw=1",
      brand: "EasyMyTrip Hotels Gift Card",
      value: "₹500",
      expiry: "22 Oct 2026",
      qr: "https://www.dropbox.com/scl/fi/qnaiq9lklrm1iqloo1lra/GooglePay_QR-1.png?rlkey=cwb79tt5xz8881hpcwmdvvj5q&st=k9vvo6g9&raw=1",
      upi: "srajendra923@oksbi",
      PayableAmount: "₹470",
    },
    {
      id: 2,
      image:
        "https://www.dropbox.com/scl/fi/pxcih0ejv03yc0jf2b5or/resonategiftcard.png?rlkey=igue5elo0p7bll2axuvsy81ys&st=oenogrg3&raw=1",
      brand: "Resonate Gift Card",
      value: "₹1000",
      expiry: "22 Oct 2026",
      qr: "https://www.dropbox.com/scl/fi/gle86dz3w1lgsr1sj5c3n/GooglePay_QR-2.png?rlkey=ald4pc7cpg19ux08smjrsx76u&st=hfrou4vh&raw=1",
      upi: "srajendra923@oksbi",
      PayableAmount: "₹830",
    },
  ];

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem("giftCardPayments")) || {};
    setPaidStatus(stored);
  }, []);

  const handleEmailChange = (cardId, value) => {
    setEmailInputs((prev) => ({ ...prev, [cardId]: value }));
    setErrorMessages((prev) => ({ ...prev, [cardId]: "" }));
  };

  const handleTxnChange = (cardId, value) => {
    setTransactionInputs((prev) => ({ ...prev, [cardId]: value }));
    setErrorMessages((prev) => ({ ...prev, [cardId]: "" }));
  };

  const handleConfirmPayment = async (cardId) => {
    const email = emailInputs[cardId];
    const txnId = transactionInputs[cardId];

    if (!email || !txnId) {
      setErrorMessages((prev) => ({
        ...prev,
        [cardId]: "⚠️ Please enter your email and transaction ID.",
      }));
      return;
    }

    setLoadingCards((prev) => ({ ...prev, [cardId]: true }));

    try {
      const res = await fetch(BACKEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, txnId, cardId }),
      });

      const data = await res.json();

      if (data.success) {
        const stored =
          JSON.parse(localStorage.getItem("giftCardPayments")) || {};
        const updated = {
          ...stored,
          [email]: [...(stored[email] || []), cardId],
        };
        localStorage.setItem("giftCardPayments", JSON.stringify(updated));
        setPaidStatus(updated);
        setSoldOutCards((prev) => [...prev, cardId]);
        setErrorMessages((prev) => ({ ...prev, [cardId]: "" }));
      } else {
        setErrorMessages((prev) => ({
          ...prev,
          [cardId]:
            "❌ Payment not verified. Please check your UPI Transaction ID.",
        }));
      }
    } catch (error) {
      console.error("Error verifying payment:", error);
      setErrorMessages((prev) => ({
        ...prev,
        [cardId]: "⚠️ Server error. Try again later.",
      }));
    }

    setLoadingCards((prev) => ({ ...prev, [cardId]: false }));
  };

  return (
    <div className="card-container">
      <h2>🎁 Unlock Your Gift Cards</h2>

      <div className="cards-wrapper">
        {giftCards.map((card) => {
          const email = emailInputs[card.id] || "";
          const txn = transactionInputs[card.id] || "";
          const isPaidByUser = paidStatus[email]?.includes(card.id);
          const isSoldOut = soldOutCards.includes(card.id) && !isPaidByUser;
          const cardError = errorMessages[card.id];

          // Determine status text
          const statusText = isPaidByUser
            ? "✅ Payment Verified"
            : isSoldOut
            ? "❌ Sold Out"
            : "🟡 Available";

          const statusClass = isPaidByUser
            ? "status-verified"
            : isSoldOut
            ? "status-soldout"
            : "status-available";

          return (
            <div className="card-block" key={card.id}>
              <div
                className={`card-image ${isPaidByUser ? "clear" : "blurred"}`}
              >
                <img src={card.image} alt={card.brand} />
              </div>

              <div className={`card-status ${statusClass}`}>{statusText}</div>

              <div className="card-details">
                <p>
                  <strong>Brand:</strong> {card.brand}
                </p>
                <p>
                  <strong>Value:</strong> {card.value}
                </p>
                <p>
                  <strong>Expiry:</strong> {card.expiry}
                </p>
                <p>
                  <strong>Payable Amount:</strong> {card.PayableAmount}
                </p>

                {/* QR code always visible */}
                <div className="qr-section">
                  <p>Scan to Pay via Google Pay</p>
                  <a href={card.qr} target="_blank" rel="noopener noreferrer">
                    <img src={card.qr} alt="QR Code" className="qr-code" />
                  </a>
                  <p className="upi-id">UPI ID: {card.upi}</p>
                </div>

                <input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => handleEmailChange(card.id, e.target.value)}
                  className="email-input"
                />

                {email && (
                  <input
                    type="text"
                    placeholder="Enter UPI Transaction ID"
                    value={txn}
                    onChange={(e) => handleTxnChange(card.id, e.target.value)}
                    className="txn-input"
                  />
                )}

                {cardError && <p className="error-message">{cardError}</p>}

                {email && !isPaidByUser && !isSoldOut && (
                  <button
                    onClick={() => handleConfirmPayment(card.id)}
                    disabled={loadingCards[card.id]}
                  >
                    {loadingCards[card.id] ? "Verifying..." : "I’ve Paid"}
                  </button>
                )}

                {isPaidByUser && (
                  <>
                    <a href={card.image} download className="download-link">
                      ⬇️ Download Gift Card
                    </a>
                    <p className="success-message">
                      ✅ Gift card unlocked for {email}.
                    </p>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GiftCard;
