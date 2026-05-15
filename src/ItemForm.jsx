import React, { useState, useEffect } from "react";


function ItemForm({ selectedItem, onClose, refresh }) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    category: "",
    price: "",
    unit_cost: "",
    quantity: "",
    low_stock_alert: 10,
    last_restocked: "",
    created_at: ""
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Fill form (Edit mode)
  useEffect(() => {
    const now = new Date();
    const localISO = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

    if (selectedItem) {
      const formattedDate = selectedItem.last_restocked 
        ? new Date(new Date(selectedItem.last_restocked).getTime() - new Date(selectedItem.last_restocked).getTimezoneOffset() * 60000).toISOString().slice(0, 16) 
        : localISO;
      setForm({
        name: selectedItem.name || "",
        description: selectedItem.description || "",
        category: selectedItem.category || "",
        price: selectedItem.price || "",
        unit_cost: selectedItem.unit_cost || "",
        quantity: selectedItem.quantity || "",
        low_stock_alert: selectedItem.low_stock_alert || 10,
        last_restocked: formattedDate,
        created_at: selectedItem.created_at || ""
      });
    } else {
      setForm({
        name: "",
        description: "",
        category: "",
        price: "",
        unit_cost: "",
        quantity: "",
        low_stock_alert: 10,
        last_restocked: "",
        created_at: localISO
      });
    }
  }, [selectedItem]);

  // Handle change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  // Validation
  const validate = () => {
    if (!form.name || !form.category) {
      return "Name and Category are required";
    }

    const price = parseFloat(form.price);
    const quantity = parseInt(form.quantity, 10);

    if (isNaN(price) || price < 0) {
      return "Price must be valid";
    }

    if (isNaN(quantity) || quantity < 0) {
      return "Quantity must be valid";
    }

    return "";
  };

  //  Submit
  const handleSubmit = async () => {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }

    setLoading(true);

    let baseUrl = "https://nlsggvdz4dj5mwxtfakcees27m0isgkf.lambda-url.ap-southeast-2.on.aws/inventory/";
    let method = "POST";

    if (selectedItem) {
      baseUrl = `https://nlsggvdz4dj5mwxtfakcees27m0isgkf.lambda-url.ap-southeast-2.on.aws/inventory/${selectedItem.id}`;
      method = "PUT";
    }

    const params = new URLSearchParams({
      name: form.name,
      description: form.description,
      category: form.category,
      price: parseFloat(form.price) || 0,
      unit_cost: parseFloat(form.unit_cost) || 0,
      quantity: parseInt(form.quantity, 10) || 0,
      low_stock_alert: parseInt(form.low_stock_alert, 10) || 10,
    });
    
    // Add ISO string representation of selected date
    if (selectedItem && form.last_restocked) {
      params.append('last_restocked', new Date(form.last_restocked).toISOString());
    } else if (!selectedItem && form.created_at) {
      params.append('created_at', new Date(form.created_at).toISOString());
    }
    
    const url = `${baseUrl}?${params.toString()}`;

    try {
      const res = await fetch(url, {
        method,
      });

      if (!res.ok) {
        const errData = await res.json();
        setError(errData.detail || "Something went wrong");
        setLoading(false);
        return;
      }

      refresh();
      onClose();
    } catch (err) {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="item-form-overlay">
      <div className="item-form-modal">
        
        {/* HEADER */}
        <div className="item-form-header">
          <h3 className="form-title">
            {selectedItem ? "Edit Item" : "Add Item"}
          </h3>
          <button className="close-btn" onClick={onClose}>
            ✖
          </button>
        </div>

        {/* ERROR */}
        {error && <p className="form-error">{error}</p>}

        {/* FORM */}
        <div className="item-form-grid">

          <div className="form-group">
            <label className="form-label">Name</label>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              className="form-input"
              placeholder="Enter item name"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <input
              name="description"
              value={form.description}
              onChange={handleChange}
              className="form-input"
              placeholder="Enter description"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Category</label>
            <input
              name="category"
              value={form.category}
              onChange={handleChange}
              className="form-input"
              placeholder="Enter category"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Price</label>
            <input
              type="number"
              name="price"
              value={form.price}
              onChange={handleChange}
              className="form-input"
              placeholder="Selling price"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Unit Cost</label>
            <input
              type="number"
              name="unit_cost"
              value={form.unit_cost}
              onChange={handleChange}
              className="form-input"
              placeholder="Cost price"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Quantity</label>
            <input
              type="number"
              name="quantity"
              value={form.quantity}
              onChange={handleChange}
              className="form-input"
              placeholder="Enter quantity"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Low Stock Alert Level</label>
            <input
              type="number"
              name="low_stock_alert"
              value={form.low_stock_alert}
              onChange={handleChange}
              className="form-input"
              placeholder="Alert threshold"
            />
          </div>

          {/* Show created date (read-only) in Edit mode */}
          {selectedItem && (
            <div className="form-group">
              <label className="form-label">Created Date Time</label>
              <input
                type="text"
                readOnly
                value={selectedItem.created_at ? new Date(selectedItem.created_at).toLocaleString() : "-"}
                className="form-input"
                style={{ background: "#f5f5f5", color: "#888", cursor: "not-allowed" }}
              />
            </div>
          )}

          {selectedItem && (
            <div className="form-group">
              <label className="form-label">Last Restocked Date</label>
              <input
                type="datetime-local"
                name="last_restocked"
                value={form.last_restocked}
                onChange={handleChange}
                className="form-input"
              />
            </div>
          )}

        </div>

        {/* ACTIONS */}
        <div className="item-form-actions">
          <button
            className="primary-btn"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading
              ? "Saving..."
              : selectedItem
              ? "Update Item"
              : "Add Item"}
          </button>

          <button className="secondary-btn" onClick={onClose}>
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
}

export default ItemForm;