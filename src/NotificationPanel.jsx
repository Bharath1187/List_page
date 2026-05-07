import React, { useState, useEffect, useRef } from "react";

function NotificationPanel({ lowStockItems }) {
  const [isOpen, setIsOpen] = useState(false);
  const [dismissedIds, setDismissedIds] = useState([]);
  const panelRef = useRef(null);

  // Toggle panel
  const togglePanel = () => setIsOpen(!isOpen);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Actions
  const dismissItem = (id) => {
    setDismissedIds([...dismissedIds, id]);
  };

  const dismissAll = () => {
    setDismissedIds(lowStockItems.map(item => item.id));
  };

  const visibleItems = lowStockItems.filter(item => !dismissedIds.includes(item.id));

  return (
    <div className="notification-wrapper" ref={panelRef}>
      <button className="notification-bell" onClick={togglePanel}>
        🔔
        {visibleItems.length > 0 && (
          <span className="notification-count">{visibleItems.length}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-panel">
          <div className="notification-header">
            <h4>Low Stock Alerts</h4>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {visibleItems.length > 0 && (
                <button 
                  onClick={dismissAll}
                  className="dismiss-all-btn"
                >
                  Dismiss All
                </button>
              )}
              <button className="close-btn" style={{ fontSize: "18px" }} onClick={() => setIsOpen(false)}>✖</button>
            </div>
          </div>
          
          <div className="notification-list">
            {visibleItems.length === 0 ? (
              <div className="notification-empty">
                All stock levels are optimal.
              </div>
            ) : (
              visibleItems.map((item) => (
                <div key={item.id} className="notification-item">
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
                    <span className="item-name" style={{ margin: 0 }}>{item.name}</span>
                    <span style={{ color: "#888", fontSize: "13px" }}>
                      Stock: {item.quantity} | Alert: {item.low_stock_alert}
                    </span>
                  </div>
                  <button 
                    onClick={() => dismissItem(item.id)}
                    className="dismiss-btn"
                    title="Dismiss"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationPanel;
