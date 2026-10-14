"use client";

import { useState, useEffect, useMemo } from "react";
import { api, getStoredUser, setStoredUser, getAuthToken, removeAuthToken } from "../lib/api";

export default function RetailInventoryApp() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("pos");
  const [authMode, setAuthMode] = useState("login"); // "login" | "register"
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRole, setRegRole] = useState("staff");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [productCategory, setProductCategory] = useState("All");
  const [stockStatusFilter, setStockStatusFilter] = useState("all");
  const [availableCategories, setAvailableCategories] = useState([
    "All",
    "Grocery",
    "Apparel",
    "Electronics",
    "Stationery"
  ]);

  const [cart, setCart] = useState([]);
  const [discountRate, setDiscountRate] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [saleSubmitting, setSaleSubmitting] = useState(false);
  const [saleSuccessMsg, setSaleSuccessMsg] = useState("");
  const [saleErrorMsg, setSaleErrorMsg] = useState("");

  const [lowStockList, setLowStockList] = useState([]);
  const [lowStockLoading, setLowStockLoading] = useState(false);

  const [movements, setMovements] = useState([]);
  const [movementsLoading, setMovementsLoading] = useState(false);
  const [movementTypeFilter, setMovementTypeFilter] = useState("All");

  const [sales, setSales] = useState([]);
  const [salesLoading, setSalesLoading] = useState(false);
  const [saleSearchInvoice, setSaleSearchInvoice] = useState("");
  const [salePaymentFilter, setSalePaymentFilter] = useState("All");
  const [saleStatusFilter, setSaleStatusFilter] = useState("All");
  const [saleDateFilter, setSaleDateFilter] = useState("30d");
  const [selectedSaleDetail, setSelectedSaleDetail] = useState(null);

  const [profitReport, setProfitReport] = useState(null);
  const [salesReport, setSalesReport] = useState(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [csvExporting, setCsvExporting] = useState(false);

  const [productModalOpen, setProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [prodFormSku, setProdFormSku] = useState("");
  const [prodFormName, setProdFormName] = useState("");
  const [prodFormCategory, setProdFormCategory] = useState("Electronics");
  const [prodFormPurchasePrice, setProdFormPurchasePrice] = useState("");
  const [prodFormSellingPrice, setProdFormSellingPrice] = useState("");
  const [prodFormStock, setProdFormStock] = useState("");
  const [prodFormReorder, setProdFormReorder] = useState("10");
  const [prodFormError, setProdFormError] = useState("");

  const [adjustModalOpen, setAdjustModalOpen] = useState(false);
  const [adjustProductId, setAdjustProductId] = useState("");
  const [adjustType, setAdjustType] = useState("RECEIVED");
  const [adjustQuantity, setAdjustQuantity] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [adjustSubmitting, setAdjustSubmitting] = useState(false);
  const [adjustError, setAdjustError] = useState("");

  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returningSale, setReturningSale] = useState(null);
  const [returnReason, setReturnReason] = useState("");
  const [returnSubmitting, setReturnSubmitting] = useState(false);

  const [printableSale, setPrintableSale] = useState(null);

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

  const loadProducts = async () => {
    try {
      if (products.length === 0) {
        setProductsLoading(true);
      }
      const res = await api.getProducts({
        category: productCategory === "All" ? "" : productCategory,
        search: productSearch,
        stockStatus: stockStatusFilter === "all" ? "" : stockStatusFilter
      });
      setProducts(res.products || []);
    } catch (err) {
      console.error(err);
    } finally {
      setProductsLoading(false);
    }
  };

  const loadLowStock = async () => {
    try {
      if (lowStockList.length === 0) {
        setLowStockLoading(true);
      }
      const res = await api.getLowStock();
      setLowStockList(res.lowStockProducts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLowStockLoading(false);
    }
  };

  const loadMovements = async () => {
    try {
      if (movements.length === 0) {
        setMovementsLoading(true);
      }
      const res = await api.getMovements({
        type: movementTypeFilter === "All" ? "" : movementTypeFilter,
        limit: 50
      });
      setMovements(res.movements || []);
    } catch (err) {
      console.error(err);
    } finally {
      setMovementsLoading(false);
    }
  };

  const loadSales = async () => {
    try {
      if (sales.length === 0) {
        setSalesLoading(true);
      }
      const params = {};
      if (saleSearchInvoice) params.search = saleSearchInvoice;
      if (salePaymentFilter !== "All") params.paymentMethod = salePaymentFilter;
      if (saleStatusFilter !== "All") params.status = saleStatusFilter;

      const now = new Date();
      if (saleDateFilter === "today") {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        params.startDate = start.toISOString();
      } else if (saleDateFilter === "7d") {
        const d = new Date();
        d.setDate(d.getDate() - 7);
        params.startDate = d.toISOString();
      } else if (saleDateFilter === "30d") {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        params.startDate = d.toISOString();
      }

      const res = await api.getSales(params);
      setSales(res.sales || []);
    } catch (err) {
      console.error(err);
    } finally {
      setSalesLoading(false);
    }
  };

  const loadReports = async () => {
    try {
      if (!profitReport || !salesReport) {
        setReportLoading(true);
      }
      const [profitRes, salesRes] = await Promise.all([
        api.getProfitReport(),
        api.getSalesReport()
      ]);
      setProfitReport(profitRes);
      setSalesReport(salesRes);
    } catch (err) {
      console.error(err);
    } finally {
      setReportLoading(false);
    }
  };

  const loadAllCategories = async () => {
    try {
      const res = await api.getProducts({ category: "", search: "", stockStatus: "" });
      if (res.products && res.products.length > 0) {
        const set = new Set(["All", "Grocery", "Apparel", "Electronics", "Stationery"]);
        res.products.forEach((p) => {
          if (p.category) set.add(p.category);
        });
        setAvailableCategories(Array.from(set));
      }
    } catch (err) {
      console.error("Failed to load categories:", err);
    }
  };

  useEffect(() => {
    if (user) {
      loadAllCategories();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      loadProducts();
    }
  }, [user, productCategory, productSearch, stockStatusFilter]);

  useEffect(() => {
    if (!user) return;
    if (activeTab === "lowstock") loadLowStock();
    if (activeTab === "movements") loadMovements();
    if (activeTab === "sales") loadSales();
    if (activeTab === "analytics") loadReports();
  }, [user, activeTab, movementTypeFilter, saleSearchInvoice, salePaymentFilter, saleStatusFilter, saleDateFilter]);

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

  const categories = availableCategories;

  const addToCart = (product) => {
    if (product.availableStock <= 0) return;
    setCart((prev) => {
      const existing = prev.find((i) => i.product._id === product._id);
      if (existing) {
        if (existing.quantity >= product.availableStock) {
          alert(`Maximum stock reached for this SKU`);
          return prev;
        }
        return prev.map((i) =>
          i.product._id === product._id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateCartQuantity = (productId, delta) => {
    setCart((prev) =>
      prev
        .map((i) => {
          if (i.product._id === productId) {
            const nextQty = i.quantity + delta;
            if (nextQty > i.product.availableStock) {
              alert(`Cannot exceed available stock of ${i.product.availableStock}`);
              return i;
            }
            return nextQty > 0 ? { ...i, quantity: nextQty } : null;
          }
          return i;
        })
        .filter(Boolean)
    );
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((i) => i.product._id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscountRate(0);
  };

  const cartCalculations = useMemo(() => {
    const subtotal = Math.round(
      cart.reduce((sum, i) => sum + i.product.sellingPrice * i.quantity, 0) * 100
    ) / 100;
    const rate = Math.min(100, Math.max(0, parseFloat(discountRate) || 0));
    const discountAmount = Math.round(((subtotal * rate) / 100) * 100) / 100;
    const discountedSubtotal = Math.max(0, subtotal - discountAmount);
    const taxRate = 5;
    const taxAmount = Math.round(((discountedSubtotal * taxRate) / 100) * 100) / 100;
    const totalAmount = Math.round((discountedSubtotal + taxAmount) * 100) / 100;

    return {
      subtotal,
      discountRate: rate,
      discountAmount,
      taxRate,
      taxAmount,
      totalAmount,
      finalTotal: totalAmount
    };
  }, [cart, discountRate]);

  const handleCompleteSale = async () => {
    if (cart.length === 0) return;
    setSaleSubmitting(true);
    setSaleErrorMsg("");
    setSaleSuccessMsg("");

    try {
      const payload = {
        items: cart.map((i) => ({
          productId: i.product._id,
          quantity: i.quantity
        })),
        discountRate: Number(discountRate) || 0,
        discountAmount: cartCalculations.discountAmount,
        taxRate: 5,
        paymentMethod
      };

      const res = await api.createSale(payload);
      setSaleSuccessMsg(`Invoice ${res.sale.invoiceNumber} recorded!`);
      clearCart();
      await loadProducts();
      setTimeout(() => setSaleSuccessMsg(""), 4000);
    } catch (err) {
      setSaleErrorMsg(err.message || "Failed to complete sale");
    } finally {
      setSaleSubmitting(false);
    }
  };

  const openAddProductModal = () => {
    setEditingProduct(null);
    setProdFormSku("");
    setProdFormName("");
    setProdFormCategory("Electronics");
    setProdFormPurchasePrice("");
    setProdFormSellingPrice("");
    setProdFormStock("10");
    setProdFormReorder("5");
    setProdFormError("");
    setProductModalOpen(true);
  };

  const openEditProductModal = (prod) => {
    setEditingProduct(prod);
    setProdFormSku(prod.sku);
    setProdFormName(prod.name);
    setProdFormCategory(prod.category);
    setProdFormPurchasePrice(String(prod.purchasePrice));
    setProdFormSellingPrice(String(prod.sellingPrice));
    setProdFormStock(String(prod.availableStock));
    setProdFormReorder(String(prod.reorderLevel));
    setProdFormError("");
    setProductModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setProdFormError("");

    if (!prodFormSku.trim() || !prodFormName.trim()) {
      setProdFormError("SKU and Name are required");
      return;
    }

    try {
      const payload = {
        sku: prodFormSku.trim().toUpperCase(),
        name: prodFormName.trim(),
        category: prodFormCategory.trim(),
        purchasePrice: Number(prodFormPurchasePrice),
        sellingPrice: Number(prodFormSellingPrice),
        availableStock: parseInt(prodFormStock, 10) || 0,
        reorderLevel: parseInt(prodFormReorder, 10) || 10
      };

      if (editingProduct) {
        await api.updateProduct(editingProduct._id, payload);
      } else {
        await api.createProduct(payload);
      }

      setProductModalOpen(false);
      await loadAllCategories();
      await loadProducts();
    } catch (err) {
      setProdFormError(err.message || "Failed to save product");
    }
  };

  const openAdjustModal = (productId = "") => {
    setAdjustProductId(productId || (products[0] ? products[0]._id : ""));
    setAdjustType("RECEIVED");
    setAdjustQuantity("");
    setAdjustReason("");
    setAdjustError("");
    setAdjustModalOpen(true);
  };

  const handleAdjustInventory = async (e) => {
    e.preventDefault();
    setAdjustError("");
    const qty = parseInt(adjustQuantity, 10);
    if (!adjustProductId || isNaN(qty) || qty <= 0) {
      setAdjustError("Please choose a product and enter a positive quantity");
      return;
    }

    setAdjustSubmitting(true);
    try {
      await api.adjustInventory({
        productId: adjustProductId,
        type: adjustType,
        quantity: qty,
        reason: adjustReason.trim()
      });
      setAdjustModalOpen(false);
      await loadProducts();
      if (activeTab === "lowstock") await loadLowStock();
      if (activeTab === "movements") await loadMovements();
    } catch (err) {
      setAdjustError(err.message || "Failed to adjust inventory");
    } finally {
      setAdjustSubmitting(false);
    }
  };

  const handleQuickRestock = async (productId) => {
    try {
      await api.adjustInventory({
        productId,
        type: "RECEIVED",
        quantity: 20,
        reason: "1-Click Quick Restock from Low Stock Alert"
      });
      await loadLowStock();
      await loadProducts();
    } catch (err) {
      alert(err.message || "Restock failed");
    }
  };

  const openReturnModal = (sale) => {
    setReturningSale(sale);
    setReturnReason("");
    setReturnModalOpen(true);
  };

  const handleProcessReturn = async (e) => {
    e.preventDefault();
    if (!returningSale) return;
    setReturnSubmitting(true);
    try {
      await api.returnSale(returningSale._id, returnReason);
      setReturnModalOpen(false);
      setReturningSale(null);
      await loadSales();
      await loadProducts();
      if (activeTab === "movements") await loadMovements();
      alert("Sale returned and inventory stock restored successfully!");
    } catch (err) {
      alert(err.message || "Failed to process return");
    } finally {
      setReturnSubmitting(false);
    }
  };

  const handleDownloadCsv = async () => {
    setCsvExporting(true);
    try {
      const blob = await api.downloadSalesCsv();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sales-report-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message || "Failed to download CSV");
    } finally {
      setCsvExporting(false);
    }
  };

  if (!user) {
    return (
      <div className="login-wrapper">
        <div className="login-card">
          <div style={{ textAlign: "center", marginBottom: "28px" }}>
            <div className="icon-box-cyan">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
                <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
                <line x1="12" y1="22.08" x2="12" y2="12" />
              </svg>
            </div>
            <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>RetailCore Management</h1>
            <p style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "6px" }}>Retail Inventory Control, Checkout POS & Profit Analytics</p>
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
                background: authMode === "login" ? "var(--accent-cyan)" : "transparent",
                color: authMode === "login" ? "#060911" : "var(--text-secondary)",
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
                background: authMode === "register" ? "var(--accent-cyan)" : "transparent",
                color: authMode === "register" ? "#060911" : "var(--text-secondary)",
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
                {loginLoading ? "Authenticating..." : "Sign In to Inventory"}
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
                  placeholder="Jane Smith"
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
                  placeholder="jane@example.com"
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
                  style={{ background: "#162035" }}
                >
                  <option value="staff">Retail Cashier (POS & Sales)</option>
                  <option value="admin">Inventory Admin (Full Access & Stock)</option>
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
                  <span style={{ fontSize: "12px", fontWeight: 800, color: "var(--accent-cyan)" }}>Admin Role</span>
                  <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "6px", background: "rgba(6, 182, 212, 0.15)", color: "var(--accent-cyan)", fontWeight: 700 }}>Full</span>
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
                  <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "6px", background: "rgba(52, 211, 153, 0.15)", color: "#34d399", fontWeight: 700 }}>Cashier</span>
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
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header className="navbar no-print">
        <div className="nav-container">
          <div className="brand-badge">
            <div className="brand-icon">R</div>
            <div>
              <div className="brand-title">
                <span>RetailCore</span>
                <span className="version-pill">v2.0</span>
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>Inventory & Sales POS</div>
            </div>
          </div>

          <div className="nav-tabs">
            <button
              onClick={() => setActiveTab("pos")}
              className={`tab-btn ${activeTab === "pos" ? "active" : ""}`}
            >
              POS Sale
            </button>
            <button
              onClick={() => setActiveTab("products")}
              className={`tab-btn ${activeTab === "products" ? "active" : ""}`}
            >
              Products & Stock
            </button>
            <button
              onClick={() => setActiveTab("lowstock")}
              className={`tab-btn ${activeTab === "lowstock" ? "active" : ""}`}
            >
              <span>Low Stock</span>
              {products.filter((p) => p.availableStock <= p.reorderLevel).length > 0 && (
                <span style={{ padding: "1px 6px", borderRadius: "10px", fontSize: "10px", background: "var(--accent-cyan)", color: "#000", fontWeight: 900 }}>
                  {products.filter((p) => p.availableStock <= p.reorderLevel).length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("movements")}
              className={`tab-btn ${activeTab === "movements" ? "active" : ""}`}
            >
              Stock Audit
            </button>
            <button
              onClick={() => setActiveTab("sales")}
              className={`tab-btn ${activeTab === "sales" ? "active" : ""}`}
            >
              Sales Invoices
            </button>
            <button
              onClick={() => setActiveTab("analytics")}
              className={`tab-btn ${activeTab === "analytics" ? "active" : ""}`}
            >
              Profit & Reports
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div className="user-pill">
              <div className="user-avatar">{user.name.charAt(0)}</div>
              <div>
                <div style={{ fontSize: "12px", fontWeight: 800, color: "#fff", lineHeight: 1.1 }}>{user.name}</div>
                <div style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", color: "var(--accent-cyan)" }}>{user.role}</div>
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
          <div className="pos-grid">
            <div>
              <div className="filter-bar">
                <div className="search-wrap">
                  <input
                    type="text"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    placeholder="Search SKU or name..."
                    className="form-input"
                    style={{ padding: "8px 12px", fontSize: "12px" }}
                  />
                </div>

                <div className="category-scroll">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setProductCategory(cat)}
                      className={`category-pill ${productCategory === cat ? "active" : ""}`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {productsLoading ? (
                <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>Loading products...</div>
              ) : products.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 0", border: "1px dashed var(--border-subtle)", borderRadius: "16px", color: "var(--text-muted)" }}>
                  No retail products found
                </div>
              ) : (
                <div className="retail-card-grid">
                  {products.map((prod) => {
                    const isOut = prod.availableStock === 0;
                    const isLow = prod.availableStock <= prod.reorderLevel && prod.availableStock > 0;

                    return (
                      <div key={prod._id} className={`retail-card ${isOut ? "disabled" : ""}`}>
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px" }}>
                            <span style={{
                              fontFamily: "var(--font-mono)",
                              fontSize: "11px",
                              fontWeight: 800,
                              color: "var(--accent-cyan)",
                              background: "rgba(6, 182, 212, 0.12)",
                              padding: "3px 8px",
                              borderRadius: "6px",
                              border: "1px solid rgba(6, 182, 212, 0.3)",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px"
                            }}>
                              <span style={{ fontSize: "9px", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-muted)", fontWeight: 700 }}>SKU</span>
                              <span>{prod.sku}</span>
                            </span>
                            <span style={{ fontSize: "10px", fontWeight: 700, background: "#162035", padding: "3px 8px", borderRadius: "6px", color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}>
                              {prod.category}
                            </span>
                          </div>

                          <div style={{ marginTop: "12px" }}>
                            <div style={{ fontSize: "15px", fontWeight: 700, color: "#fff", lineHeight: 1.35, minHeight: "40px" }}>
                              {prod.name}
                            </div>
                            <div style={{ marginTop: "8px" }}>
                              <span style={{
                                padding: "3px 10px",
                                borderRadius: "20px",
                                fontSize: "11px",
                                fontWeight: 800,
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px",
                                background: isOut ? "rgba(244, 63, 94, 0.15)" : isLow ? "rgba(245, 158, 11, 0.15)" : "rgba(16, 185, 129, 0.15)",
                                color: isOut ? "#fb7185" : isLow ? "#fbbf24" : "#34d399",
                                border: `1px solid ${isOut ? "rgba(244, 63, 94, 0.3)" : isLow ? "rgba(245, 158, 11, 0.3)" : "rgba(16, 185, 129, 0.3)"}`
                              }}>
                                {isOut ? "✕ Out of Stock" : isLow ? `⚠ Low Stock: ${prod.availableStock} units` : `✓ ${prod.availableStock} in stock`}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px solid var(--border-subtle)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div>
                            <div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Price</div>
                            <span className="price-tag-cyan" style={{ fontSize: "18px" }}>₹{prod.sellingPrice.toFixed(2)}</span>
                          </div>
                          <button
                            disabled={isOut}
                            onClick={() => addToCart(prod)}
                            className="btn-primary"
                            style={{ width: "auto", padding: "8px 14px", fontSize: "12px", fontWeight: 700 }}
                          >
                            + Add to Sale
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <div id="cart-drawer" className="cart-panel">
                <div className="cart-header">
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "28px", height: "28px", borderRadius: "8px", background: "rgba(6, 182, 212, 0.15)", color: "var(--accent-cyan)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: 800, color: "#fff" }}>Sales Register Cart</div>
                  </div>
                  {cart.length > 0 && (
                    <button onClick={clearCart} style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}>
                      Clear
                    </button>
                  )}
                </div>

                <div className="cart-items-box">
                  {cart.length === 0 ? (
                    <div style={{ height: "140px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "12px" }}>
                      <span>Invoice cart is empty</span>
                      <span style={{ fontSize: "11px", marginTop: "4px" }}>Select products from inventory</span>
                    </div>
                  ) : (
                    cart.map((cartItem) => (
                      <div key={cartItem.product._id} className="cart-item-row">
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: "12px", fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {cartItem.product.name}
                          </div>
                          <div style={{ fontSize: "11px", color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                            {cartItem.product.sku} • ₹{cartItem.product.sellingPrice.toFixed(2)} × {cartItem.quantity} ={" "}
                            <span style={{ color: "var(--accent-cyan)", fontWeight: 700 }}>
                              ₹{(cartItem.product.sellingPrice * cartItem.quantity).toFixed(2)}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <button
                            onClick={() => updateCartQuantity(cartItem.product._id, -1)}
                            style={{ width: "24px", height: "24px", borderRadius: "6px", background: "#162035", color: "#fff", border: "1px solid var(--border-subtle)", cursor: "pointer", fontWeight: 800, fontSize: "12px" }}
                          >
                            -
                          </button>
                          <span style={{ width: "20px", textAlign: "center", fontSize: "12px", fontWeight: 800 }}>
                            {cartItem.quantity}
                          </span>
                          <button
                            onClick={() => updateCartQuantity(cartItem.product._id, 1)}
                            style={{ width: "24px", height: "24px", borderRadius: "6px", background: "#162035", color: "#fff", border: "1px solid var(--border-subtle)", cursor: "pointer", fontWeight: 800, fontSize: "12px" }}
                          >
                            +
                          </button>
                          <button
                            onClick={() => removeFromCart(cartItem.product._id)}
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
                          borderColor: discountRate === rate ? "var(--accent-cyan)" : "var(--border-subtle)",
                          background: discountRate === rate ? "rgba(6, 182, 212, 0.18)" : "#090d16",
                          color: discountRate === rate ? "var(--accent-cyan)" : "var(--text-secondary)",
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
                          border: `1px solid ${[0, 5, 10, 15, 20].includes(discountRate) ? "var(--border-subtle)" : "var(--accent-cyan)"}`,
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
                    <span>Tax (5% GST)</span>
                    <span style={{ fontFamily: "var(--font-mono)", color: "#fff" }}>₹{cartCalculations.taxAmount.toFixed(2)}</span>
                  </div>

                  <div className="totals-final">
                    <span>Invoice Total</span>
                    <span style={{ fontFamily: "var(--font-mono)", color: "var(--accent-cyan)", fontSize: "18px", fontWeight: 900 }}>
                      ₹{cartCalculations.totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div style={{ marginTop: "12px" }}>
                  <label className="form-label">Payment Channel</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "6px" }}>
                    {["Cash", "Card", "UPI"].map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setPaymentMethod(m)}
                        style={{
                          padding: "6px",
                          borderRadius: "8px",
                          fontSize: "11px",
                          fontWeight: 800,
                          border: `1px solid ${paymentMethod === m ? "var(--accent-cyan)" : "var(--border-subtle)"}`,
                          background: paymentMethod === m ? "rgba(6, 182, 212, 0.15)" : "#090d16",
                          color: paymentMethod === m ? "var(--accent-cyan)" : "var(--text-secondary)",
                          cursor: "pointer"
                        }}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                {saleSuccessMsg && (
                  <div style={{ background: "rgba(16, 185, 129, 0.12)", border: "1px solid rgba(16, 185, 129, 0.25)", color: "#34d399", padding: "10px 12px", borderRadius: "10px", fontSize: "12px", fontWeight: 700, marginTop: "12px" }}>
                    {saleSuccessMsg}
                  </div>
                )}

                {saleErrorMsg && (
                  <div style={{ background: "rgba(244, 63, 94, 0.12)", border: "1px solid rgba(244, 63, 94, 0.25)", color: "#fb7185", padding: "10px 12px", borderRadius: "10px", fontSize: "12px", fontWeight: 700, marginTop: "12px" }}>
                    {saleErrorMsg}
                  </div>
                )}

                <button
                  disabled={cart.length === 0 || saleSubmitting}
                  onClick={handleCompleteSale}
                  className="btn-primary"
                  style={{ marginTop: "14px" }}
                >
                  {saleSubmitting ? "Deducting Stock & Invoicing..." : "Complete Sale & Issue Invoice"}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === "pos" && cart.length > 0 && (
          <div className="mobile-cart-bar">
            <div>
              <div style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                {cart.reduce((s, i) => s + i.quantity, 0)} item{cart.length > 1 ? "s" : ""} in register
              </div>
              <div style={{ fontSize: "16px", fontWeight: 800, color: "var(--accent-cyan)", fontFamily: "var(--font-mono)" }}>
                ₹{cartCalculations.finalTotal.toFixed(2)}
              </div>
            </div>
            <button
              onClick={() => {
                const el = document.getElementById("cart-drawer");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              className="btn-primary"
              style={{ width: "auto", padding: "10px 18px", fontSize: "12px" }}
            >
              Checkout & Pay →
            </button>
          </div>
        )}

        {activeTab === "products" && (
          <div>
            <div className="filter-bar">
              <div>
                <h2 style={{ fontSize: "15px", fontWeight: 800, color: "#fff" }}>Product Catalog & Stock Management</h2>
                <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>SKU control, available inventory, selling and cost prices</p>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => openAdjustModal()}
                  style={{ padding: "8px 14px", borderRadius: "10px", background: "#162035", color: "#fff", border: "1px solid var(--border-subtle)", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                >
                  Adjust Stock
                </button>
                {user.role === "admin" && (
                  <button onClick={openAddProductModal} className="btn-primary" style={{ width: "auto", padding: "8px 16px" }}>
                    + Add Product
                  </button>
                )}
              </div>
            </div>

            <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "18px", overflow: "hidden" }}>
              <table className="table-custom">
                <thead>
                  <tr>
                    <th>SKU</th>
                    <th>Product Name</th>
                    <th>Category</th>
                    <th>Purchase Cost</th>
                    <th>Selling Price</th>
                    <th>Available Stock</th>
                    <th>Reorder Level</th>
                    <th style={{ textAlign: "right" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => {
                    const isLow = p.availableStock <= p.reorderLevel;
                    const isOut = p.availableStock === 0;

                    return (
                      <tr key={p._id}>
                        <td style={{ fontFamily: "var(--font-mono)", fontWeight: 800, color: "var(--accent-cyan)" }}>
                          {p.sku}
                        </td>
                        <td style={{ fontWeight: 800, color: "#fff" }}>{p.name}</td>
                        <td>
                          <span style={{ padding: "3px 8px", borderRadius: "6px", background: "#162035", fontSize: "11px", color: "var(--text-secondary)" }}>
                            {p.category}
                          </span>
                        </td>
                        <td style={{ fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>₹{p.purchasePrice.toFixed(2)}</td>
                        <td style={{ fontFamily: "var(--font-mono)", fontWeight: 800, color: "#fff" }}>₹{p.sellingPrice.toFixed(2)}</td>
                        <td>
                          <span style={{
                            padding: "3px 8px",
                            borderRadius: "20px",
                            fontSize: "11px",
                            fontWeight: 800,
                            background: isOut ? "rgba(244, 63, 94, 0.15)" : isLow ? "rgba(245, 158, 11, 0.15)" : "rgba(16, 185, 129, 0.15)",
                            color: isOut ? "#fb7185" : isLow ? "#fbbf24" : "#34d399"
                          }}>
                            {p.availableStock} units
                          </span>
                        </td>
                        <td style={{ fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>{p.reorderLevel} units</td>
                        <td style={{ textAlign: "right" }}>
                          <div style={{ display: "inline-flex", gap: "6px" }}>
                            <button
                              onClick={() => openAdjustModal(p._id)}
                              style={{ padding: "5px 10px", borderRadius: "8px", background: "#162035", color: "#fff", border: "1px solid var(--border-subtle)", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}
                            >
                              Adjust
                            </button>
                            {user.role === "admin" && (
                              <button
                                onClick={() => openEditProductModal(p)}
                                style={{ padding: "5px 10px", borderRadius: "8px", background: "rgba(6, 182, 212, 0.15)", color: "var(--accent-cyan)", border: "1px solid rgba(6, 182, 212, 0.3)", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}
                              >
                                Edit
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "lowstock" && (
          <div>
            <div className="filter-bar">
              <div>
                <h2 style={{ fontSize: "15px", fontWeight: 800, color: "#fff" }}>
                  Low Stock & Reorder Alert Dashboard
                </h2>
                <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>Products at or below their reorder threshold requiring replenishment</p>
              </div>

              <button onClick={loadLowStock} className="btn-icon" title="Refresh">
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>

            {lowStockLoading ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>Inspecting stock levels...</div>
            ) : lowStockList.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px 0", border: "1px dashed var(--border-subtle)", borderRadius: "16px", color: "#34d399" }}>
                All inventory levels are above their configured reorder thresholds!
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
                {lowStockList.map((prod) => (
                  <div key={prod._id} style={{ background: "var(--bg-surface)", border: "1px solid rgba(245, 158, 11, 0.3)", borderRadius: "18px", padding: "18px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontFamily: "var(--font-mono)", fontSize: "11px", fontWeight: 800, color: "var(--accent-cyan)", background: "rgba(6, 182, 212, 0.12)", padding: "2px 6px", borderRadius: "6px" }}>
                          {prod.sku}
                        </span>
                        <span style={{ fontSize: "10px", fontWeight: 800, padding: "2px 8px", borderRadius: "20px", background: "rgba(245, 158, 11, 0.15)", color: "#fbbf24" }}>
                          Critical Stock
                        </span>
                      </div>

                      <div style={{ fontSize: "14px", fontWeight: 800, color: "#fff", marginTop: "10px" }}>{prod.name}</div>
                      <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{prod.category}</div>

                      <div style={{ background: "#090d16", borderRadius: "10px", padding: "10px", border: "1px solid var(--border-subtle)", marginTop: "12px", display: "flex", flexDirection: "column", gap: "4px", fontSize: "12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "var(--text-muted)" }}>Current Stock:</span>
                          <strong style={{ color: "#fb7185", fontFamily: "var(--font-mono)" }}>{prod.availableStock} units</strong>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span style={{ color: "var(--text-muted)" }}>Reorder Threshold:</span>
                          <span style={{ fontFamily: "var(--font-mono)" }}>{prod.reorderLevel} units</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
                      <button
                        onClick={() => openAdjustModal(prod._id)}
                        style={{ flex: 1, padding: "8px", borderRadius: "10px", background: "#162035", color: "#fff", border: "1px solid var(--border-subtle)", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}
                      >
                        Custom Intake
                      </button>
                      <button
                        onClick={() => handleQuickRestock(prod._id)}
                        style={{ flex: 1, padding: "8px", borderRadius: "10px", background: "var(--accent-gradient)", color: "#000", border: "none", fontSize: "11px", fontWeight: 800, cursor: "pointer" }}
                      >
                        +20 Quick Restock
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "movements" && (
          <div>
            <div className="filter-bar">
              <div>
                <h2 style={{ fontSize: "15px", fontWeight: 800, color: "#fff" }}>Audited Stock Movements Ledger</h2>
                <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>Every delivery, adjustment, sale deduction, and return is permanently recorded</p>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <select
                  value={movementTypeFilter}
                  onChange={(e) => setMovementTypeFilter(e.target.value)}
                  className="form-input"
                  style={{ width: "160px", padding: "8px" }}
                >
                  <option value="All">All Operations</option>
                  <option value="RECEIVED">RECEIVED</option>
                  <option value="SALE">SALE</option>
                  <option value="RETURN">RETURN</option>
                  <option value="ADJUSTMENT_IN">ADJUSTMENT IN (+)</option>
                  <option value="ADJUSTMENT_OUT">ADJUSTMENT OUT (-)</option>
                </select>

                <button onClick={loadMovements} className="btn-icon" title="Refresh">
                  <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>

            <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "18px", overflow: "hidden" }}>
              <table className="table-custom">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Type</th>
                    <th>Product</th>
                    <th>Qty</th>
                    <th>Stock Transition</th>
                    <th>Reason / Reference</th>
                    <th>Performed By</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((m) => (
                    <tr key={m._id}>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-muted)" }}>
                        {new Date(m.createdAt).toLocaleString()}
                      </td>
                      <td>
                        <span style={{ padding: "2px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: 800, background: "#162035", color: "var(--accent-cyan)" }}>
                          {m.type}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 800, color: "#fff" }}>{m.product?.name || "Product"}</div>
                        <div style={{ fontFamily: "var(--font-mono)", fontSize: "10px", color: "var(--text-muted)" }}>{m.product?.sku}</div>
                      </td>
                      <td style={{ fontFamily: "var(--font-mono)", fontWeight: 800, color: "#fff" }}>
                        {m.quantity}
                      </td>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: "11px" }}>
                        <span style={{ color: "var(--text-muted)" }}>{m.previousStock}</span>
                        {" → "}
                        <span style={{ fontWeight: 800, color: "#fff" }}>{m.newStock}</span>
                      </td>
                      <td style={{ fontSize: "11px", color: "var(--text-secondary)" }}>
                        {m.reason || m.referenceId || "Direct action"}
                      </td>
                      <td style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                        {m.performedBy ? m.performedBy.name : "System"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "sales" && (
          <div>
            <div className="filter-bar">
              <div>
                <h2 style={{ fontSize: "15px", fontWeight: 800, color: "#fff" }}>Sales Invoices & Returns</h2>
                <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>Search historical customer transactions, inspect itemized billings, process returns, or export CSV</p>
              </div>

              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <button
                  type="button"
                  disabled={salesLoading}
                  onClick={loadSales}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "10px",
                    background: "#162035",
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
                  <span>{salesLoading ? "Syncing..." : "Sync"}</span>
                </button>

                <button
                  type="button"
                  disabled={csvExporting}
                  onClick={handleDownloadCsv}
                  style={{ padding: "8px 14px", borderRadius: "10px", background: "rgba(6, 182, 212, 0.15)", color: "var(--accent-cyan)", border: "1px solid rgba(6, 182, 212, 0.3)", fontSize: "12px", fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap", display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>{csvExporting ? "Exporting..." : "Download CSV"}</span>
                </button>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center", margin: "14px 0" }}>
              <div style={{ flex: "1 1 240px" }}>
                <input
                  type="text"
                  value={saleSearchInvoice}
                  onChange={(e) => setSaleSearchInvoice(e.target.value)}
                  placeholder="Search invoice number..."
                  className="form-input"
                  style={{ padding: "8px 12px", fontSize: "12px" }}
                />
              </div>

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <select
                  value={saleDateFilter}
                  onChange={(e) => setSaleDateFilter(e.target.value)}
                  className="form-input"
                  style={{ width: "auto", padding: "8px 12px", fontSize: "12px" }}
                >
                  <option value="today">Today</option>
                  <option value="7d">Last 7 Days</option>
                  <option value="30d">Last 30 Days</option>
                  <option value="all">All Time</option>
                </select>

                <select
                  value={salePaymentFilter}
                  onChange={(e) => setSalePaymentFilter(e.target.value)}
                  className="form-input"
                  style={{ width: "auto", padding: "8px 12px", fontSize: "12px" }}
                >
                  <option value="All">All Payments</option>
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="UPI">UPI</option>
                </select>

                <select
                  value={saleStatusFilter}
                  onChange={(e) => setSaleStatusFilter(e.target.value)}
                  className="form-input"
                  style={{ width: "auto", padding: "8px 12px", fontSize: "12px" }}
                >
                  <option value="All">All Statuses</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="RETURNED">Returned</option>
                </select>
              </div>
            </div>

            <div className="stats-grid" style={{ marginBottom: "16px" }}>
              <div className="stat-card">
                <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>Orders Count</div>
                <div className="stat-value" style={{ color: "#fff" }}>
                  {sales.length}
                </div>
              </div>

              <div className="stat-card">
                <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>Settled Revenue</div>
                <div className="stat-value" style={{ color: "var(--accent-cyan)" }}>
                  ₹{sales.filter(s => s.status === 'COMPLETED').reduce((acc, s) => acc + s.totalAmount, 0).toFixed(2)}
                </div>
              </div>

              <div className="stat-card">
                <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>Units Dispatched</div>
                <div className="stat-value" style={{ color: "#34d399" }}>
                  {sales.reduce((acc, s) => acc + s.items.reduce((sum, i) => sum + i.quantity, 0), 0)}
                </div>
              </div>

              <div className="stat-card">
                <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>Returns Recorded</div>
                <div className="stat-value" style={{ color: "#fb7185" }}>
                  {sales.filter(s => s.status === 'RETURNED').length}
                </div>
              </div>
            </div>

            <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "18px", overflow: "hidden" }}>
              {salesLoading && sales.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>Loading sales invoices...</div>
              ) : sales.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>
                  No customer orders found matching the filter criteria.
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table className="table-custom">
                    <thead>
                      <tr>
                        <th>Invoice #</th>
                        <th>Date & Time</th>
                        <th>Cashier</th>
                        <th>Items Summary</th>
                        <th>Subtotal</th>
                        <th>Total</th>
                        <th>Payment</th>
                        <th>Status</th>
                        <th style={{ textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sales.map((s) => (
                        <tr key={s._id}>
                          <td style={{ fontFamily: "var(--font-mono)", fontWeight: 800, color: "var(--accent-cyan)" }}>
                            {s.invoiceNumber}
                          </td>
                          <td style={{ fontSize: "11px", color: "var(--text-muted)", whiteSpace: "nowrap" }}>
                            <div>{new Date(s.createdAt).toLocaleDateString()}</div>
                            <div style={{ fontSize: "10px", color: "var(--text-secondary)" }}>
                              {new Date(s.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </div>
                          </td>
                          <td style={{ fontSize: "11px", color: "#fff", fontWeight: 700 }}>
                            {s.cashier ? s.cashier.name : "System"}
                          </td>
                          <td style={{ fontSize: "11px", color: "var(--text-secondary)", maxWidth: "220px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {s.items.map((i) => `${i.quantity}x ${i.name}`).join(", ")}
                          </td>
                          <td style={{ fontFamily: "var(--font-mono)" }}>₹{s.subtotal.toFixed(2)}</td>
                          <td style={{ fontFamily: "var(--font-mono)", fontWeight: 800, color: "#fff" }}>₹{s.totalAmount.toFixed(2)}</td>
                          <td>
                            <span style={{ padding: "2px 6px", borderRadius: "4px", background: "#162035", fontSize: "10px", fontWeight: 700 }}>
                              {s.paymentMethod}
                            </span>
                          </td>
                          <td>
                            <span style={{
                              padding: "2px 8px",
                              borderRadius: "20px",
                              fontSize: "10px",
                              fontWeight: 800,
                              background: s.status === "COMPLETED" ? "rgba(16, 185, 129, 0.15)" : "rgba(244, 63, 94, 0.15)",
                              color: s.status === "COMPLETED" ? "#34d399" : "#fb7185"
                            }}>
                              {s.status}
                            </span>
                          </td>
                          <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                            <div style={{ display: "inline-flex", gap: "6px" }}>
                              <button
                                type="button"
                                onClick={() => setSelectedSaleDetail(s)}
                                style={{ padding: "5px 10px", borderRadius: "8px", background: "#162035", color: "#fff", border: "1px solid var(--border-subtle)", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}
                              >
                                View
                              </button>
                              <button
                                type="button"
                                onClick={() => setPrintableSale(s)}
                                style={{ padding: "5px 10px", borderRadius: "8px", background: "rgba(6, 182, 212, 0.12)", color: "var(--accent-cyan)", border: "1px solid rgba(6, 182, 212, 0.25)", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}
                              >
                                Print
                              </button>
                              {s.status === "COMPLETED" && (
                                <button
                                  type="button"
                                  onClick={() => openReturnModal(s)}
                                  style={{ padding: "5px 10px", borderRadius: "8px", background: "rgba(245, 158, 11, 0.15)", color: "#fbbf24", border: "1px solid rgba(245, 158, 11, 0.3)", fontSize: "11px", fontWeight: 700, cursor: "pointer" }}
                                >
                                  Return
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "analytics" && (
          <div>
            <div className="filter-bar">
              <div>
                <h2 style={{ fontSize: "15px", fontWeight: 800, color: "#fff" }}>Profitability & COGS Analysis</h2>
                <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>Gross Margin, Cost of Goods Sold, and Best Selling Products</p>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  onClick={loadReports}
                  style={{
                    padding: "8px 14px",
                    borderRadius: "10px",
                    background: "#162035",
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
                  <span>Sync Live</span>
                </button>
                <button
                  disabled={csvExporting}
                  onClick={handleDownloadCsv}
                  className="btn-primary"
                  style={{ width: "auto", padding: "8px 16px" }}
                >
                  Download CSV Report
                </button>
              </div>
            </div>

            {reportLoading || !profitReport ? (
              <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-muted)" }}>Calculating margins...</div>
            ) : (
              <div>
                <div className="stats-grid">
                  <div className="stat-card">
                    <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>Gross Revenue</div>
                    <div className="stat-value" style={{ color: "var(--accent-cyan)" }}>
                      ₹{profitReport.metrics.totalRevenue.toFixed(2)}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>{profitReport.metrics.totalSalesCount} invoices</div>
                  </div>

                  <div className="stat-card">
                    <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>Cost of Goods (COGS)</div>
                    <div className="stat-value" style={{ color: "var(--text-secondary)" }}>
                      ₹{profitReport.metrics.totalCostOfGoodsSold.toFixed(2)}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>Item purchase costs</div>
                  </div>

                  <div className="stat-card">
                    <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>Gross Profit</div>
                    <div className="stat-value" style={{ color: "#34d399" }}>
                      ₹{profitReport.metrics.grossProfit.toFixed(2)}
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>Revenue minus COGS</div>
                  </div>

                  <div className="stat-card">
                    <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", color: "var(--text-muted)" }}>Gross Margin %</div>
                    <div className="stat-value" style={{ color: "#60a5fa" }}>
                      {profitReport.metrics.grossMarginPercent}%
                    </div>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>Profitability margin</div>
                  </div>
                </div>

                {salesReport && salesReport.topSellingProducts && (
                  <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border-subtle)", borderRadius: "18px", padding: "18px", marginTop: "16px" }}>
                    <div style={{ fontSize: "14px", fontWeight: 800, color: "#fff", marginBottom: "12px" }}>Top-Selling Products by Volume</div>
                    <table className="table-custom">
                      <thead>
                        <tr>
                          <th>SKU</th>
                          <th>Product Name</th>
                          <th>Units Sold</th>
                          <th>Total Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {salesReport.topSellingProducts.map((p, idx) => (
                          <tr key={idx}>
                            <td style={{ fontFamily: "var(--font-mono)", fontWeight: 800, color: "var(--accent-cyan)" }}>{p.sku}</td>
                            <td style={{ fontWeight: 800, color: "#fff" }}>{p.name}</td>
                            <td style={{ fontFamily: "var(--font-mono)" }}>{p.totalQuantitySold} units</td>
                            <td style={{ fontFamily: "var(--font-mono)", fontWeight: 800, color: "#34d399" }}>₹{p.totalRevenue.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {productModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-window">
            <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#fff" }}>
              {editingProduct ? "Edit Product" : "Add New Retail Product"}
            </h3>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>
              Configure SKU, category, purchase/selling price, and stock levels
            </p>

            {prodFormError && (
              <div style={{ background: "rgba(244, 63, 94, 0.12)", border: "1px solid rgba(244, 63, 94, 0.3)", color: "#fb7185", padding: "10px", borderRadius: "10px", fontSize: "12px", marginTop: "12px" }}>
                {prodFormError}
              </div>
            )}

            <form onSubmit={handleSaveProduct} style={{ marginTop: "14px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div className="form-group">
                  <label className="form-label">SKU</label>
                  <input
                    type="text"
                    required
                    value={prodFormSku}
                    onChange={(e) => setProdFormSku(e.target.value.toUpperCase())}
                    placeholder="e.g. ELEC-1001"
                    className="form-input"
                    style={{ fontFamily: "var(--font-mono)" }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Category</label>
                  <input
                    type="text"
                    required
                    value={prodFormCategory}
                    onChange={(e) => setProdFormCategory(e.target.value)}
                    placeholder="e.g. Electronics"
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Product Name</label>
                <input
                  type="text"
                  required
                  value={prodFormName}
                  onChange={(e) => setProdFormName(e.target.value)}
                  placeholder="e.g. Wireless Noise Cancelling Headphones"
                  className="form-input"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div className="form-group">
                  <label className="form-label">Purchase Cost (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={prodFormPurchasePrice}
                    onChange={(e) => setProdFormPurchasePrice(e.target.value)}
                    placeholder="450"
                    className="form-input"
                    style={{ fontFamily: "var(--font-mono)" }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Selling Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={prodFormSellingPrice}
                    onChange={(e) => setProdFormSellingPrice(e.target.value)}
                    placeholder="799"
                    className="form-input"
                    style={{ fontFamily: "var(--font-mono)" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div className="form-group">
                  <label className="form-label">Initial Stock</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={prodFormStock}
                    onChange={(e) => setProdFormStock(e.target.value)}
                    className="form-input"
                    style={{ fontFamily: "var(--font-mono)" }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Reorder Level</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={prodFormReorder}
                    onChange={(e) => setProdFormReorder(e.target.value)}
                    className="form-input"
                    style={{ fontFamily: "var(--font-mono)" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                <button
                  type="button"
                  onClick={() => setProductModalOpen(false)}
                  style={{ flex: 1, padding: "10px", borderRadius: "10px", background: "transparent", border: "1px solid var(--border-subtle)", color: "#fff", fontWeight: 700, fontSize: "12px", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary" style={{ flex: 1, padding: "10px" }}>
                  Save Product
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {adjustModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-window">
            <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#fff" }}>Stock Adjustment & Receipt</h3>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>
              All inventory movements are permanently audited in the movement ledger
            </p>

            {adjustError && (
              <div style={{ background: "rgba(244, 63, 94, 0.12)", border: "1px solid rgba(244, 63, 94, 0.3)", color: "#fb7185", padding: "10px", borderRadius: "10px", fontSize: "12px", marginTop: "12px" }}>
                {adjustError}
              </div>
            )}

            <form onSubmit={handleAdjustInventory} style={{ marginTop: "14px" }}>
              <div className="form-group">
                <label className="form-label">Select Product</label>
                <select
                  value={adjustProductId}
                  onChange={(e) => setAdjustProductId(e.target.value)}
                  className="form-input"
                >
                  {products.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.sku} - {p.name} (Available: {p.availableStock})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div className="form-group">
                  <label className="form-label">Operation</label>
                  <select
                    value={adjustType}
                    onChange={(e) => setAdjustType(e.target.value)}
                    className="form-input"
                  >
                    <option value="RECEIVED">Stock Received (+)</option>
                    <option value="ADJUSTMENT_IN">Adjustment In (+)</option>
                    <option value="ADJUSTMENT_OUT">Adjustment Out (-)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Quantity</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={adjustQuantity}
                    onChange={(e) => setAdjustQuantity(e.target.value)}
                    placeholder="10"
                    className="form-input"
                    style={{ fontFamily: "var(--font-mono)" }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Reason / Reference PO</label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="e.g. Vendor shipment PO-4412"
                  className="form-input"
                />
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                <button
                  type="button"
                  onClick={() => setAdjustModalOpen(false)}
                  style={{ flex: 1, padding: "10px", borderRadius: "10px", background: "transparent", border: "1px solid var(--border-subtle)", color: "#fff", fontWeight: 700, fontSize: "12px", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button type="submit" disabled={adjustSubmitting} className="btn-primary" style={{ flex: 1, padding: "10px" }}>
                  {adjustSubmitting ? "Updating..." : "Commit Adjustment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {returnModalOpen && returningSale && (
        <div className="modal-backdrop">
          <div className="modal-window">
            <h3 style={{ fontSize: "16px", fontWeight: 800, color: "#fff" }}>Process Customer Return</h3>
            <p style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>
              Invoice #{returningSale.invoiceNumber} • This will restore item quantities back into active stock
            </p>

            <form onSubmit={handleProcessReturn} style={{ marginTop: "14px" }}>
              <div className="form-group">
                <label className="form-label">Return Reason</label>
                <textarea
                  rows="3"
                  required
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  placeholder="e.g. Unopened item returned with original receipt..."
                  className="form-input"
                />
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
                <button
                  type="button"
                  onClick={() => setReturnModalOpen(false)}
                  style={{ flex: 1, padding: "10px", borderRadius: "10px", background: "transparent", border: "1px solid var(--border-subtle)", color: "#fff", fontWeight: 700, fontSize: "12px", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button type="submit" disabled={returnSubmitting} className="btn-primary" style={{ flex: 1, padding: "10px" }}>
                  {returnSubmitting ? "Restoring..." : "Restore Stock & Complete Return"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedSaleDetail && (
        <div className="modal-backdrop">
          <div className="modal-window" style={{ maxWidth: "560px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "14px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <h3 style={{ fontSize: "18px", fontWeight: 800, color: "#fff", fontFamily: "var(--font-mono)" }}>
                    {selectedSaleDetail.invoiceNumber}
                  </h3>
                  <span style={{
                    padding: "2px 8px",
                    borderRadius: "20px",
                    fontSize: "10px",
                    fontWeight: 800,
                    background: selectedSaleDetail.status === "COMPLETED" ? "rgba(16, 185, 129, 0.15)" : "rgba(244, 63, 94, 0.15)",
                    color: selectedSaleDetail.status === "COMPLETED" ? "#34d399" : "#fb7185"
                  }}>
                    {selectedSaleDetail.status}
                  </span>
                </div>
                <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "4px" }}>
                  Transacted on {new Date(selectedSaleDetail.createdAt).toLocaleString()}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedSaleDetail(null)}
                className="btn-icon"
                style={{ width: "32px", height: "32px" }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", margin: "16px 0", background: "#090d16", padding: "12px", borderRadius: "12px", border: "1px solid var(--border-subtle)", fontSize: "12px" }}>
              <div>
                <div style={{ color: "var(--text-muted)", fontSize: "10px", textTransform: "uppercase", fontWeight: 700 }}>Cashier</div>
                <div style={{ fontWeight: 800, color: "#fff", marginTop: "2px" }}>
                  {selectedSaleDetail.cashier ? selectedSaleDetail.cashier.name : "System Terminal"}
                </div>
              </div>
              <div>
                <div style={{ color: "var(--text-muted)", fontSize: "10px", textTransform: "uppercase", fontWeight: 700 }}>Payment Method</div>
                <div style={{ fontWeight: 800, color: "var(--accent-cyan)", marginTop: "2px" }}>
                  {selectedSaleDetail.paymentMethod}
                </div>
              </div>
              <div>
                <div style={{ color: "var(--text-muted)", fontSize: "10px", textTransform: "uppercase", fontWeight: 700 }}>Items Count</div>
                <div style={{ fontWeight: 800, color: "#fff", marginTop: "2px" }}>
                  {selectedSaleDetail.items.reduce((sum, i) => sum + i.quantity, 0)} units
                </div>
              </div>
              <div>
                <div style={{ color: "var(--text-muted)", fontSize: "10px", textTransform: "uppercase", fontWeight: 700 }}>Invoice ID</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: "11px", color: "var(--text-secondary)", marginTop: "2px" }}>
                  {selectedSaleDetail._id}
                </div>
              </div>
            </div>

            <div style={{ fontSize: "12px", fontWeight: 800, color: "#fff", marginBottom: "8px" }}>Itemized Products</div>
            <div style={{ background: "#090d16", borderRadius: "12px", border: "1px solid var(--border-subtle)", overflow: "hidden" }}>
              <table className="table-custom" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>Product & SKU</th>
                    <th style={{ textAlign: "center" }}>Qty</th>
                    <th style={{ textAlign: "right" }}>Unit Price</th>
                    <th style={{ textAlign: "right" }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSaleDetail.items.map((it, idx) => (
                    <tr key={idx}>
                      <td>
                        <div style={{ fontWeight: 700, color: "#fff" }}>{it.name}</div>
                        <div style={{ fontSize: "10px", fontFamily: "var(--font-mono)", color: "var(--text-muted)" }}>{it.sku}</div>
                      </td>
                      <td style={{ textAlign: "center", fontFamily: "var(--font-mono)" }}>{it.quantity}</td>
                      <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", color: "var(--text-secondary)" }}>
                        ₹{it.unitPrice.toFixed(2)}
                      </td>
                      <td style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontWeight: 800, color: "#fff" }}>
                        ₹{it.total.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ margin: "16px 0", padding: "12px 16px", background: "#090d16", borderRadius: "12px", border: "1px solid var(--border-subtle)", display: "flex", flexDirection: "column", gap: "6px", fontSize: "12px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-secondary)" }}>Subtotal</span>
                <span style={{ fontFamily: "var(--font-mono)" }}>₹{selectedSaleDetail.subtotal.toFixed(2)}</span>
              </div>
              {selectedSaleDetail.discountAmount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--text-secondary)" }}>Discount {selectedSaleDetail.discountRate ? `(${selectedSaleDetail.discountRate}%)` : ""}</span>
                  <span style={{ fontFamily: "var(--font-mono)", color: "#fb7185" }}>-₹{selectedSaleDetail.discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "var(--text-secondary)" }}>Tax ({selectedSaleDetail.taxRate || 5}%)</span>
                <span style={{ fontFamily: "var(--font-mono)" }}>₹{selectedSaleDetail.taxAmount.toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14px", fontWeight: 800, color: "#fff", paddingTop: "6px", borderTop: "1px solid var(--border-subtle)" }}>
                <span>Final Total Paid</span>
                <span style={{ fontFamily: "var(--font-mono)", color: "var(--accent-cyan)" }}>₹{selectedSaleDetail.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "18px" }}>
              <button
                type="button"
                onClick={() => setSelectedSaleDetail(null)}
                style={{ flex: 1, padding: "10px", borderRadius: "10px", background: "transparent", border: "1px solid var(--border-subtle)", color: "#fff", fontWeight: 700, fontSize: "12px", cursor: "pointer" }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setPrintableSale(selectedSaleDetail);
                }}
                className="btn-primary"
                style={{ flex: 1, padding: "10px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
              >
                <span>Print Invoice Slip</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {printableSale && (
        <div className="modal-backdrop">
          <div className="receipt-modal">
            <div style={{ textAlign: "center", marginBottom: "8px" }}>
              <div style={{ fontSize: "16px", fontWeight: 900 }}>RETAILCORE OUTLET</div>
              <div style={{ fontSize: "10px", color: "#4b5563" }}>Retail Inventory & POS</div>
              <div style={{ fontSize: "10px", color: "#6b7280" }}>200 Commerce Way, Tech Park</div>
            </div>

            <div className="receipt-divider"></div>

            <div style={{ fontSize: "11px", lineHeight: 1.4 }}>
              <div>Invoice: <strong>{printableSale.invoiceNumber}</strong></div>
              <div>Date: {new Date(printableSale.createdAt).toLocaleString()}</div>
              <div>Status: {printableSale.status}</div>
              <div>Payment: {printableSale.paymentMethod}</div>
            </div>

            <div className="receipt-divider"></div>

            <div style={{ fontSize: "11px", display: "flex", flexDirection: "column", gap: "4px" }}>
              {printableSale.items.map((it, idx) => (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>{it.quantity}x {it.name} ({it.sku})</span>
                  <span>₹{it.total.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="receipt-divider"></div>

            <div style={{ fontSize: "11px", display: "flex", flexDirection: "column", gap: "3px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Subtotal:</span>
                <span>₹{printableSale.subtotal.toFixed(2)}</span>
              </div>
              {printableSale.discountAmount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Discount {printableSale.discountRate ? `(${printableSale.discountRate}%)` : ""}:</span>
                  <span>-₹{printableSale.discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Tax (5%):</span>
                <span>₹{printableSale.taxAmount.toFixed(2)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontWeight: 900, marginTop: "4px", paddingTop: "4px", borderTop: "1px dashed #71717a" }}>
                <span>TOTAL:</span>
                <span>₹{printableSale.totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="receipt-divider"></div>

            <div style={{ textAlign: "center", fontSize: "10px", color: "#4b5563" }}>
              Thank you for shopping with us!
            </div>

            <div className="no-print" style={{ display: "flex", gap: "8px", marginTop: "16px" }}>
              <button
                type="button"
                onClick={() => setPrintableSale(null)}
                style={{ flex: 1, padding: "8px", borderRadius: "8px", background: "#e4e4e7", color: "#18181b", border: "none", fontWeight: 700, fontSize: "11px", cursor: "pointer" }}
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                style={{ flex: 1, padding: "8px", borderRadius: "8px", background: "#000", color: "#fff", border: "none", fontWeight: 800, fontSize: "11px", cursor: "pointer" }}
              >
                Print Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
