import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ItemForm from "./ItemForm";
import HistoryDrawer from "./HistoryDrawer";
import RestockForm from "./RestockForm";
import StockOutForm from "./StockOutForm";
import NotificationPanel from "./NotificationPanel";

function List_page() {
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({
    total_active_items: 0,
    low_stock_count: 0,
    total_inventory_value: 0,
  });
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

  const filteredItems = items.filter((item) =>
    activeCategory === "All" ? true : item.category === activeCategory
  );

  const lowStockItems = items.filter(item => item.quantity <= item.low_stock_alert);

  return (
    <div className="inventory-container">
      <div className="ListHeading" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ width: "40px" }}></div>
        <h2>Inventory List</h2>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <NotificationPanel lowStockItems={lowStockItems} />
          <Link to="/" className="nav-link">Dashboard</Link>
        </div>
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
          + Add New Item
        </button>
      </div>

      <div className="category-tabs">
        {categories.map((cat) => (
          <button
            key={cat}
            className={`category-btn ${activeCategory === cat ? "active" : ""}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="table-wrapper">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Quantity</th>
              <th>Price</th>
              <th>Unit Cost</th>
              <th>Total Value</th>
              <th>Status</th>
              <th className="Actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.category}</td>
                <td>{item.quantity}</td>
                <td>${item.price?.toLocaleString()}</td>
                <td>${item.unit_cost?.toLocaleString()}</td>
                <td>${(item.quantity * (item.unit_cost || 0)).toLocaleString()}</td>
                <td>
                  <span
                    className={
                      item.quantity <= item.low_stock_alert
                        ? "status-low"
                        : "status-ok"
                    }
                  >
                    {item.quantity <= item.low_stock_alert ? "Low Stock" : "In Stock"}
                  </span>
                </td>
                <td>
                  <div className="action-buttons-wrapper">
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
                      className="action-btn history-btn"
                      onClick={() => {
                        setSelectedItem(item);
                        setShowHistory(true);
                      }}
                    >
                      History
                    </button>
                    <button
                      className="action-btn delete-btn"
                      onClick={() => handleDelete(item.id)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showItemForm && (
        <ItemForm
          selectedItem={selectedItem}
          onClose={() => setShowItemForm(false)}
          refresh={fetchData}
        />
      )}

      {showHistory && (
        <HistoryDrawer
          item={selectedItem}
          onClose={() => setShowHistory(false)}
        />
      )}

      {showRestock && (
        <RestockForm
          item={selectedItem}
          onClose={() => setShowRestock(false)}
          refresh={fetchData}
        />
      )}

      {showStockOut && (
        <StockOutForm
          item={selectedItem}
          onClose={() => setShowStockOut(false)}
          refresh={fetchData}
        />
      )}
    </div>
  );
}

export default List_page;
