import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ItemForm from "./ItemForm";
import HistoryDrawer from "./HistoryDrawer";
import RestockForm from "./RestockForm";
import StockOutForm from "./StockOutForm";
import NotificationPanel from "./NotificationPanel"

function AdminDashboard() {
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({
    total_active_items: 0,
    low_stock_count: 0,
    total_inventory_value: 0,
  });
  const [lowStockItems, setLowStockItems] = useState([]);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showItemForm, setShowItemForm] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showRestock, setShowRestock] = useState(false);
  const [showStockOut, setShowStockOut] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const categories = ["All", ...new Set(items.map((item) => item.category))];

  const fetchData = async () => {
    setLoading(true);
    try {
      const itemsRes = await fetch(`https://backend-xg71.onrender.com/inventory/?search=${search}`);
      const itemsData = await itemsRes.json();
      setItems(itemsData);

      const summaryRes = await fetch("https://backend-xg71.onrender.com/inventory/summary");
      const summaryData = await summaryRes.json();
      setSummary(summaryData);

      const lowStockRes = await fetch("https://backend-xg71.onrender.com/inventory/low-stock");
      const lowStockData = await lowStockRes.json();
      setLowStockItems(lowStockData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [search]);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to permanently delete this item?")) {
      try {
        const res = await fetch(`https://backend-xg71.onrender.com/inventory/${id}`, { method: "DELETE" });
        if (res.ok) {
          fetchData();
        }
      } catch (error) {
        console.error("Error deleting item:", error);
      }
    }
  };

  const dismissNotification = (itemId) => {
    setLowStockItems(lowStockItems.filter(item => item.id !== itemId));
  };

  const dismissAllNotifications = () => {
    setLowStockItems([]);
  };

  const filteredItems = items.filter((item) =>
    activeCategory === "All" ? true : item.category === activeCategory
  );

  return (
    <div className="admin-dashboard">
      {/* Top Navigation Bar */}
      <div className="top-nav">
        <div className="nav-left">
          <h1>Admin Dashboard</h1>
          <Link to="/inventory" className="nav-link">Inventory List</Link>
        </div>
        <div className="nav-right">
          <NotificationPanel lowStockItems={lowStockItems} />
        </div>
      </div>

      {/* Main Content - Inventory Management */}
      <div className="inventory-container">
        <div className="ListHeading">
          <h2>Inventory Management</h2>
        </div>

        <div className="stat-cards">
          <div className="stat-card">
            <h3>Total Items</h3>
            <p>{summary.total_active_items}</p>
          </div>
          <div className="stat-card">
            <h3>Low Stocks</h3>
            <p>{summary.low_stock_count}</p>
          </div>
          <div className="stat-card">
            <h3>Total Value</h3>
            <p>${summary.total_inventory_value.toLocaleString()}</p>
          </div>
        </div>

        <div className="search-row">
          <input
            type="text"
            className="search-input"
            placeholder="Search items by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            className="add-item-btn"
            onClick={() => {
              setSelectedItem(null);
              setShowItemForm(true);
            }}
          >
            Add New Item
          </button>
        </div>

        <div className="category-filters">
          {categories.map((category) => (
            <button
              key={category}
              className={`category-btn ${activeCategory === category ? "active" : ""}`}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="loading">Loading inventory...</div>
        ) : (
          <div className="inventory-grid">
            {filteredItems.map((item) => (
              <div key={item.id} className={`inventory-card ${item.quantity <= item.low_stock_alert ? "low-stock" : ""}`}>
                <div className="card-header">
                  <h3>{item.name}</h3>
                  <span className={`status-badge ${item.is_active ? "active" : "inactive"}`}>
                    {item.is_active ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="card-body">
                  <p className="description">{item.description}</p>
                  <p className="category">{item.category}</p>
                  <div className="price-info">
                    <span className="price">${item.price.toFixed(2)}</span>
                    <span className="unit-cost">Cost: ${item.unit_cost.toFixed(2)}</span>
                  </div>
                  <div className="stock-info">
                    <span className="quantity">Stock: {item.quantity}</span>
                    <span className="alert-level">Alert: {item.low_stock_alert}</span>
                  </div>
                  <div className="value-info">
                    <span className="total-value">
                      Value: ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
                <div className="card-actions">
                  <button
                    className="action-btn edit-btn"
                    onClick={() => {
                      setSelectedItem(item);
                      setShowItemForm(true);
                    }}
                  >
                    Edit
                  </button>
                  <button
                    className="action-btn history-btn"
                    onClick={() => {
                      setSelectedItem(item);
                      setShowHistory(true);
                    }}
                  >
                    History
                  </button>
                  <button
                    className="action-btn restock-btn"
                    onClick={() => {
                      setSelectedItem(item);
                      setShowRestock(true);
                    }}
                  >
                    Restock
                  </button>
                  <button
                    className="action-btn stock-out-btn"
                    onClick={() => {
                      setSelectedItem(item);
                      setShowStockOut(true);
                    }}
                  >
                    Stock Out
                  </button>
                  <button
                    className="action-btn delete-btn"
                    onClick={() => handleDelete(item.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showItemForm && (
        <ItemForm
          selectedItem={selectedItem}
          onClose={() => setShowItemForm(false)}
          refresh={fetchData}
        />
      )}

      {showHistory && selectedItem && (
        <HistoryDrawer
          item={selectedItem}
          onClose={() => setShowHistory(false)}
        />
      )}

      {showRestock && selectedItem && (
        <RestockForm
          item={selectedItem}
          onClose={() => setShowRestock(false)}
          refresh={fetchData}
        />
      )}

      {showStockOut && selectedItem && (
        <StockOutForm
          item={selectedItem}
          onClose={() => setShowStockOut(false)}
          refresh={fetchData}
        />
      )}
    </div>
  );
}

export default AdminDashboard;