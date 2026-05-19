import React, { useState, useRef, useEffect } from "react";
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from "html5-qrcode";
import "./AddProductModal.css";

function AddProductModal({ onSelectMode, onClose, startInScanner = false }) {
  const [scannerActive, setScannerActive] = useState(startInScanner);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [scanError, setScanError] = useState("");
  const barcodeInputRef = useRef(null);
  const scannerRef = useRef(null);
  const html5QrcodeRef = useRef(null);

  // Focus the barcode input when scanner mode is active
  useEffect(() => {
    if (scannerActive && !isScanning && barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, [scannerActive, isScanning]);

  // Initialize webcam scanner
  useEffect(() => {
    if (scannerActive && isScanning) {
      const reader = new Html5QrcodeScanner(
        "qr-reader",
        { 
          fps: 10, 
          qrbox: { width: 300, height: 300 },
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true
          },
          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.ITF
          ]
        },
        false
      );

      html5QrcodeRef.current = reader;
      setScanError("");

      reader.render(
        (decodedText) => {
          // Barcode/QR code detected
          setBarcodeInput(decodedText);
          setScanError("");
          reader.clear();
          setIsScanning(false);
        },
        (error) => {
          // Only log critical errors, not permission errors
          if (error && !error.includes("NotAllowedError")) {
            setScanError("Unable to access webcam. Please check permissions.");
          }
        }
      );
    }

    // Cleanup
    return () => {
      if (html5QrcodeRef.current && isScanning) {
        html5QrcodeRef.current.clear().catch(() => {});
      }
    };
  }, [scannerActive, isScanning]);

  const handleManualClick = () => {
    onSelectMode("manual", null);
    onClose();
  };

  const handleScannerClick = () => {
    setScannerActive(true);
  };

  const handleBarcodeSubmit = (e) => {
    e.preventDefault();
    if (barcodeInput.trim()) {
      onSelectMode("scanner", barcodeInput.trim());
      setBarcodeInput("");
      setScannerActive(false);
      onClose();
    }
  };

  const handleBackToOptions = () => {
    setScannerActive(false);
    setBarcodeInput("");
  };

  if (scannerActive) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content scanner-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h2>QR & Barcode Scanner</h2>
            <button className="close-btn" onClick={onClose}>&times;</button>
          </div>

          <div className="scanner-body">
            {isScanning ? (
              <>
                <div id="qr-reader" className="qr-reader-container"></div>
                <p className="scanner-instruction">
                  Point camera at barcode/QR code
                </p>
                {scanError && <p className="scanner-error">{scanError}</p>}
              </>
            ) : (
              <>
                <div className="scanner-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h4v4H4z"></path>
                    <path d="M16 4h4v4h-4z"></path>
                    <path d="M4 16h4v4H4z"></path>
                    <path d="M16 16h4v4h-4z"></path>
                    <line x1="2" y1="12" x2="22" y2="12"></line>
                  </svg>
                </div>

                <p className="scanner-instruction">
                  Scan barcode or QR code with your webcam
                </p>

                <button
                  className="start-scanning-btn"
                  onClick={() => setIsScanning(true)}
                >
                  Start Webcam Scanner
                </button>
              </>
            )}

            {isScanning && (
              <button
                className="stop-scanning-btn"
                onClick={() => {
                  if (html5QrcodeRef.current) {
                    html5QrcodeRef.current.clear();
                  }
                  setIsScanning(false);
                }}
              >
                Stop Scanning
              </button>
            )}

            {barcodeInput && (
              <form onSubmit={handleBarcodeSubmit} className="barcode-form">
                <div className="scanned-result">
                  <label>Scanned Code:</label>
                  <input
                    type="text"
                    className="barcode-input"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    disabled
                  />
                </div>
                <button type="submit" className="submit-barcode-btn">
                  Continue with Scanned Code
                </button>
                <button
                  type="button"
                  className="rescan-btn"
                  onClick={() => {
                    setBarcodeInput("");
                    setIsScanning(true);
                  }}
                >
                  Scan Again
                </button>
              </form>
            )}

            <button
              className="back-to-options-btn"
              onClick={handleBackToOptions}
            >
              ← Back to Options
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content add-product-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add New Product</h2>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-options">
          {/* Manual Input Option */}
          <button className="option-card manual-card" onClick={handleManualClick}>
            <div className="option-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
              </svg>
            </div>
            <h3>Manual Entry</h3>
            <p>Type product details manually</p>
          </button>

          {/* Scanner Option */}
          <button className="option-card scanner-card" onClick={handleScannerClick}>
            <div className="option-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 4h4v4H3z"></path>
                <path d="M17 4h4v4h-4z"></path>
                <path d="M3 17h4v4H3z"></path>
                <path d="M17 17h4v4h-4z"></path>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <line x1="12" y1="2" x2="12" y2="22"></line>
              </svg>
            </div>
            <h3>QR & Barcode Scanner</h3>
            <p>Scan barcode or QR code</p>
          </button>
        </div>

        <div className="modal-info">
          <p>Choose how you'd like to add the new product to your inventory</p>
        </div>
      </div>
    </div>
  );
}

export default AddProductModal;
