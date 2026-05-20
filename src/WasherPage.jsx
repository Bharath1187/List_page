import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats, Html5QrcodeScanType } from "html5-qrcode";
import logo from "./RwashLogo.jpg";
import "./WasherPage.css";

function WasherPage() {
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [notification, setNotification] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState("");
  const scannerRef = useRef(null);
  const barcodeInputRef = useRef(null);

  // Focus the input when not using webcam
  useEffect(() => {
    if (!loading && !isScanning && barcodeInputRef.current) {
      barcodeInputRef.current.focus();
    }
  }, [loading, isScanning]);

  // Audio Context for beep sound
  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = "sine";
      oscillator.frequency.value = 1000; // 1000 Hz beep
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime); // Volume

      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        audioCtx.close();
      }, 150); // Beep for 150ms
    } catch (e) {
      console.error("Audio playback failed", e);
    }
  };

  const fetchItems = async () => {
    try {
      const res = await fetch("https://nlsggvdz4dj5mwxtfakcees27m0isgkf.lambda-url.ap-southeast-2.on.aws/inventory");
      const data = await res.json();
      setItems(data);
    } catch (error) {
      console.error("Error fetching inventory:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // Handle External Hardware Scanner globally when not using webcam
  useEffect(() => {
    if (loading || isScanning) return;
    let barcodeString = "";
    let timeoutId = null;

    const handleKeyDown = (e) => {
      // If user is already typing in the physical device input, let the form handle it.
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'Enter') {
        if (barcodeString) {
          handleScan(barcodeString);
          barcodeString = "";
        }
        return;
      }
      
      if (e.key.length === 1) {
        barcodeString += e.key;
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          barcodeString = "";
        }, 150);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [loading, items, isScanning]);

  // Initialize Scanner
  useEffect(() => {
    if (!loading && isScanning) {
      const reader = new Html5QrcodeScanner(
        "washer-qr-reader",
        {
          fps: 10,
          qrbox: { width: 300, height: 300 },
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true
          },
          supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
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

      scannerRef.current = reader;

      reader.render(
        (decodedText) => {
          handleScan(decodedText);
          setIsScanning(false);
          if (scannerRef.current) {
            scannerRef.current.clear().catch(() => {});
          }
        },
        (error) => {
          // Ignore frequent scan errors
        }
      );

      return () => {
        if (scannerRef.current) {
          scannerRef.current.clear().catch(() => {});
        }
      };
    }
  }, [loading, items, isScanning]);

  const showNotification = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(""), 3000);
  };

  const handleScan = (barcode) => {
    if (!barcode) return;
    
    // Find item in inventory
    const matchedItem = items.find(item => item.barcode === barcode);
    
    if (matchedItem) {
      if (matchedItem.quantity <= 0) {
        showNotification(`Cannot add ${matchedItem.name}: Out of stock`);
        return;
      }
      playBeep();
      addToCart(matchedItem);
    } else {
      showNotification(`Item with barcode ${barcode} not found in inventory.`);
    }
  };



  const addToCart = (item) => {
    setCart((prevCart) => {
      const existing = prevCart.find(cartItem => cartItem.item.id === item.id);
      if (existing) {
        if (existing.qty >= item.quantity) {
           showNotification(`Cannot add more ${item.name}: Stock limit reached`);
           return prevCart;
        }
        return prevCart.map(cartItem => 
          cartItem.item.id === item.id 
            ? { ...cartItem, qty: cartItem.qty + 1 }
            : cartItem
        );
      }
      return [...prevCart, { item, qty: 1 }];
    });
  };

  const updateCartQty = (id, newQty) => {
    if (newQty <= 0) {
      removeFromCart(id);
      return;
    }
    
    const matchedItem = items.find(i => i.id === id);
    if (matchedItem && newQty > matchedItem.quantity) {
      showNotification(`Only ${matchedItem.quantity} units of ${matchedItem.name} available`);
      return;
    }

    setCart(prevCart => 
      prevCart.map(cartItem => 
        cartItem.item.id === id 
          ? { ...cartItem, qty: newQty }
          : cartItem
      )
    );
  };

  const removeFromCart = (id) => {
    setCart(prevCart => prevCart.filter(cartItem => cartItem.item.id !== id));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setCheckoutLoading(true);

    let successCount = 0;
    for (const cartItem of cart) {
      try {
        const url = `https://nlsggvdz4dj5mwxtfakcees27m0isgkf.lambda-url.ap-southeast-2.on.aws/inventory/${cartItem.item.id}/use?quantity=${cartItem.qty}&logged_by=Washer&notes=Scanned%20by%20washer`;
        const res = await fetch(url, { method: "POST" });
        if (res.ok) {
          successCount++;
        }
      } catch (err) {
        console.error("Failed to checkout item:", cartItem.item.name, err);
      }
    }

    setCheckoutLoading(false);
    if (successCount === cart.length) {
      alert("Checkout successful! Inventory updated.");
      setCart([]);
      fetchItems(); // Refresh inventory data
    } else {
      alert(`Checkout partially completed. ${successCount} out of ${cart.length} items succeeded.`);
      fetchItems();
    }
  };

  return (
    <div className="washer-page">
      {/* Navigation */}
      <div className="washer-top-nav">
        <div className="washer-nav-left">
          <img src={logo} alt="Rwash Logo" className="washer-nav-logo" />
          <h1>Washer Station</h1>
        </div>
      </div>

      <div className="washer-content">
        {/* Left Side - Scanner */}
        <div className="scanner-section">
          <h2>Scan Product</h2>
          {loading ? (
            <p>Loading inventory...</p>
          ) : (
            <>
              {isScanning ? (
                <>
                  <div id="washer-qr-reader" className="qr-reader-container"></div>
                  <p className="scanner-instruction">Point camera at barcode/QR code</p>
                  
                  <button
                    className="stop-scanning-btn"
                    onClick={() => {
                      if (scannerRef.current) {
                        scannerRef.current.clear().catch(() => {});
                      }
                      setIsScanning(false);
                    }}
                    style={{
                      width: '100%',
                      padding: '12px',
                      backgroundColor: '#da1a31',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      marginTop: '15px'
                    }}
                  >
                    Stop Scanning
                  </button>
                </>
              ) : (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <div style={{ display: "inline-flex", justifyContent: "center", alignItems: "center", width: "80px", height: "80px", borderRadius: "50%", backgroundColor: "#f0f0f0", marginBottom: "15px" }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="#da1a31" strokeWidth="2" style={{ width: "40px", height: "40px" }}>
                      <path d="M4 4h4v4H4z"></path>
                      <path d="M16 4h4v4h-4z"></path>
                      <path d="M4 16h4v4H4z"></path>
                      <path d="M16 16h4v4h-4z"></path>
                      <line x1="2" y1="12" x2="22" y2="12"></line>
                    </svg>
                  </div>
                  
                  <p className="scanner-instruction" style={{ marginBottom: "20px" }}>
                    Use physical scanner or start webcam
                  </p>

                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (barcodeInput.trim()) {
                        handleScan(barcodeInput.trim());
                        setBarcodeInput("");
                      }
                    }} 
                    style={{ marginBottom: "20px" }}
                  >
                    <input
                      type="text"
                      placeholder="Scan with physical device..."
                      value={barcodeInput}
                      onChange={(e) => setBarcodeInput(e.target.value)}
                      ref={barcodeInputRef}
                      style={{
                        width: "100%",
                        padding: "12px 15px",
                        border: "2px solid #da1a31",
                        borderRadius: "8px",
                        fontSize: "16px",
                        outline: "none",
                        marginBottom: "10px",
                        boxSizing: "border-box"
                      }}
                    />
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button 
                        type="submit" 
                        disabled={!barcodeInput.trim()}
                        style={{
                          flex: 1,
                          padding: "10px",
                          backgroundColor: barcodeInput.trim() ? "#e06c75" : "#cccccc",
                          color: "white",
                          border: "none",
                          borderRadius: "6px",
                          cursor: barcodeInput.trim() ? "pointer" : "not-allowed",
                          fontWeight: "bold"
                        }}
                      >
                        Submit Code
                      </button>
                      {barcodeInput && (
                        <button
                          type="button"
                          onClick={() => setBarcodeInput("")}
                          style={{
                            padding: "10px 15px",
                            backgroundColor: "transparent",
                            border: "1px solid #999",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontWeight: "bold",
                            color: "#555"
                          }}
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </form>

                  <div style={{ margin: "20px 0", color: "#888", fontSize: "13px" }}>OR</div>

                  <button
                    onClick={() => setIsScanning(true)}
                    style={{
                      width: "100%",
                      padding: "12px",
                      backgroundColor: "#da1a31",
                      color: "white",
                      border: "none",
                      borderRadius: "8px",
                      fontWeight: "bold",
                      cursor: "pointer",
                      fontSize: "16px"
                    }}
                  >
                    Start Webcam Scanner
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Right Side - Cart */}
        <div className="cart-section">
          <h2>Checkout List</h2>
          
          <div className="cart-items">
            {cart.length === 0 ? (
              <div className="empty-cart">
                <p>No items scanned yet.</p>
                <p>Scan a product's barcode to add it to the list.</p>
              </div>
            ) : (
              cart.map((cartItem) => (
                <div key={cartItem.item.id} className="cart-item">
                  <div className="cart-item-details">
                    <h3>{cartItem.item.name}</h3>
                    <p>{cartItem.item.category} | RM {cartItem.item.price.toFixed(2)}</p>
                  </div>
                  
                  <div className="cart-item-actions">
                    <button 
                      className="qty-btn" 
                      onClick={() => updateCartQty(cartItem.item.id, cartItem.qty - 1)}
                    >
                      -
                    </button>
                    <span className="cart-item-qty">{cartItem.qty}</span>
                    <button 
                      className="qty-btn" 
                      onClick={() => updateCartQty(cartItem.item.id, cartItem.qty + 1)}
                    >
                      +
                    </button>
                    <button 
                      className="remove-btn" 
                      onClick={() => removeFromCart(cartItem.item.id)}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <button 
            className="checkout-btn" 
            onClick={handleCheckout} 
            disabled={cart.length === 0 || checkoutLoading}
          >
            {checkoutLoading ? "Processing..." : `Confirm & Use Products (${cart.length} items)`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default WasherPage;
