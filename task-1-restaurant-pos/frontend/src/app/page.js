"use client";

import { useState, useEffect, useMemo } from "react";
import { api, getStoredUser, setStoredUser, getAuthToken, removeAuthToken } from "../lib/api";

export default function RestaurantPOSApp() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("pos");
  const [authMode, setAuthMode] = useState("login");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRole, setRegRole] = useState("staff");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [menuItems, setMenuItems] = useState([]);
  const [menuLoading, setMenuLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [mobilePosView, setMobilePosView] = useState("menu");

  const [cart, setCart] = useState([]);
  const [orderType, setOrderType] = useState("dine-in");
  const [tableNumber, setTableNumber] = useState("Table 1");
  const [customerName, setCustomerName] = useState("");
  const [discountRate, setDiscountRate] = useState(0);
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [posSuccessMsg, setPosSuccessMsg] = useState("");
  const [posErrorMsg, setPosErrorMsg] = useState("");

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [orderStatusFilter, setOrderStatusFilter] = useState("All");
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [activeOrderActionId, setActiveOrderActionId] = useState(null);

  const [selectedOrderForPayment, setSelectedOrderForPayment] = useState(null);
  const [paymentMethodChoice, setPaymentMethodChoice] = useState("Cash");
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

  const [printableOrder, setPrintableOrder] = useState(null);

  const [dailySalesData, setDailySalesData] = useState(null);
  const [dailySalesLoading, setDailySalesLoading] = useState(false);
  const [reportDate, setReportDate] = useState(new Date().toISOString().slice(0, 10));



  const [menuModalOpen, setMenuModalOpen] = useState(false);
  const [editingMenuItem, setEditingMenuItem] = useState(null);
  const [menuFormName, setMenuFormName] = useState("");
  const [menuFormCategory, setMenuFormCategory] = useState("Mains");
  const [menuFormPrice, setMenuFormPrice] = useState("");
  const [menuFormDescription, setMenuFormDescription] = useState("");
  const [menuFormAvailable, setMenuFormAvailable] = useState(true);
  const [menuFormImageUrl, setMenuFormImageUrl] = useState("");
  const [menuImageUploading, setMenuImageUploading] = useState(false);
  const [menuFormError, setMenuFormError] = useState("");

  useEffect(() => {
    const handleUnauthorized = () => {
      setUser(null);
      removeAuthToken();
    };
    window.addEventListener("auth:unauthorized", handleUnauthorized);

    const stored = getStoredUser();
    const token = getAuthToken();
    if (stored && token) {
      setUser(stored);
      api.getMe()
        .then((res) => {
          if (res && res.user) {
            setUser(res.user);
            setStoredUser(res.user);
          }
        })
        .catch(() => {
          setUser(null);
          removeAuthToken();
        });
    } else {
      removeAuthToken();
      setUser(null);
    }

    return () => window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, []);

  const loadMenu = async () => {
    try {
      setMenuLoading(true);
      const res = await api.getMenu();
      setMenuItems(res.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setMenuLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      if (orders.length === 0) {
        setOrdersLoading(true);
      }
      const res = await api.getOrders({
        status: orderStatusFilter === "All" ? "" : orderStatusFilter,
        search: orderSearchQuery
      });
      setOrders(res.orders || []);
    } catch (err) {
      console.error(err);
    } finally {
      setOrdersLoading(false);
    }
  };

  const loadDailySales = async (date) => {
    try {
      if (!dailySalesData) {
        setDailySalesLoading(true);
      }
      const res = await api.getDailySales(date);
      setDailySalesData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setDailySalesLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadMenu();
    }
  }, [user]);

  useEffect(() => {
    if (user && activeTab === "orders") {
      loadOrders();
    } else if (user && activeTab === "reports") {
      loadDailySales(reportDate);
    }
  }, [user, activeTab, orderStatusFilter, orderSearchQuery, reportDate]);

  const handleLogin = async (e, demoEmail = null, demoPassword = null) => {
    if (e) e.preventDefault();
    setLoginError("");
    setLoginLoading(true);
    const emailToUse = demoEmail || loginEmail;
    const passwordToUse = demoPassword || loginPassword;

    try {
      const data = await api.login(emailToUse, passwordToUse);
      setUser(data.user);
      setActiveTab("pos");
    } catch (err) {
      setLoginError(err.message || "Failed to log in");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoginLoading(true);

    if (!regName.trim() || !regEmail.trim() || !regPassword.trim()) {
      setLoginError("All fields are required");
      setLoginLoading(false);
      return;
    }

    try {
      const data = await api.register(regName, regEmail, regPassword, regRole);
      setUser(data.user);
      setActiveTab("pos");
    } catch (err) {
      setLoginError(err.message || "Failed to register");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    removeAuthToken();
    setUser(null);
    setCart([]);
  };

  const categories = useMemo(() => {
    const list = ["All"];
    menuItems.forEach((item) => {
      if (item.category && !list.includes(item.category)) {
        list.push(item.category);
      }
    });
    return list;
  }, [menuItems]);

  const filteredMenuItems = useMemo(() => {
    return menuItems.filter((item) => {
      const matchCat = selectedCategory === "All" || item.category === selectedCategory;
      const matchSearch =
        searchQuery.trim() === "" ||
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchCat && matchSearch;
    });
  }, [menuItems, selectedCategory, searchQuery]);

  const addToCart = (item) => {
    if (!item.isAvailable) return;
    setCart((prev) => {
      const existing = prev.find((i) => i.item._id === item._id);
      if (existing) {
        return prev.map((i) =>
          i.item._id === item._id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const updateQuantity = (itemId, delta) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.item._id === itemId) {
            const nextQty = i.quantity + delta;
            return nextQty > 0 ? { ...i, quantity: nextQty } : null;
          }
          return i;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (itemId) => {
    setCart((prev) => prev.filter((i) => i.item._id !== itemId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscountRate(0);
    setCustomerName("");
  };

  const cartCalculations = useMemo(() => {
    const subtotal = Math.round(
      cart.reduce((sum, i) => sum + i.item.price * i.quantity, 0) * 100
    ) / 100;
    const discountAmount = Math.round(((subtotal * (discountRate || 0)) / 100) * 100) / 100;
    const discountedSubtotal = Math.max(0, subtotal - discountAmount);
    const taxRate = 5;
    const taxAmount = Math.round(((discountedSubtotal * taxRate) / 100) * 100) / 100;
    const finalTotal = Math.round((discountedSubtotal + taxAmount) * 100) / 100;

    return {
      subtotal,
      discountAmount,
      taxRate,
      taxAmount,
      finalTotal
    };
  }, [cart, discountRate]);

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    setOrderSubmitting(true);
    setPosErrorMsg("");
    setPosSuccessMsg("");

    try {
      const payload = {
        orderType,
        tableNumber: orderType === "dine-in" ? tableNumber : "",
        customerName: customerName || (orderType === "dine-in" ? `${tableNumber} Guest` : "Takeaway Customer"),
        items: cart.map((i) => ({
          menuItemId: i.item._id,
          quantity: i.quantity
        })),
        taxRate: 5,
        discountRate: Number(discountRate) || 0
      };

      const res = await api.createOrder(payload);
      setPosSuccessMsg(`Order ${res.order.orderNumber} placed successfully!`);
      clearCart();
      await loadOrders();
      await loadDailySales(reportDate);
      setTimeout(() => setPosSuccessMsg(""), 4000);
    } catch (err) {
      setPosErrorMsg(err.message || "Failed to place order");
    } finally {
      setOrderSubmitting(false);
    }
  };

  const handleStatusTransition = async (orderId, newStatus) => {
    setActiveOrderActionId(orderId);
    try {
      await api.updateOrderStatus(orderId, newStatus);
      await loadOrders();
      await loadDailySales(reportDate);
    } catch (err) {
      alert(err.message || "Failed to update order status");
    } finally {
      setActiveOrderActionId(null);
    }
  };

  const handleRecordPayment = async () => {
    if (!selectedOrderForPayment) return;
    setPaymentSubmitting(true);
    try {
      await api.recordPayment(selectedOrderForPayment._id, paymentMethodChoice);
      setSelectedOrderForPayment(null);
      await loadOrders();
      if (activeTab === "reports") {
        await loadDailySales(reportDate);
      }
    } catch (err) {
      alert(err.message || "Failed to record payment");
    } finally {
      setPaymentSubmitting(false);
    }
  };

  const handleImageFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMenuImageUploading(true);
    setMenuFormError("");
    try {
      const res = await api.uploadImage(file, "menu");
      setMenuFormImageUrl(res.url);
    } catch (err) {
      setMenuFormError(err.message || "Failed to upload image to Cloudinary");
    } finally {
      setMenuImageUploading(false);
    }
  };

  const openAddMenuModal = () => {
    setEditingMenuItem(null);
    setMenuFormName("");
    setMenuFormCategory("Mains");
    setMenuFormPrice("");
    setMenuFormDescription("");
    setMenuFormAvailable(true);
    setMenuFormImageUrl("");
    setMenuFormError("");
    setMenuModalOpen(true);
  };

  const openEditMenuModal = (item) => {
    setEditingMenuItem(item);
    setMenuFormName(item.name);
    setMenuFormCategory(item.category);
    setMenuFormPrice(String(item.price));
    setMenuFormDescription(item.description || "");
    setMenuFormAvailable(item.isAvailable);
    setMenuFormImageUrl(item.imageUrl || "");
    setMenuFormError("");
    setMenuModalOpen(true);
  };

  const handleSaveMenuItem = async (e) => {
    e.preventDefault();
    setMenuFormError("");
    if (!menuFormName.trim()) {
      setMenuFormError("Item name is required");
      return;
    }
    if (!menuFormPrice || Number(menuFormPrice) < 0) {
      setMenuFormError("Valid non-negative price is required");
      return;
    }

    try {
      const payload = {
        name: menuFormName.trim(),
        category: menuFormCategory.trim(),
        price: Number(menuFormPrice),
        description: menuFormDescription.trim(),
        isAvailable: menuFormAvailable,
        imageUrl: menuFormImageUrl
      };

      if (editingMenuItem) {
        await api.updateMenuItem(editingMenuItem._id, payload);
      } else {
        await api.createMenuItem(payload);
      }
      setMenuModalOpen(false);
      await loadMenu();
    } catch (err) {
      setMenuFormError(err.message || "Failed to save menu item");
    }
  };

  const handleToggleMenuAvailability = async (itemId) => {
    try {
      await api.toggleMenuItem(itemId);
      await loadMenu();
    } catch (err) {
      alert(err.message || "Failed to toggle availability");
    }
  };

  const handleDeleteMenuItem = async (itemId) => {
    if (!confirm("Are you sure you want to delete this menu item?")) return;
    try {
      await api.deleteMenuItem(itemId);
      await loadMenu();
    } catch (err) {
      alert(err.message || "Failed to delete item");
    }
  };

  if (!user) {
    return (
      <div className="login-wrapper">
        <div className="login-card">
          <div style={{ textAlign: "center", marginBottom: "28px" }}>
            <div className="icon-box-amber">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 2v20M6 2v20M2 7h8M2 12h8M14 7h8" />
              </svg>
            </div>
            <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>Gourmet POS & Order Flow</h1>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "6px" }}>Professional POS Terminal & Kitchen Workflow Management</p>
          </div>

          {loginError && (
            <div style={{ background: "rgba(244, 63, 94, 0.12)", border: "1px solid rgba(244, 63, 94, 0.3)", borderRadius: "12px", padding: "12px 14px", color: "#fb7185", fontSize: "13px", marginBottom: "20px" }}>
              {loginError}
            </div>
          )}

          <div style={{ display: "flex", background: "rgba(255, 255, 255, 0.05)", padding: "4px", borderRadius: "10px", marginBottom: "22px", border: "1px solid var(--border-subtle)" }}>
            <button
              type="button"
              onClick={() => { setAuthMode("login"); setLoginError(""); }}
              style={{
                flex: 1,
                padding: "8px",
                fontSize: "12px",
                fontWeight: 800,
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                background: authMode === "login" ? "var(--accent-amber)" : "transparent",
                color: authMode === "login" ? "#07090e" : "var(--text-secondary)",
                transition: "all 0.2s"
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode("register"); setLoginError(""); }}
              style={{
                flex: 1,
                padding: "8px",
                fontSize: "12px",
                fontWeight: 800,
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                background: authMode === "register" ? "var(--accent-amber)" : "transparent",
                color: authMode === "register" ? "#07090e" : "var(--text-secondary)",
                transition: "all 0.2s"
              }}
            >
              Create Account
            </button>
          </div>

          {authMode === "login" ? (
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  required
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="name@urstechsolution.com"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  type="password"
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="form-input"
                />
              </div>

              <button type="submit" disabled={loginLoading} className="btn-primary" style={{ marginTop: "8px" }}>
                {loginLoading ? "Authenticating..." : "Sign In to Terminal"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  required
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="John Doe"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Password (min. 6 characters)</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="••••••••"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Account Role</label>
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value)}
                  className="form-input"
                  style={{ background: "#161e31" }}
                >
                  <option value="staff">Staff Cashier (POS & Billing)</option>
                  <option value="admin">Admin Manager (Menu & Reports)</option>
                </select>
              </div>

              <button type="submit" disabled={loginLoading} className="btn-primary" style={{ marginTop: "8px" }}>
                {loginLoading ? "Creating Account..." : "Create Account & Sign In"}
              </button>
            </form>
          )}

          <div style={{ marginTop: "28px", paddingTop: "20px", borderTop: "1px solid var(--border-subtle)" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em", textAlign: "center", marginBottom: "12px" }}>
              1-Click Reviewer Demo Access
            </div>
            <div className="demo-login-grid">
              <button
                type="button"
                onClick={() => handleLogin(null, "admin@urstechsolution.com", "admin123")}
                className="btn-demo"
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "12px", fontWeight: 800, color: "var(--accent-amber)" }}>Admin Role</span>
                  <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "6px", background: "rgba(245, 158, 11, 0.15)", color: "var(--accent-amber)", fontWeight: 700 }}>Full</span>
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px" }}>admin@urstechsolution.com</div>
              </button>
              <button
                type="button"
                onClick={() => handleLogin(null, "staff@urstechsolution.com", "staff123")}
                className="btn-demo"
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: "12px", fontWeight: 800, color: "#34d399" }}>Staff Role</span>
                  <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "6px", background: "rgba(52, 211, 153, 0.15)", color: "#34d399", fontWeight: 700 }}>POS</span>
                </div>
                <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "4px" }}>staff@urstechsolution.com</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", width: "100%", maxWidth: "100vw", overflowX: "hidden" }}>
      <header className="navbar no-print">
        <div className="nav-container">
          <div className="brand-badge">
            <div className="brand-icon">G</div>
            <div className="brand-text">
              <div className="brand-title">
                <span>Gourmet POS</span>
                <span className="version-pill">v2.0</span>
              </div>
              <div className="brand-subtitle">Order Flow & Billing</div>
            </div>
          </div>

          <div className="nav-tabs">
            <button
              onClick={() => setActiveTab("pos")}
              className={`tab-btn ${activeTab === "pos" ? "active" : ""}`}
            >
              POS Terminal
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`tab-btn ${activeTab === "orders" ? "active" : ""}`}
            >
              <span>Live Orders</span>
              {orders.filter((o) => ["Pending", "Preparing", "Ready"].includes(o.status)).length > 0 && (
                <span style={{ padding: "1px 6px", borderRadius: "10px", fontSize: "10px", background: "#f59e0b", color: "#000", fontWeight: 900 }}>
                  {orders.filter((o) => ["Pending", "Preparing", "Ready"].includes(o.status)).length}
                </span>
              )}
            </button>

            {user.role === "admin" && (
              <button
                onClick={() => setActiveTab("menu")}
                className={`tab-btn ${activeTab === "menu" ? "active" : ""}`}
              >
                Menu Admin
              </button>
            )}
            <button
              onClick={() => setActiveTab("reports")}
              className={`tab-btn ${activeTab === "reports" ? "active" : ""}`}
            >
              Daily Sales
            </button>
          </div>

          <div className="nav-user-area">
            <div className="user-pill">
              <div className="user-avatar">{user.name.charAt(0)}</div>
              <div className="user-info">
                <div className="user-name">{user.name}</div>
                <div className="user-role">{user.role}</div>
              </div>
            </div>

            <button onClick={handleLogout} className="btn-icon danger" title="Sign Out">
              <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      <main className="main-layout no-print" style={{ flex: 1 }}>
        {activeTab === "pos" && (
          <div>
            <div className="pos-mobile-nav">
              <button
                type="button"
                onClick={() => setMobilePosView("menu")}
                className={`pos-mobile-tab ${mobilePosView === "menu" ? "active" : ""}`}
              >
                🍽️ Menu ({filteredMenuItems.length})
              </button>
              <button
                type="button"
                onClick={() => setMobilePosView("cart")}
                className={`pos-mobile-tab ${mobilePosView === "cart" ? "active" : ""}`}
              >
                🛒 Cart ({cart.reduce((s, i) => s + i.quantity, 0)}) {cart.length > 0 ? `• ₹${cartCalculations.finalTotal.toFixed(2)}` : ""}
              </button>
            </div>

            <div className="pos-grid">
              <div className={`pos-catalog-column ${mobilePosView === "menu" ? "mobile-visible" : ""}`}>
              <div className="filter-bar">
                <div className="search-wrap">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search dishes, drinks..."
                    className="form-input"
                    style={{ padding: "8px 12px", fontSize: "12px" }}
                  />
                </div>

                <div className="category-scroll">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`category-pill ${selectedCategory === cat ? "active" : ""}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {menuLoading ? (
                <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)", fontSize: "14px" }}>
                  Loading gourmet menu items...
                </div>
              ) : filteredMenuItems.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 0", border: "1px dashed var(--border-subtle)", borderRadius: "16px", color: "var(--text-muted)", fontSize: "13px" }}>
                  No dishes found matching "{searchQuery}"
                </div>
              ) : (
                <div className="menu-card-grid">
                  {filteredMenuItems.map((item) => (
                    <div key={item._id} className={`menu-card ${!item.isAvailable ? "disabled" : ""}`}>
                      <div className="menu-card-img-wrap">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="menu-card-img"
                            onError={(e) => {
                              e.currentTarget.onerror = null;
                              e.currentTarget.style.display = "none";
                              if (e.currentTarget.parentElement) {
                                const fallback = document.createElement("div");
                                fallback.style.cssText = "width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: var(--text-muted); font-weight: 800; font-size: 24px;";
                                fallback.innerText = item.name.charAt(0);
                                e.currentTarget.parentElement.appendChild(fallback);
                              }
                            }}
                          />
                        ) : (
                          <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontWeight: 800 }}>
                            {item.name.charAt(0)}
                          </div>
                        )}
                        <span className="menu-cat-tag">{item.category}</span>
                        {!item.isAvailable && <div className="unavailable-overlay">Unavailable</div>}
                      </div>

                      <div className="menu-card-content">
                        <div>
                          <div className="menu-item-title">{item.name}</div>
                          {item.description && <div className="menu-item-desc">{item.description}</div>}
                        </div>

                        <div className="menu-card-footer">
                          <span className="price-tag">₹{item.price.toFixed(2)}</span>
                          <button
                            disabled={!item.isAvailable}
                            onClick={() => addToCart(item)}
                            className="btn-add"
                          >
                            + Add
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              </div>

              <div className={`pos-cart-column ${mobilePosView === "cart" ? "mobile-visible" : ""}`}>
                <div id="cart-drawer" className="cart-panel">
                  {mobilePosView === "cart" && (
                    <button
                      type="button"
                      onClick={() => setMobilePosView("menu")}
                      className="btn-secondary"
                      style={{ width: "100%", padding: "8px 12px", fontSize: "12px", marginBottom: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                    >
                      ← Back to Menu
                    </button>
                  )}
                  <div className="cart-header">
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "rgba(245, 158, 11, 0.15)", color: "var(--accent-amber)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                      </svg>
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: 800, color: "#fff" }}>Current Order</div>
                  </div>
                  {cart.length > 0 && (
                    <button onClick={clearCart} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
                      Clear
                    </button>
                  )}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", background: "#090d16", padding: "4px", borderRadius: "12px", border: "1px solid var(--border-subtle)", marginTop: "14px" }}>
                  <button
                    onClick={() => setOrderType("dine-in")}
                    style={{
                      padding: "8px",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: 700,
                      border: "none",
                      background: orderType === "dine-in" ? "var(--accent-amber)" : "transparent",
                      color: orderType === "dine-in" ? "#07090e" : "var(--text-secondary)",
                      cursor: "pointer"
                    }}
                  >
                    Dine-In
                  </button>
                  <button
                    onClick={() => setOrderType("takeaway")}
                    style={{
                      padding: "8px",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: 700,
                      border: "none",
                      background: orderType === "takeaway" ? "var(--accent-amber)" : "transparent",
                      color: orderType === "takeaway" ? "#07090e" : "var(--text-secondary)",
                      cursor: "pointer"
                    }}
                  >
                    Takeaway
                  </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: orderType === "dine-in" ? "1fr 1.5fr" : "1fr", gap: "8px", marginTop: "10px" }}>
                  {orderType === "dine-in" && (
                    <div>
                      <label className="form-label">Table</label>
                      <input
                        type="text"
                        value={tableNumber}
                        onChange={(e) => setTableNumber(e.target.value)}
                        className="form-input"
                        style={{ padding: "8px 10px", fontSize: "12px" }}
                      />
                    </div>
                  )}
                  <div>
                    <label className="form-label">Customer</label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Guest Name (optional)"
                      className="form-input"
                      style={{ padding: "8px 10px", fontSize: "12px" }}
                    />
                  </div>
                </div>

                <div className="cart-items-box">
                  {cart.length === 0 ? (
                    <div style={{ height: "140px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "12px" }}>
                      <span>Cart is empty</span>
                      <span style={{ fontSize: "11px", marginTop: "4px" }}>Click + Add on items from the menu</span>
                    </div>
                  ) : (
                    cart.map((cartItem) => (
                      <div key={cartItem.item._id} className="cart-item-row">
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "12px", fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {cartItem.item.name}
                          </div>
                          <div style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                            ₹{cartItem.item.price.toFixed(2)} × {cartItem.quantity} ={" "}
                            <span style={{ color: "var(--accent-amber)", fontWeight: 700 }}>
                              ₹{(cartItem.item.price * cartItem.quantity).toFixed(2)}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <button
                            onClick={() => updateQuantity(cartItem.item._id, -1)}
                            style={{ width: "24px", height: "24px", borderRadius: "6px", background: "#161e31", color: "#fff", border: "1px solid var(--border-subtle)", cursor: "pointer", fontWeight: 800, fontSize: "12px" }}
                          >
                            -
                          </button>
                          <span style={{ width: "20px", textAlign: "center", fontSize: "12px", fontWeight: 800 }}>
                            {cartItem.quantity}
                          </span>
                          <button
                            onClick={() => updateQuantity(cartItem.item._id, 1)}
                            style={{ width: "24px", height: "24px", borderRadius: "6px", background: "#161e31", color: "#fff", border: "1px solid var(--border-subtle)", cursor: "pointer", fontWeight: 800, fontSize: "12px" }}
                          >
                            +
                          </button>
                          <button
                            onClick={() => removeFromCart(cartItem.item._id)}
                            style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: "4px" }}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="cart-totals-box">
                  <div className="totals-row">
                    <span>Subtotal</span>
                    <span style={{ fontFamily: "var(--font-mono)", color: "#fff" }}>₹{cartCalculations.subtotal.toFixed(2)}</span>
                  </div>

                  <div className="totals-row">
                    <span>Discount {discountRate > 0 ? `(${discountRate}%)` : ""}</span>
                    <span style={{ fontFamily: "var(--font-mono)", color: discountRate > 0 ? "#fb7185" : "var(--text-muted)" }}>
                      {discountRate > 0 ? `-₹${cartCalculations.discountAmount.toFixed(2)}` : "₹0.00"}
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: "4px", margin: "6px 0 10px 0" }}>
                    {[0, 5, 10, 15, 20].map((rate) => (
                      <button
                        key={rate}
                        type="button"
                        onClick={() => setDiscountRate(rate)}
                        style={{
                          flex: 1,
                          padding: "5px 0",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: 800,
                          border: "1px solid",
                          borderColor: discountRate === rate ? "var(--accent-amber)" : "var(--border-subtle)",
                          background: discountRate === rate ? "rgba(245, 158, 11, 0.18)" : "#090d16",
                          color: discountRate === rate ? "var(--accent-amber)" : "var(--text-secondary)",
                          cursor: "pointer",
                          transition: "all 0.15s ease"
                        }}
                      >
                        {rate === 0 ? "0%" : `${rate}%`}
                      </button>
                    ))}
                    <div style={{ position: "relative", width: "62px" }}>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        placeholder="%"
                        value={discountRate === 0 ? "" : discountRate}
                        onChange={(e) => {
                          const val = e.target.value === "" ? 0 : Math.min(100, Math.max(0, parseFloat(e.target.value) || 0));
                          setDiscountRate(val);
                        }}
                        style={{
                          width: "100%",
                          padding: "5px 16px 5px 6px",
                          background: "#090d16",
                          border: `1px solid ${[0, 5, 10, 15, 20].includes(discountRate) ? "var(--border-subtle)" : "var(--accent-amber)"}`,
                          borderRadius: "6px",
                          color: "#fff",
                          fontSize: "11px",
                          fontFamily: "var(--font-mono)",
                          textAlign: "right",
                          outline: "none"
                        }}
                      />
                      <span style={{ position: "absolute", right: "5px", top: "50%", transform: "translateY(-50%)", fontSize: "10px", color: "var(--text-muted)", pointerEvents: "none" }}>%</span>
                    </div>
                  </div>

                  <div className="totals-row">
                    <span>Tax (5% GST/VAT)</span>
                    <span style={{ fontFamily: "var(--font-mono)", color: "#fff" }}>₹{cartCalculations.taxAmount.toFixed(2)}</span>
                  </div>

                  <div className="totals-final">
                    <span>Final Total</span>
                    <span style={{ fontFamily: "var(--font-mono)", color: "var(--accent-amber)", fontSize: "18px", fontWeight: 900 }}>
                      ₹{cartCalculations.finalTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                {posSuccessMsg && (
                  <div style={{ background: "rgba(16, 185, 129, 0.12)", border: "1px solid rgba(16, 185, 129, 0.25)", color: "#34d399", padding: "10px 12px", borderRadius: "10px", fontSize: "12px", fontWeight: 700, marginTop: "12px" }}>
                    {posSuccessMsg}
                  </div>
                )}

                {posErrorMsg && (
                  <div style={{ background: "rgba(244, 63, 94, 0.12)", border: "1px solid rgba(244, 63, 94, 0.25)", color: "#fb7185", padding: "10px 12px", borderRadius: "10px", fontSize: "12px", fontWeight: 700, marginTop: "12px" }}>
                    {posErrorMsg}
                  </div>
                )}

                <button
                  disabled={cart.length === 0 || orderSubmitting}
                  onClick={handlePlaceOrder}
                  className="btn-primary"
                  style={{ marginTop: "14px" }}
                >
                  {orderSubmitting ? "Placing Order..." : "Confirm & Send to Kitchen"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

        {activeTab === "pos" && cart.length > 0 && mobilePosView === "menu" && (
          <div className="mobile-cart-bar">
            <div>
              <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                {cart.reduce((s, i) => s + i.quantity, 0)} item{cart.length > 1 ? "s" : ""} selected
              </div>
              <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--accent-amber)", fontFamily: "var(--font-mono)" }}>
                ₹{cartCalculations.finalTotal.toFixed(2)}
              </div>
            </div>
            <button
              onClick={() => {
                setMobilePosView("cart");
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="btn-primary"
              style={{ width: "auto", padding: "10px 18px", fontSize: "12px" }}
            >
              Review Order →
            </button>
          </div>
        )}

        {activeTab === "orders" && (
          <div>
            <div className="filter-bar">
              <div style={{ display: "flex", gap: "6px", overflowX: "auto", flex: 1 }}>
                {["All", "Pending", "Preparing", "Ready", "Completed", "Cancelled"].map((status) => (
                  <button
                    key={status}
                    onClick={() => setOrderStatusFilter(status)}
                    className={`category-pill ${orderStatusFilter === status ? "active" : ""}`}
                  >
                    {status}
                  </button>
                ))}
              </div>

              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <input
                  type="text"
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                  placeholder="Search order #, table..."
                  className="form-input"
                  style={{ width: "220px", padding: "8px 12px", fontSize: "12px" }}
                />
                <button onClick={loadOrders} className="btn-icon" title="Refresh">
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>

            {ordersLoading && orders.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>Fetching active orders...</div>
            ) : orders.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", border: "1px dashed var(--border-subtle)", borderRadius: "16px", color: "var(--text-muted)" }}>
                No orders under "{orderStatusFilter}"
              </div>
            ) : (
              <div className="orders-grid">
                {orders.map((order) => (
                  <div key={order._id} className="order-card">
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <div>
                          <div style={{ fontFamily: "var(--font-mono)", fontSize: "14px", fontWeight: 800, color: "#fff" }}>
                            {order.orderNumber}
                          </div>
                          <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                            {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            {" • "}
                            <span style={{ textTransform: "capitalize" }}>{order.orderType}</span>
                            {order.tableNumber ? ` (${order.tableNumber})` : ""}
                          </div>
                          <div style={{ fontSize: "12px", fontWeight: 700, color: "#e2e8f0", marginTop: "2px" }}>
                            {order.customerName}
                          </div>
                        </div>

                        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                          <span className={`status-badge status-${order.status}`}>{order.status}</span>
                          <span style={{ fontSize: "10px", fontWeight: 800, padding: "2px 6px", borderRadius: "4px", background: order.paymentStatus === "Paid" ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)", color: order.paymentStatus === "Paid" ? "#34d399" : "#fbbf24" }}>
                            {order.paymentStatus === "Paid" ? `Paid (${order.paymentMethod})` : "Unpaid"}
                          </span>
                        </div>
                      </div>

                      <div style={{ marginTop: "14px", paddingTop: "10px", borderTop: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", gap: "4px" }}>
                        {order.items.map((it, idx) => (
                          <div key={idx} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--text-secondary)" }}>
                            <span>{it.quantity} × {it.name}</span>
                            <span style={{ fontFamily: "var(--font-mono)" }}>₹{it.subtotal.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>

                      <div style={{ marginTop: "12px", paddingTop: "8px", borderTop: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Total Bill</span>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "16px", fontWeight: 900, color: "var(--accent-amber)" }}>
                          ₹{order.finalTotal.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "16px", paddingTop: "12px", borderTop: "1px solid var(--border-subtle)" }}>
                      {order.status === "Pending" && (
                        <button
                          disabled={activeOrderActionId === order._id}
                          onClick={() => handleStatusTransition(order._id, "Preparing")}
                          style={{ flex: 1, padding: "8px", borderRadius: "10px", background: "#3b82f6", color: "#fff", border: "none", fontSize: "11px", fontWeight: 800, cursor: "pointer" }}
                        >
                          Start Preparing
                        </button>
                      )}

                      {order.status === "Preparing" && (
                        <button
                          disabled={activeOrderActionId === order._id}
                          onClick={() => handleStatusTransition(order._id, "Ready")}
                          style={{ flex: 1, padding: "8px", borderRadius: "10px", background: "#8b5cf6", color: "#fff", border: "none", fontSize: "11px", fontWeight: 800, cursor: "pointer" }}
                        >
                          Mark Ready
                        </button>
                      )}

                      {order.status === "Ready" && (
                        <button
                          disabled={activeOrderActionId === order._id}
                          onClick={() => handleStatusTransition(order._id, "Completed")}
                          style={{ flex: 1, padding: "8px", borderRadius: "10px", background: "#10b981", color: "#000", border: "none", fontSize: "11px", fontWeight: 900, cursor: "pointer" }}
                        >
                          Complete Order
                        </button>
                      )}

                      {order.paymentStatus === "Pending" && order.status !== "Cancelled" && (
                        <button
                          onClick={() => setSelectedOrderForPayment(order)}
                          style={{ padding: "8px 12px", borderRadius: "10px", background: "rgba(245, 158, 11, 0.15)", border: "1px solid rgba(245, 158, 11, 0.3)", color: "var(--accent-amber)", fontSize: "11px", fontWeight: 800, cursor: "pointer" }}
                        >
                          Pay
                        </button>
                      )}

                      <button
                        onClick={() => setPrintableOrder(order)}
                        className="btn-icon"
                        title="Print Invoice Receipt"
                        style={{ width: "34px", height: "34px" }}
                      >
                        <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                      </button>

                      {["Pending", "Preparing"].includes(order.status) && (
                        <button
                          onClick={() => {
                            if (confirm(`Cancel order ${order.orderNumber}?`)) {
                              handleStatusTransition(order._id, "Cancelled");
                            }
                          }}
                          className="btn-icon danger"
                          title="Cancel"
                          style={{ width: "34px", height: "34px" }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}



        {activeTab === "menu" && user.role === "admin" && (
          <div>
            <div className="filter-bar">
              <div>
                <h2 style={{ fontSize: "15px", fontWeight: 800, color: "#fff" }}>Menu Catalog Administration</h2>
                <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>Add, update, activate/deactivate dishes and upload images to Cloudinary</p>
              </div>

              <button onClick={openAddMenuModal} className="btn-primary" style={{ width: "auto", padding: "10px 18px" }}>
                + Add Dish
              </button>
            </div>

            <div className="table-responsive">
              <table className="table-custom">
                <thead>
                  <tr>
                    <th>Dish / Item</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {menuItems.map((item) => (
                    <tr key={item._id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <div style={{ width: "38px", height: "38px", borderRadius: "8px", overflow: "hidden", background: "#161e31", flexShrink: 0 }}>
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                onError={(e) => {
                                  e.currentTarget.onerror = null;
                                  e.currentTarget.style.display = "none";
                                  if (e.currentTarget.parentElement) {
                                    const fallback = document.createElement("div");
                                    fallback.style.cssText = "width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-weight: 800; color: var(--text-muted);";
                                    fallback.innerText = item.name.charAt(0);
                                    e.currentTarget.parentElement.appendChild(fallback);
                                  }
                                }}
                              />
                            ) : (
                              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "var(--text-muted)" }}>
                                {item.name.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, color: "#fff" }}>{item.name}</div>
                            <div style={{ fontSize: "11px", color: "var(--text-muted)", maxWidth: "260px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {item.description || "No description"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ padding: "4px 8px", borderRadius: "6px", background: "#161e31", fontSize: "11px", fontWeight: 700, color: "var(--text-secondary)" }}>
                          {item.category}
                        </span>
                      </td>
                      <td style={{ fontFamily: "var(--font-mono)", fontWeight: 800, color: "var(--accent-amber)" }}>
                        ₹{item.price.toFixed(2)}
                      </td>
                      <td>
                        <button
                          onClick={() => handleToggleMenuAvailability(item._id)}
                          style={{
                            padding: "4px 10px",
                            borderRadius: "20px",
                            fontSize: "11px",
                            fontWeight: 800,
                            border: "none",
                            cursor: "pointer",
                            background: item.isAvailable ? "rgba(16, 185, 129, 0.15)" : "rgba(244, 63, 94, 0.15)",
                            color: item.isAvailable ? "#34d399" : "#fb7185"
                          }}
                        >
                          {item.isAvailable ? "Available" : "Unavailable"}
                        </button>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "6px" }}>
                          <button
                            onClick={() => openEditMenuModal(item)}
                            style={{ padding: "6px 12px", borderRadius: "8px", background: "#161e31", color: "#fff", border: "1px solid var(--border-subtle)", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteMenuItem(item._id)}
                            style={{ padding: "6px 12px", borderRadius: "8px", background: "rgba(244, 63, 94, 0.12)", color: "#fb7185", border: "1px solid rgba(244, 63, 94, 0.25)", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}
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
          </div>
        )}

        {activeTab === "reports" && (
          <div>
            <div className="filter-bar">
              <div>
                <h2 style={{ fontSize: "15px", fontWeight: 800, color: "#fff" }}>Daily Sales Performance</h2>
                <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>Sales breakdown, payment statistics, and ticket averages</p>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button
                  type="button"
                  disabled={dailySalesLoading}
                  onClick={() => loadDailySales(reportDate)}
                  style={{
                    padding: "6px 12px",
                    borderRadius: "10px",
                    background: "#161e31",
                    color: "#fff",
                    border: "1px solid var(--border-subtle)",
                    fontSize: "12px",
                    fontWeight: 700,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>{dailySalesLoading ? "Syncing..." : "Sync Live"}</span>
                </button>
                <label style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-secondary)" }}>Report Date:</label>
                <input
                  type="date"
                  value={reportDate}
                  onChange={(e) => setReportDate(e.target.value)}
                  className="form-input"
                  style={{ width: "150px", padding: "6px 10px", fontSize: "12px" }}
                />
              </div>
            </div>

            {dailySalesLoading && !dailySalesData ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>Compiling report...</div>
            ) : !dailySalesData ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>No report data available</div>
            ) : (
              <div>
                <div className="stats-grid">
                  <div className="stat-card">
                    <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>Total Paid Revenue</div>
                    <div className="stat-value" style={{ color: "var(--accent-amber)" }}>
                      ₹{dailySalesData.summary.totalSales.toFixed(2)}
                    </div>
                  </div>

                  <div className="stat-card">
                    <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>Orders Today</div>
                    <div className="stat-value">
                      {dailySalesData.summary.totalOrders}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                      {dailySalesData.summary.completedOrders} completed
                    </div>
                  </div>

                  <div className="stat-card">
                    <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>Average Ticket Size</div>
                    <div className="stat-value" style={{ color: "#34d399" }}>
                      ₹{dailySalesData.summary.averageOrderValue.toFixed(2)}
                    </div>
                  </div>

                  <div className="stat-card">
                    <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>Dine-In vs Takeaway</div>
                    <div className="stat-value" style={{ color: "#60a5fa" }}>
                      {dailySalesData.summary.orderTypeBreakdown.dineIn} / {dailySalesData.summary.orderTypeBreakdown.takeaway}
                    </div>
                  </div>
                </div>

                <div className="dashboard-two-col">
                  <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "18px", padding: "18px" }}>
                    <div style={{ fontSize: "13px", fontWeight: 800, color: "#fff", marginBottom: "12px" }}>Payment Channels</div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "var(--text-secondary)" }}>UPI / Instant QR</span>
                        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 800, color: "var(--accent-amber)" }}>₹{dailySalesData.summary.paymentBreakdown.UPI.toFixed(2)}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "var(--text-secondary)" }}>Cash</span>
                        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 800, color: "#34d399" }}>₹{dailySalesData.summary.paymentBreakdown.Cash.toFixed(2)}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "var(--text-secondary)" }}>Card</span>
                        <span style={{ fontFamily: "var(--font-mono)", fontWeight: 800, color: "#60a5fa" }}>₹{dailySalesData.summary.paymentBreakdown.Card.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "18px", padding: "18px" }}>
                    <div style={{ fontSize: "13px", fontWeight: 800, color: "#fff", marginBottom: "12px" }}>Status Pipeline</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "12px" }}>
                      <div style={{ background: "#090d16", padding: "8px 12px", borderRadius: "10px", border: "1px solid var(--border-subtle)" }}>
                        <span style={{ color: "var(--text-muted)" }}>Pending:</span> <strong style={{ color: "var(--accent-amber)" }}>{dailySalesData.summary.pendingOrders}</strong>
                      </div>
                      <div style={{ background: "#090d16", padding: "8px 12px", borderRadius: "10px", border: "1px solid var(--border-subtle)" }}>
                        <span style={{ color: "var(--text-muted)" }}>Preparing:</span> <strong style={{ color: "#60a5fa" }}>{dailySalesData.summary.preparingOrders}</strong>
                      </div>
                      <div style={{ background: "#090d16", padding: "8px 12px", borderRadius: "10px", border: "1px solid var(--border-subtle)" }}>
                        <span style={{ color: "var(--text-muted)" }}>Ready:</span> <strong style={{ color: "#c084fc" }}>{dailySalesData.summary.readyOrders}</strong>
                      </div>
                      <div style={{ background: "#090d16", padding: "8px 12px", borderRadius: "10px", border: "1px solid var(--border-subtle)" }}>
                        <span style={{ color: "var(--text-muted)" }}>Cancelled:</span> <strong style={{ color: "#fb7185" }}>{dailySalesData.summary.cancelledOrders}</strong>
                      </div>
                    </div>
                  </div>
                </div>

                {dailySalesData.topItems && dailySalesData.topItems.length > 0 && (
                  <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "18px", padding: "18px", marginTop: "16px" }}>
                    <div style={{ fontSize: "14px", fontWeight: 800, color: "#fff", marginBottom: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span>Top Selling Dishes Leaderboard</span>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Live Sales Velocity</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px" }}>
                      {dailySalesData.topItems.map((item, idx) => (
                        <div key={item.name} style={{ background: "#090d16", border: "1px solid var(--border-subtle)", borderRadius: "12px", padding: "12px", display: "flex", alignItems: "center", gap: "12px" }}>
                          <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: idx === 0 ? "rgba(245, 158, 11, 0.2)" : "#161e31", color: idx === 0 ? "var(--accent-amber)" : "var(--text-secondary)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 900, fontSize: "13px" }}>
                            #{idx + 1}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: "13px", fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.name}</div>
                            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                              <span style={{ color: "var(--accent-amber)", fontWeight: 800, fontFamily: "var(--font-mono)" }}>{item.quantity} sold</span> • ₹{item.revenue.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {dailySalesData.recentOrders && dailySalesData.recentOrders.length > 0 && (
                  <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "18px", overflow: "hidden", marginTop: "16px" }}>
                    <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <h3 style={{ fontSize: "14px", fontWeight: 800, color: "#fff" }}>Today's Transaction & Order Ledger</h3>
                        <p style={{ fontSize: "11px", color: "var(--text-muted)" }}>Complete operational record of orders, tables, and settlements</p>
                      </div>
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--accent-amber)" }}>
                        {dailySalesData.recentOrders.length} Recorded Orders
                      </span>
                    </div>
                    <div style={{ overflowX: "auto" }}>
                      <table className="table-custom">
                        <thead>
                          <tr>
                            <th>Order #</th>
                            <th>Time</th>
                            <th>Type / Table</th>
                            <th>Customer</th>
                            <th>Items</th>
                            <th>Total Bill</th>
                            <th>Payment</th>
                            <th>Status</th>
                            <th style={{ textAlign: "right" }}>Receipt</th>
                          </tr>
                        </thead>
                        <tbody>
                          {dailySalesData.recentOrders.map((ord) => (
                            <tr key={ord._id}>
                              <td style={{ fontFamily: "var(--font-mono)", fontWeight: 800, color: "var(--accent-amber)" }}>
                                {ord.orderNumber}
                              </td>
                              <td style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                                {new Date(ord.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </td>
                              <td>
                                <span style={{ padding: "2px 7px", borderRadius: "6px", background: "#161e31", fontSize: "11px", textTransform: "capitalize", color: "#e2e8f0" }}>
                                  {ord.orderType} {ord.tableNumber ? `• ${ord.tableNumber}` : ""}
                                </span>
                              </td>
                              <td style={{ fontWeight: 700, color: "#fff" }}>{ord.customerName}</td>
                              <td style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                                {ord.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")}
                              </td>
                              <td style={{ fontFamily: "var(--font-mono)", fontWeight: 800, color: "#fff" }}>
                                ₹{ord.finalTotal.toFixed(2)}
                              </td>
                              <td>
                                <span style={{ padding: "2px 7px", borderRadius: "4px", background: ord.paymentStatus === "Paid" ? "rgba(16, 185, 129, 0.15)" : "rgba(244, 63, 94, 0.15)", color: ord.paymentStatus === "Paid" ? "#34d399" : "#fb7185", fontSize: "10px", fontWeight: 800 }}>
                                  {ord.paymentStatus} {ord.paymentMethod !== "Pending" ? `(${ord.paymentMethod})` : ""}
                                </span>
                              </td>
                              <td>
                                <span className={`status-badge status-${ord.status}`}>
                                  {ord.status}
                                </span>
                              </td>
                              <td style={{ textAlign: "right" }}>
                                <button
                                  type="button"
                                  onClick={() => setPrintableOrder(ord)}
                                  style={{ padding: "5px 10px", borderRadius: "6px", background: "#161e31", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}
                                >
                                  Print Slip
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {selectedOrderForPayment && (
        <div className="modal-backdrop">
          <div className="modal-window">
            <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#fff" }}>Record Order Payment</h3>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>
              Order {selectedOrderForPayment.orderNumber} • Total Due:{" "}
              <strong style={{ color: "var(--accent-amber)", fontFamily: "var(--font-mono)" }}>
                ₹{selectedOrderForPayment.finalTotal.toFixed(2)}
              </strong>
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "16px" }}>
              {["Cash", "UPI", "Card"].map((method) => (
                <label
                  key={method}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "12px 16px",
                    borderRadius: "12px",
                    border: `1px solid ${paymentMethodChoice === method ? "var(--accent-amber)" : "var(--border-subtle)"}`,
                    background: paymentMethodChoice === method ? "rgba(245, 158, 11, 0.1)" : "#090d16",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: 700,
                    color: paymentMethodChoice === method ? "#fff" : "var(--text-secondary)"
                  }}
                >
                  <span>{method}</span>
                  <input
                    type="radio"
                    name="payMethod"
                    value={method}
                    checked={paymentMethodChoice === method}
                    onChange={(e) => setPaymentMethodChoice(e.target.value)}
                  />
                </label>
              ))}
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
              <button
                type="button"
                onClick={() => setSelectedOrderForPayment(null)}
                style={{ flex: 1, padding: "10px", borderRadius: "10px", background: "transparent", border: "1px solid var(--border-subtle)", color: "#fff", fontWeight: 700, fontSize: "12px", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={paymentSubmitting}
                onClick={handleRecordPayment}
                className="btn-primary"
                style={{ flex: 1, padding: "10px" }}
              >
                {paymentSubmitting ? "Recording..." : "Confirm Paid"}
              </button>
            </div>
          </div>
        </div>
      )}

      {menuModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-window">
            <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#fff" }}>
              {editingMenuItem ? "Edit Menu Dish" : "Create New Menu Dish"}
            </h3>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>
              Configure dish name, category, price, and upload to Cloudinary
            </p>

            {menuFormError && (
              <div style={{ background: "rgba(244, 63, 94, 0.12)", border: "1px solid rgba(244, 63, 94, 0.3)", color: "#fb7185", padding: "10px", borderRadius: "10px", fontSize: "12px", marginTop: "12px" }}>
                {menuFormError}
              </div>
            )}

            <form onSubmit={handleSaveMenuItem} style={{ marginTop: "14px" }}>
              <div className="form-group">
                <label className="form-label">Dish Name</label>
                <input
                  type="text"
                  required
                  value={menuFormName}
                  onChange={(e) => setMenuFormName(e.target.value)}
                  placeholder="e.g. Classic Truffle Pasta"
                  className="form-input"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select
                    value={menuFormCategory}
                    onChange={(e) => setMenuFormCategory(e.target.value)}
                    className="form-input"
                  >
                    <option value="Starters">Starters</option>
                    <option value="Mains">Mains</option>
                    <option value="Desserts">Desserts</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Sides">Sides</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={menuFormPrice}
                    onChange={(e) => setMenuFormPrice(e.target.value)}
                    placeholder="249"
                    className="form-input"
                    style={{ fontFamily: "var(--font-mono)" }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  rows="2"
                  value={menuFormDescription}
                  onChange={(e) => setMenuFormDescription(e.target.value)}
                  placeholder="Ingredients, preparation details..."
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Dish Photo (Cloudinary)</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFileUpload}
                  className="form-input"
                  style={{ padding: "8px" }}
                />
                {menuImageUploading && (
                  <div style={{ fontSize: "11px", color: "var(--accent-amber)", marginTop: "4px" }}>Uploading image to Cloudinary...</div>
                )}
                {menuFormImageUrl && (
                  <div style={{ width: "120px", height: "80px", borderRadius: "8px", overflow: "hidden", marginTop: "8px", border: "1px solid var(--border-subtle)" }}>
                    <img src={menuFormImageUrl} alt="Preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  </div>
                )}
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px", margin: "14px 0" }}>
                <input
                  type="checkbox"
                  id="availCheck"
                  checked={menuFormAvailable}
                  onChange={(e) => setMenuFormAvailable(e.target.checked)}
                />
                <label htmlFor="availCheck" style={{ fontSize: "12px", fontWeight: 700, color: "#fff", cursor: "pointer" }}>
                  Available for customer orders
                </label>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                <button
                  type="button"
                  onClick={() => setMenuModalOpen(false)}
                  style={{ flex: 1, padding: "10px", borderRadius: "10px", background: "transparent", border: "1px solid var(--border-subtle)", color: "#fff", fontWeight: 700, fontSize: "12px", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={menuImageUploading}
                  className="btn-primary"
                  style={{ flex: 1, padding: "10px" }}
                >
                  Save Dish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}



      {printableOrder && (
        <div className="modal-backdrop">
          <div className="receipt-modal">
            <div style={{ textAlign: "center", marginBottom: "8px" }}>
              <div style={{ fontSize: "16px", fontWeight: 900 }}>GOURMET RESTAURANT</div>
              <div style={{ fontSize: "10px", color: "#4b5563" }}>Dine-In & Takeaway POS</div>
              <div style={{ fontSize: "10px", color: "#6b7280" }}>100 UrsTech Boulevard</div>
            </div>

            <div className="receipt-divider"></div>

            <div style={{ fontSize: "11px", lineHeight: 1.4 }}>
              <div>Order: <strong>{printableOrder.orderNumber}</strong></div>
              <div>Date: {new Date(printableOrder.createdAt).toLocaleString()}</div>
              <div>Service: {printableOrder.orderType.toUpperCase()} {printableOrder.tableNumber ? `(${printableOrder.tableNumber})` : ""}</div>
              <div>Guest: {printableOrder.customerName}</div>
            </div>

            <div className="receipt-divider"></div>

            <div style={{ fontSize: "11px", display: "flex", flexDirection: "column", gap: "4px" }}>
              {printableOrder.items.map((it, idx) => (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>{it.quantity}x {it.name}</span>
                  <span>₹{it.subtotal.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="receipt-divider"></div>

            <div style={{ fontSize: "11px", display: "flex", flexDirection: "column", gap: "3px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Subtotal:</span>
                <span>₹{printableOrder.subtotal.toFixed(2)}</span>
              </div>
              {printableOrder.discountAmount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Discount ({printableOrder.discountRate}%):</span>
                  <span>-₹{printableOrder.discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Tax (5%):</span>
                <span>₹{printableOrder.taxAmount.toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: 900, marginTop: "4px", paddingTop: "4px", borderTop: "1px dashed #71717a" }}>
                <span>TOTAL:</span>
                <span>₹{printableOrder.finalTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="receipt-divider"></div>

            <div style={{ textAlign: "center", fontSize: "10px", color: "#4b5563" }}>
              Payment: {printableOrder.paymentStatus === "Paid" ? `PAID (${printableOrder.paymentMethod})` : "PAYMENT PENDING"}
              <div style={{ marginTop: "6px", fontStyle: "italic" }}>Thank you! Visit us again.</div>
            </div>

            <div className="no-print" style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
              <button
                type="button"
                onClick={() => setPrintableOrder(null)}
                style={{ flex: 1, padding: "8px", borderRadius: "8px", background: "#e4e4e7", color: "#18181b", border: "none", fontWeight: 700, fontSize: "11px", cursor: "pointer" }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                style={{ flex: 1, padding: "8px", borderRadius: "8px", background: "#000", color: "#fff", border: "none", fontWeight: 800, fontSize: "11px", cursor: "pointer" }}
              >
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
