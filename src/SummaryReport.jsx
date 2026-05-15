import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import "./SummaryReport.css";
import logo from "./RwashLogo.jpg";

function SummaryReport() {
  const [summary, setSummary] = useState({
    total_active_items: 0,
    low_stock_count: 0,
    total_inventory_value: 0,
  });
  const [items, setItems] = useState([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState({});
  const [loading, setLoading] = useState(true);
  const reportRef = useRef(null);

  useEffect(() => {
    fetchReportData();
  }, []);

  const fetchReportData = async () => {
    setLoading(true);
    try {
      // Fetch summary
      const summaryRes = await fetch("https://nlsggvdz4dj5mwxtfakcees27m0isgkf.lambda-url.ap-southeast-2.on.aws/inventory/summary");
      const summaryData = await summaryRes.json();
      setSummary(summaryData);

      // Fetch all items
      const itemsRes = await fetch("https://nlsggvdz4dj5mwxtfakcees27m0isgkf.lambda-url.ap-southeast-2.on.aws/inventory/");
      const itemsData = await itemsRes.json();
      setItems(itemsData);

      // Calculate category breakdown
      const breakdown = {};
      itemsData.forEach((item) => {
        const category = item.category || "Uncategorized";
        if (!breakdown[category]) {
          breakdown[category] = {
            count: 0,
            value: 0,
            lowStock: 0,
          };
        }
        breakdown[category].count++;
        breakdown[category].value +=
          item.quantity * (item.unit_cost || item.price || 0);
        if (item.quantity <= item.low_stock_alert) {
          breakdown[category].lowStock++;
        }
      });
      setCategoryBreakdown(breakdown);
    } catch (error) {
      console.error("Error fetching report data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    printWindow.document.write(`
      <div class="print-report">
        <div class="print-header" style="text-align: center; padding-bottom: 20px;  margin-bottom: 30px;">
          <img src="${logo}" alt="Rwash Logo" style="height: 180px; margin-bottom: 15px; ">
          <p style={{width:"1060px", border:"2px solid #da1a31"}}></p>
        </div>
        ${reportRef.current.innerHTML}
      </div>
    `);
    printWindow.document.head.innerHTML = `
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Inventory Summary Report</title>
      <style>
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        
        body {
          font-family: 'Outfit', Arial, sans-serif;
          background-color: white;
          color: black;
          padding: 40px;
          line-height: 1.6;
        }
        
        .report-container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
        }
        
        .report-header {
          border-bottom: 3px solid #da1a31;
          padding-bottom: 20px;
          margin-bottom: 30px;
          text-align: center;
        }
        
        .report-title {
          font-size: 28px;
          color: #da1a31;
          margin-bottom: 5px;
          font-weight: 700;
        }
        
        .report-date {
          font-size: 14px;
          color: #666;
        }
        
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          margin-bottom: 40px;
          page-break-inside: avoid;
        }
        
        .summary-item {
          border: 1px solid #ddd;
          padding: 20px;
          text-align: center;
          border-radius: 8px;
          background-color: #f8f9fa;
        }
        
        .summary-item h3 {
          font-size: 14px;
          color: #666;
          margin-bottom: 10px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        
        .summary-item .value {
          font-size: 32px;
          color: #da1a31;
          font-weight: 700;
        }
        
        .section-title {
          font-size: 18px;
          color: #da1a31;
          margin-top: 30px;
          margin-bottom: 15px;
          border-bottom: 2px solid #da1a31;
          padding-bottom: 10px;
          page-break-after: avoid;
        }
        
        .category-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
          page-break-inside: avoid;
        }
        
        .category-table th {
          background-color: #da1a31;
          color: white;
          padding: 12px;
          text-align: left;
          font-weight: 600;
          font-size: 13px;
        }
        
        .category-table td {
          padding: 12px;
          border-bottom: 1px solid #ddd;
          font-size: 13px;
        }
        
        .category-table tbody tr:nth-child(even) {
          background-color: #f8f9fa;
        }
        
        .low-stock-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
          page-break-inside: avoid;
        }
        
        .low-stock-table th {
          background-color: #ff6b6b;
          color: white;
          padding: 12px;
          text-align: left;
          font-weight: 600;
          font-size: 13px;
        }
        
        .low-stock-table td {
          padding: 12px;
          border-bottom: 1px solid #ddd;
          font-size: 13px;
        }
        
        .low-stock-table tbody tr:nth-child(even) {
          background-color: #ffe6e6;
        }
        
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          text-align: center;
          font-size: 12px;
          color: #999;
          page-break-inside: avoid;
        }
        
        .no-data {
          text-align: center;
          padding: 20px;
          color: #999;
          font-style: italic;
        }
        
        @media print {
          body {
            padding: 20px;
          }
          .report-container {
            box-shadow: none;
          }
          .print-button {
            display: none;
          }
        }
      </style>
    `;
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  if (loading) {
    return (
      <div className="inventory-container">
        <div style={{ textAlign: "center", padding: "40px" }}>
          <p>Loading report...</p>
        </div>
      </div>
    );
  }

  const lowStockItems = items.filter(
    (item) => item.quantity <= item.low_stock_alert
  );

  return (
    <div className="inventory-container">
      
      <div
        className="ListHeading"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "15px",
          marginBottom: "30px"
        }}
      >
        <img src={logo} alt="Rwash Logo" className="nav-logo" style={{ height: "180px" }} />
        <div><p style={{width:"850px", border:"2px solid #da1a31"}}></p></div>
        
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          width: "100%",
          padding: "0 20px"
        }}>
          <Link to="/inventory" className="nav-link">
            Back to Inventory
          </Link>
          <h2 style={{ margin: 0 }}>Summary Report</h2>
          <button className="print-button" onClick={handlePrint}>
            Print Report
          </button>
        </div>
      </div>

      <div ref={reportRef} className="report-container">
        <div className="report-header">
          <div className="report-title">Inventory Summary Report</div>
          <div className="report-date">
            Generated on {new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        </div>

        {/* Summary Statistics */}
        <div className="summary-grid">
          <div className="summary-item">
            <h3>Total Items</h3>
            <div className="value">{summary.total_active_items}</div>
          </div>
          <div className="summary-item">
            <h3>Low Stock Items</h3>
            <div className="value">{summary.low_stock_count}</div>
          </div>
          <div className="summary-item">
            <h3>Total Inventory Value</h3>
            <div className="value">
              RM {summary.total_inventory_value.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <h4 className="section-title">Category Breakdown</h4>
        {Object.keys(categoryBreakdown).length > 0 ? (
          <table className="category-table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Items Count</th>
                <th>Total Value</th>
                <th>Low Stock</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(categoryBreakdown).map(([category, data]) => (
                <tr key={category}>
                  <td>{category}</td>
                  <td>{data.count}</td>
                  <td>
                    RM {data.value.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td>{data.lowStock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="no-data">No category data available</div>
        )}

        {/* Low Stock Items */}
        <h4 className="section-title">Low Stock Items Alert</h4>
        {lowStockItems.length > 0 ? (
          <table className="low-stock-table">
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Category</th>
                <th>Current Stock</th>
                <th>Alert Level</th>
                <th>Variance</th>
              </tr>
            </thead>
            <tbody>
              {lowStockItems.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.category || "Uncategorized"}</td>
                  <td>{item.quantity}</td>
                  <td>{item.low_stock_alert}</td>
                  <td>{item.quantity - item.low_stock_alert}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="no-data">All items are well stocked!</div>
        )}

        {/* Footer */}
        <div className="footer">
          <p>This is an automated report generated by the Washpro</p>
          <p>© {new Date().getFullYear()} - All rights reserved</p>
        </div>
      </div>
    </div>
  );
}

export default SummaryReport;
