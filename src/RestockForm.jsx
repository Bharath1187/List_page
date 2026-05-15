import React, { useState, useEffect } from "react";

function RestockForm({ item, onClose, refresh }) {
  const [form, setForm] = useState({
    quantityAdded: "",
    supplier: "",
    unitCost: "",
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
    const quantity = parseInt(form.quantityAdded, 10);
    if (isNaN(quantity) || quantity <= 0) {
      return "Quantity Added must be a positive number.";
    }

    if (form.unitCost) {
      const cost = parseFloat(form.unitCost);
      if (isNaN(cost) || cost < 0) {
        return "Unit Cost must be a valid non-negative number.";
      }
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
    params.append("quantity", parseInt(form.quantityAdded, 10));
    if (form.supplier) {
      params.append("logged_by", form.supplier);
    }
    if (form.notes) {
      params.append("notes", form.notes);
    }
    if (form.unitCost) {
      params.append("unit_cost", parseFloat(form.unitCost));
    }

    try {
      const res = await fetch(`http://localhost:8000/inventory/${item.id}/restock?${params.toString()}`, {
        method: "POST"
      });

      if (!res.ok) {
        const errData = await res.json();
        setError(errData.detail || "Failed to restock item.");
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
          <h3 className="form-title">Restock Item</h3>
          <button className="close-btn" onClick={onClose}>✖</button>
        </div>

        {error && <p className="form-error">{error}</p>}

        <div className="item-form-grid">
          <div className="form-group">
            <label className="form-label" htmlFor="restock-quantity">Quantity Added</label>
            <input
              id="restock-quantity"
              type="number"
              name="quantityAdded"
              value={form.quantityAdded}
              onChange={handleChange}
              className="form-input"
              placeholder="Enter quantity added"
              min="1"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="restock-supplier">Supplier</label>
            <input
              id="restock-supplier"
              name="supplier"
              value={form.supplier}
              onChange={handleChange}
              className="form-input"
              placeholder="Supplier name"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="restock-unit-cost">Unit Cost</label>
            <input
              id="restock-unit-cost"
              type="number"
              step="0.01"
              name="unitCost"
              value={form.unitCost}
              onChange={handleChange}
              className="form-input"
              placeholder="Unit cost (optional)"
            />
          </div>


          <div className="form-group" style={{ gridColumn: "span 2" }}>
            <label className="form-label" htmlFor="restock-notes">Notes</label>
            <textarea
              id="restock-notes"
              name="notes"
              value={form.notes}
              onChange={handleChange}
              className="form-input"
              placeholder="Add notes (optional)"
              rows="4"
              style={{ resize: "vertical" }}
            />
          </div>
        </div>

        <div className="item-form-actions">
          <button className="primary-btn" onClick={handleSubmit} disabled={loading}>
            {loading ? "Restocking..." : "Restock Item"}
          </button>
          <button className="secondary-btn" onClick={onClose} disabled={loading}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default RestockForm;
