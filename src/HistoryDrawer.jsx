import React, { useState, useEffect } from "react";

function HistoryDrawer({ item, onClose }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (item && item.id) {
      fetchHistory();
    }
  }, [item?.id]);

  const fetchHistory = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/inventory/${item.id}/history`);
      if (!res.ok) {
        throw new Error("Failed to fetch history");
      }
      const data = await res.json();
      setHistory(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="history-drawer-overlay" onClick={onClose}>
      <div className="history-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="history-header">
          <h3>Stock History for {item.name}</h3>
          <button className="close-btn" onClick={onClose}>✖</button>
        </div>

        {loading && <p>Loading history...</p>}
        {error && <p className="form-error">{error}</p>}

        {!loading && !error && (
          <div className="history-timeline">
            {history.length === 0 ? (
              <p>No history available.</p>
            ) : (
              history.map((event) => (
                <div key={event.id} className="history-event">
                  <div className="event-badge">
                    <span className={`badge ${event.event_type === 'stock_in' ? 'badge-in' : 'badge-out'}`}>
                      {event.event_type === 'stock_in' ? 'Restock' : 'Stock Out'}
                    </span>
                  </div>
                  <div className="event-details">
                    <p><strong>Quantity:</strong> {event.quantity}</p>
                    <p><strong>Date/Time:</strong> {new Date(event.timestamp).toLocaleString()}</p>
                    {event.logged_by && <p><strong>Logged By:</strong> {event.logged_by}</p>}
                    {event.notes && <p><strong>Notes:</strong> {event.notes}</p>}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default HistoryDrawer;
