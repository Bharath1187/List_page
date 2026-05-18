import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import ItemForm from "./ItemForm";
import HistoryDrawer from "./HistoryDrawer";
import RestockForm from "./RestockForm";
import StockOutForm from "./StockOutForm";
import NotificationPanel from "./NotificationPanel";
import AddProductModal from "./AddProductModal";
import { useShortcuts } from "./useShortcuts";
import logo from "./RwashLogo.jpg";

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
  const [showSummaryReport, setShowSummaryReport] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);

  const [selectedItem, setSelectedItem] = useState(null);
  const [scannedBarcode, setScannedBarcode] = useState("");

  const categories = ["All", ...new Set(items.map((item) => item.category))];

  useShortcuts({
    onAddNew: () => setShowAddProductModal(true),
    onCloseModals: () => {
      setShowAddProductModal(false);
      setShowItemForm(false);
      setShowHistory(false);
      setShowRestock(false);
      setShowStockOut(false);
      setShowSummaryReport(false);
    },
    searchInputId: "admin-search-input"
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const itemsRes = await fetch(`https://nlsggvdz4dj5mwxtfakcees27m0isgkf.lambda-url.ap-southeast-2.on.aws/inventory?search=${search}`);
      const itemsData = await itemsRes.json();
      setItems(itemsData);

      const summaryRes = await fetch("https://nlsggvdz4dj5mwxtfakcees27m0isgkf.lambda-url.ap-southeast-2.on.aws/inventory/summary");
      const summaryData = await summaryRes.json();
      setSummary(summaryData);

      const lowStockRes = await fetch("https://nlsggvdz4dj5mwxtfakcees27m0isgkf.lambda-url.ap-southeast-2.on.aws/inventory/low-stock");
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
        const res = await fetch(`https://nlsggvdz4dj5mwxtfakcees27m0isgkf.lambda-url.ap-southeast-2.on.aws/inventory/${id}`, { method: "DELETE" });
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

  const handleAddProductModeSelect = (mode, barcode) => {
    if (mode === "scanner" && barcode) {
      setScannedBarcode(barcode);
    } else {
      setScannedBarcode("");
    }
    setSelectedItem(null);
    setShowItemForm(true);
  };



  return (
    <div className="admin-dashboard">
      {/* Top Navigation Bar */}
      <div className="top-nav">
        <div className="nav-left">
          <img src={logo} alt="Rwash Logo" className="nav-logo" />
          <h1>Admin Dashboard</h1>
          <Link to="/inventory" className="nav-link">Inventory List</Link>
        </div>
          
        <div className="nav-right">
          <Link to="/summary-report" className="nav-link">Summary Report</Link>
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
            <p>RM {summary.total_inventory_value.toLocaleString()}</p>
          </div>
        </div>

        <div className="search-row">
          <input
            id="admin-search-input"
            name="admin-search"
            type="text"
            className="search-input"
            placeholder="Search items by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            className="add-item-btn"
            onClick={() => setShowAddProductModal(true)}
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
                    <span className="price">RM {item.price.toFixed(2)}</span>
                    <span className="unit-cost">Cost: RM {item.unit_cost.toFixed(2)}</span>
                  </div>
                  <div className="stock-info">
                    <span className="quantity">Stock: {item.quantity}</span>
                    <span className="alert-level">Alert: {item.low_stock_alert}</span>
                  </div>
                  <div className="value-info">
                    <span className="total-value">
                      Value: RM {(item.price * item.quantity).toFixed(2)}
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
          scannedBarcode={scannedBarcode}
          onClose={() => {
            setShowItemForm(false);
            setScannedBarcode("");
          }}
          refresh={fetchData}
        />
      )}

      {showAddProductModal && (
        <AddProductModal
          onSelectMode={handleAddProductModeSelect}
          onClose={() => setShowAddProductModal(false)}
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

      {/* Summary Report Modal */}
      {showSummaryReport && (
        <div className="item-form-overlay" >
          <div className="item-form-modal" onClick={(e) => e.stopPropagation()}>
            <div className="item-form-header">
              <h3>Inventory Summary Report</h3>
              <button
                className="close-btn"
                onClick={() => setShowSummaryReport(false)}
              >
                ×
              </button>
            </div>
            <div className="summary-report">
              <div className="report-section">
                <h4>Overall Statistics</h4>
                <div className="report-grid">
                  <div className="report-item">
                    <span className="report-label">Total Active Items:</span>
                    <span className="report-value">{summary.total_active_items}</span>
                  </div>
                  <div className="report-item">
                    <span className="report-label">Low Stock Items:</span>
                    <span className="report-value" style={{ color: summary.low_stock_count > 0 ? "#da1a31" : "#27ae60" }}>
                      {summary.low_stock_count}
                    </span>
                  </div>
                  <div className="report-item">
                    <span className="report-label">Total Inventory Value:</span>
                    <span className="report-value">${summary.total_inventory_value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              <div className="report-section">
                <h4>Low Stock Items ({lowStockItems.length})</h4>
                {lowStockItems.length > 0 ? (
                  <div className="report-table">
                    <div className="report-table-header">
                      <div className="col-name">Item Name</div>
                      <div className="col-qty">Current Stock</div>
                      <div className="col-value">Value</div>
                    </div>
                    {lowStockItems.map((item) => (
                      <div key={item.id} className="report-table-row">
                        <div className="col-name">{item.name}</div>
                        <div className="col-qty">{item.quantity}</div>
                        <div className="col-value">${(item.price * item.quantity).toFixed(2)}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ textAlign: "center", color: "#27ae60", fontWeight: "600" }}>✓ All items are well stocked!</p>
                )}
              </div>

              <div className="report-section">
                <h4>Category Breakdown</h4>
                <div className="report-categories">
                  {categories.slice(1).map((category) => {
                    const categoryItems = items.filter(item => item.category === category);
                    const categoryValue = categoryItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                    return (
                      <div key={category} className="category-stat">
                        <span className="category-name">{category}</span>
                        <span className="category-count">{categoryItems.length} items</span>
                        <span className="category-value">${categoryValue.toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="item-form-actions">
                <button
                  className="primary-btn"
                  onClick={() => window.print()}
                >
                  Print Report
                </button>
                <button
                  className="secondary-btn"
                  onClick={() => setShowSummaryReport(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;