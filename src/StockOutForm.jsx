import React, { useState, useEffect } from "react";

function StockOutForm({ item, onClose, refresh }) {
  const [form, setForm] = useState({
    quantityUsed: "",
    notes: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Date is now handled automatically by the system
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    const quantity = parseInt(form.quantityUsed, 10);
    if (isNaN(quantity) || quantity <= 0) {
      return "Quantity Used must be a positive number.";
    }
    if (quantity > item.quantity) {
      return `Quantity Used cannot exceed current stock of ${item.quantity}.`;
    }
    return "";
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }

    setLoading(true);
    setError("");

    const params = new URLSearchParams();
    params.append("quantity", parseInt(form.quantityUsed, 10));
    if (form.notes) {
      params.append("notes", form.notes);
    }

    try {
      const res = await fetch(`https://nlsggvdz4dj5mwxtfakcees27m0isgkf.lambda-url.ap-southeast-2.on.aws/inventory/${item.id}/use?${params.toString()}`, {
        method: "POST"
      });

      if (!res.ok) {
        const errData = await res.json();
        setError(errData.detail || "Failed to submit stock-out.");
        setLoading(false);
        return;
      }

      refresh();
      onClose();
    } catch (fetchError) {
      setError("Unable to connect to the server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="item-form-overlay">
      <div className="item-form-modal">
        <div className="item-form-header">
          <h3 className="form-title">Stock Out</h3>
          <button className="close-btn" onClick={onClose}>✖</button>
        </div>

        {error && <p className="form-error">{error}</p>}

        <div className="item-form-grid">
          <div className="form-group">
            <label className="form-label" htmlFor="stockout-quantity">Quantity Used</label>
            <input
              id="stockout-quantity"
              type="number"
              name="quantityUsed"
              value={form.quantityUsed}
              onChange={handleChange}
              className="form-input"
              placeholder="Enter quantity used"
              min="1"
            />
          </div>

          <div className="form-group" style={{ gridColumn: "span 2" }}>
            <label className="form-label" htmlFor="stockout-notes">Reason / Notes</label>
            <textarea
              id="stockout-notes"
              name="notes"
              value={form.notes}
              onChange={handleChange}
              className="form-input"
              rows="4"
              placeholder="Enter reason or notes"
              style={{ resize: "vertical" }}
            />
          </div>

        </div>

        <div className="item-form-actions">
          <button className="primary-btn" onClick={handleSubmit} disabled={loading}>
            {loading ? "Submitting..." : "Submit Stock-Out"}
          </button>
          <button className="secondary-btn" onClick={onClose} disabled={loading}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default StockOutForm;
