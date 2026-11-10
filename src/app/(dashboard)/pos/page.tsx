"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  ShoppingCart,
  Search,
  Barcode,
  Trash2,
  Plus,
  Minus,
  PauseCircle,
  PlayCircle,
  Printer,
  CheckCircle2,
  AlertCircle,
  UserCheck,
  CreditCard,
  Banknote,
  Smartphone,
  ShieldCheck,
  RefreshCw,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { POSCartItem, POSHeldSale } from "@/types";

export default function POSTerminalPage() {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const barcodeInputRef = useRef<HTMLInputElement>(null);

  // Search & Catalog state
  const [searchQuery, setSearchQuery] = useState("");
  const [barcodeQuery, setBarcodeQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Cart state
  const [cart, setCart] = useState<POSCartItem[]>([]);
  const [overallDiscount, setOverallDiscount] = useState<number>(0);
  const [taxRate, setTaxRate] = useState<number>(0);

  // Customer state
  const [customers, setCustomers] = useState<any[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState<
    "CASH" | "CARD" | "BANK_TRANSFER" | "EASYPAISA_JAZZCASH" | "CREDIT"
  >("CASH");
  const [receivedAmount, setReceivedAmount] = useState<string>("");
  const [saleNotes, setSaleNotes] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Held Carts
  const [heldSales, setHeldSales] = useState<POSHeldSale[]>([]);

  // Completed sale receipt modal
  const [completedSale, setCompletedSale] = useState<any>(null);

  // Fetch initial customers
  const fetchCustomers = async (q: string = "") => {
    try {
      const res = await fetch(`/api/pos/customers?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (data.customers) setCustomers(data.customers);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchCustomers();
    // Default focus to search bar
    searchInputRef.current?.focus();
  }, []);

  // Search medicines
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/pos/search?q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        if (data.results) setSearchResults(data.results);
      } catch (e) {
        console.error(e);
      } finally {
        setIsSearching(false);
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Keyboard shortcut listener (F2 to focus search, F4 to pay, F8 to hold)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "F2") {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "F4") {
        e.preventDefault();
        if (cart.length > 0) handleCheckout();
      } else if (e.key === "F8") {
        e.preventDefault();
        if (cart.length > 0) handleHoldSale();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  });

  // Handle barcode scanner submission
  const handleBarcodeScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeQuery.trim()) return;

    try {
      const res = await fetch(`/api/pos/search?barcode=${encodeURIComponent(barcodeQuery.trim())}`);
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        addToCart(data.results[0]);
        setBarcodeQuery("");
      } else {
        setErrorMessage(`No medicine found for barcode: ${barcodeQuery}`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const addToCart = (med: any) => {
    setErrorMessage("");
    if (med.availableStock <= 0) {
      setErrorMessage(`Cannot add "${med.name}": Out of stock.`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.medicineId === med.id);
      if (existing) {
        if (existing.quantity >= med.availableStock) {
          setErrorMessage(`Cannot add more "${med.name}": Insufficient batch stock.`);
          return prev;
        }
        return prev.map((item) =>
          item.medicineId === med.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          medicineId: med.id,
          name: med.name,
          genericName: med.genericName,
          dosageForm: med.dosageForm,
          strength: med.strength,
          barcode: med.barcode,
          unitPrice: med.unitPrice,
          tradePrice: med.tradePrice,
          purchaseCost: med.purchaseCost,
          quantity: 1,
          availableStock: med.availableStock,
          lineDiscount: 0,
          batchNumber: med.batchNumber,
          expiryDate: med.expiryDate,
          prescriptionRequired: med.prescriptionRequired,
        },
      ];
    });
  };

  const updateQuantity = (medicineId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.medicineId === medicineId) {
            const newQty = item.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > item.availableStock) {
              setErrorMessage(`Max available stock for "${item.name}" is ${item.availableStock}`);
              return item;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter(Boolean) as POSCartItem[]
    );
  };

  const removeFromCart = (medicineId: string) => {
    setCart((prev) => prev.filter((item) => item.medicineId !== medicineId));
  };

  // Cart Calculations
  const subtotal = cart.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity - item.lineDiscount,
    0
  );
  const taxAmount = (subtotal - overallDiscount) * (taxRate / 100);
  const totalAmount = Math.max(0, subtotal - overallDiscount + (taxAmount > 0 ? taxAmount : 0));
  const numericReceived = parseFloat(receivedAmount) || 0;
  const changeAmount = Math.max(0, numericReceived - totalAmount);

  // Hold Sale
  const handleHoldSale = () => {
    if (cart.length === 0) return;
    const customer = customers.find((c) => c.id === selectedCustomerId);
    const newHold: POSHeldSale = {
      id: `HOLD-${Date.now().toString().slice(-4)}`,
      title: customer ? `Hold for ${customer.name}` : `Hold #${heldSales.length + 1}`,
      timestamp: new Date().toLocaleTimeString(),
      items: [...cart],
      customerName: customer?.name,
    };
    setHeldSales((prev) => [...prev, newHold]);
    setCart([]);
    setSelectedCustomerId("");
    setOverallDiscount(0);
  };

  const resumeSale = (held: POSHeldSale) => {
    setCart(held.items);
    setHeldSales((prev) => prev.filter((h) => h.id !== held.id));
  };

  // Checkout Execution
  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsProcessing(true);
    setErrorMessage("");

    try {
      const payload = {
        customerId: selectedCustomerId || null,
        items: cart.map((i) => ({
          medicineId: i.medicineId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          lineDiscount: i.lineDiscount,
        })),
        discountAmount: overallDiscount,
        taxAmount: taxAmount,
        paymentMethod: paymentMethod,
        paidAmount:
          paymentMethod === "CREDIT"
            ? 0
            : numericReceived > 0
            ? numericReceived
            : totalAmount,
        notes: saleNotes || undefined,
      };

      const res = await fetch("/api/pos/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Checkout failed");
        setIsProcessing(false);
        return;
      }

      setCompletedSale(data.sale);
      setCart([]);
      setReceivedAmount("");
      setOverallDiscount(0);
      setSaleNotes("");
    } catch {
      setErrorMessage("Network error during checkout.");
    } finally {
      setIsProcessing(false);
    }
  };

  const printReceipt = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      {/* Top Shortcuts Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card border border-border rounded-xl p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShoppingCart className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">POS Dispensary Terminal</h2>
            <p className="text-[11px] text-muted-foreground">
              Hotkeys: <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">F2</kbd> Search • <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">F4</kbd> Pay • <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px]">F8</kbd> Hold Cart
            </p>
          </div>
        </div>

        {heldSales.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-amber-400 font-medium flex items-center gap-1">
              <PauseCircle className="h-4 w-4" />
              {heldSales.length} Held:
            </span>
            {heldSales.map((h) => (
              <Button
                key={h.id}
                size="sm"
                variant="outline"
                onClick={() => resumeSale(h)}
                className="h-7 text-xs border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
              >
                <PlayCircle className="h-3.5 w-3.5 mr-1" />
                {h.title}
              </Button>
            ))}
          </div>
        )}
      </div>

      {errorMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMessage}</span>
          <button onClick={() => setErrorMessage("")} className="ml-auto text-red-400 hover:text-red-300">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Main Grid: Left Search & Catalog | Right Cart & Checkout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Side: Product Search & Barcode Scanner (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Dual Input Search: Barcode + Text Search */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <form onSubmit={handleBarcodeScan} className="relative">
              <Input
                ref={barcodeInputRef}
                placeholder="Scan Barcode (Auto-Add)..."
                value={barcodeQuery}
                onChange={(e) => setBarcodeQuery(e.target.value)}
                icon={<Barcode className="h-4 w-4 text-emerald-400" />}
                className="border-emerald-500/30 focus-visible:ring-emerald-500"
              />
            </form>

            <div className="relative">
              <Input
                ref={searchInputRef}
                placeholder="Search Medicine (Brand / Generic)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={<Search className="h-4 w-4 text-indigo-400" />}
              />
            </div>
          </div>

          {/* Search Results Grid */}
          <Card className="min-h-[460px] p-4">
            {isSearching ? (
              <div className="py-24 text-center text-xs text-muted-foreground">
                Searching available formulary...
              </div>
            ) : searchResults.length === 0 ? (
              <div className="py-24 text-center space-y-2">
                <Search className="h-8 w-8 text-muted-foreground/40 mx-auto" />
                <p className="text-xs text-muted-foreground">
                  {searchQuery
                    ? "No matching medicines found in catalog."
                    : "Type a medicine name, generic formula, or scan a barcode to begin dispensing."}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-border/60 max-h-[520px] overflow-y-auto -mx-4 -my-4">
                {searchResults.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => addToCart(item)}
                    className="flex items-center justify-between p-3.5 px-4 hover:bg-indigo-500/5 cursor-pointer transition-colors group"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-foreground group-hover:text-indigo-400">
                          {item.name}
                        </span>
                        {item.prescriptionRequired && (
                          <Badge variant="destructive" className="text-[9px] py-0 px-1">
                            Rx
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {item.genericName} • <span className="text-slate-400">{item.strength} {item.dosageForm}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="font-mono text-xs font-bold text-emerald-400">
                          {formatCurrency(item.unitPrice)}
                        </div>
                        <div
                          className={`text-[10px] font-mono ${
                            item.availableStock <= 15
                              ? "text-amber-400 font-bold"
                              : "text-muted-foreground"
                          }`}
                        >
                          {item.availableStock} in stock
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 text-xs px-2.5 text-indigo-400 border-indigo-500/30 group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-600"
                      >
                        + Add
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Side: Cart, Patient Selection & Totals (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="flex flex-col h-full border-border">
            {/* Customer Picker */}
            <div className="p-3.5 border-b border-border bg-muted/20 flex items-center justify-between gap-2">
              <div className="flex-1">
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="flex h-9 w-full rounded-lg border border-input bg-card px-2.5 text-xs text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Walk-in Patient (No Credit)</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.phone}) - Bal: Rs.{Number(c.balance).toFixed(0)}
                    </option>
                  ))}
                </select>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddCustomer(true)}
                className="h-9 px-2 text-xs"
                title="Register New Customer"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 max-h-[300px]">
              {cart.length === 0 ? (
                <div className="py-16 text-center text-xs text-muted-foreground space-y-1">
                  <ShoppingCart className="h-7 w-7 text-muted-foreground/30 mx-auto" />
                  <p>Cart is currently empty</p>
                  <p className="text-[10px]">Add products from the catalog to dispense</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.medicineId}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-border/80 bg-card/60"
                  >
                    <div className="space-y-0.5 flex-1 pr-2">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-xs text-foreground">
                          {item.name}
                        </span>
                        {item.prescriptionRequired && (
                          <Badge variant="destructive" className="text-[9px] py-0 px-1">
                            Rx
                          </Badge>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        {item.strength} • FEFO: {item.batchNumber ? `Batch ${item.batchNumber}` : "Auto"}
                      </p>
                      <p className="font-mono text-xs font-bold text-indigo-400">
                        {formatCurrency(item.unitPrice)} × {item.quantity} = {formatCurrency(item.unitPrice * item.quantity)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => updateQuantity(item.medicineId, -1)}
                        className="h-6 w-6 rounded flex items-center justify-center border border-border text-foreground hover:bg-muted"
                      >
                        <Minus className="h-3 w-3" />
                      </button>
                      <span className="font-mono text-xs font-bold w-6 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.medicineId, 1)}
                        className="h-6 w-6 rounded flex items-center justify-center border border-border text-foreground hover:bg-muted"
                      >
                        <Plus className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => removeFromCart(item.medicineId)}
                        className="h-6 w-6 rounded flex items-center justify-center text-muted-foreground hover:text-rose-400 ml-1"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Calculations & Payment Controls */}
            <div className="p-3.5 border-t border-border bg-muted/10 space-y-3">
              {/* Discounts & Tax */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[11px] text-muted-foreground block mb-0.5">
                    Discount (PKR)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={overallDiscount || ""}
                    onChange={(e) => setOverallDiscount(parseFloat(e.target.value) || 0)}
                    className="h-8 text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="text-[11px] text-muted-foreground block mb-0.5">
                    Sales Tax (%)
                  </label>
                  <Input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={taxRate || ""}
                    onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>

              {/* Payment Methods */}
              <div>
                <label className="text-[11px] text-muted-foreground block mb-1">
                  Payment Method
                </label>
                <div className="grid grid-cols-3 gap-1.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("CASH")}
                    className={`py-1.5 px-2 rounded-lg border flex items-center justify-center gap-1 transition ${
                      paymentMethod === "CASH"
                        ? "border-emerald-500 bg-emerald-500/10 text-emerald-300 font-semibold"
                        : "border-border bg-card text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <Banknote className="h-3.5 w-3.5" /> Cash
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("CARD")}
                    className={`py-1.5 px-2 rounded-lg border flex items-center justify-center gap-1 transition ${
                      paymentMethod === "CARD"
                        ? "border-indigo-500 bg-indigo-500/10 text-indigo-300 font-semibold"
                        : "border-border bg-card text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <CreditCard className="h-3.5 w-3.5" /> Card
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("EASYPAISA_JAZZCASH")}
                    className={`py-1.5 px-2 rounded-lg border flex items-center justify-center gap-1 transition ${
                      paymentMethod === "EASYPAISA_JAZZCASH"
                        ? "border-amber-500 bg-amber-500/10 text-amber-300 font-semibold"
                        : "border-border bg-card text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <Smartphone className="h-3.5 w-3.5" /> Wallet
                  </button>
                </div>
              </div>

              {/* Cash Received & Change */}
              {paymentMethod === "CASH" && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[11px] text-muted-foreground block mb-0.5">
                      Cash Received (PKR)
                    </label>
                    <Input
                      type="number"
                      placeholder={totalAmount.toString()}
                      value={receivedAmount}
                      onChange={(e) => setReceivedAmount(e.target.value)}
                      className="h-8 text-xs font-mono font-semibold"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-muted-foreground block mb-0.5">
                      Change Due (PKR)
                    </label>
                    <div className="h-8 px-2.5 rounded-lg border border-border bg-card flex items-center font-mono font-bold text-emerald-400 text-xs">
                      {formatCurrency(changeAmount)}
                    </div>
                  </div>
                </div>
              )}

              {/* Total Summary */}
              <div className="pt-2 border-t border-border/80 flex items-center justify-between">
                <div>
                  <span className="text-xs text-muted-foreground">Net Payable:</span>
                  <div className="font-mono text-2xl font-black text-foreground">
                    {formatCurrency(totalAmount)}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleHoldSale}
                    disabled={cart.length === 0}
                    className="text-xs text-amber-400 border-amber-500/30 hover:bg-amber-500/10"
                  >
                    <PauseCircle className="h-3.5 w-3.5 mr-1" />
                    Hold
                  </Button>

                  <Button
                    size="sm"
                    onClick={handleCheckout}
                    disabled={cart.length === 0 || isProcessing}
                    isLoading={isProcessing}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 text-xs shadow-md shadow-emerald-600/20"
                  >
                    Checkout (F4)
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Completed Sale Receipt Modal (Thermal 80mm Print Layout) */}
      {completedSale && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-2xl border border-border bg-[#111827] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <span className="text-sm font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                Sale Recorded Successfully
              </span>
              <button
                onClick={() => setCompletedSale(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Thermal Receipt Preview Area */}
            <div id="printable-receipt" className="p-3 bg-white text-black font-mono text-[11px] rounded space-y-2 border">
              <div className="text-center space-y-0.5 pb-2 border-b border-dashed border-gray-400">
                <h4 className="font-bold text-sm tracking-tight">
                  {completedSale.pharmacy?.name || "SUFI PHARMACY & WELLNESS"}
                </h4>
                <p className="text-[10px]">{completedSale.pharmacy?.address}, {completedSale.pharmacy?.city}</p>
                <p className="text-[10px]">DSL No: {completedSale.pharmacy?.dslNumber || "DSL-LHR-2024-9812"}</p>
                <p className="text-[10px]">NTN: {completedSale.pharmacy?.ntnNumber || "4329012-7"}</p>
              </div>

              <div className="flex justify-between text-[10px] pb-1 border-b border-dashed border-gray-400">
                <span>Invoice: {completedSale.invoiceNumber}</span>
                <span>{formatDate(completedSale.createdAt, true)}</span>
              </div>

              {completedSale.customer && (
                <div className="text-[10px] pb-1 border-b border-dashed border-gray-400">
                  Patient: {completedSale.customer.name} ({completedSale.customer.phone})
                </div>
              )}

              {/* Items List */}
              <div className="space-y-1 py-1">
                {completedSale.items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between">
                    <div>
                      <p className="font-bold">{item.medicine?.name}</p>
                      <p className="text-[9px] text-gray-600">
                        {item.quantity} × Rs.{Number(item.unitPrice).toFixed(2)}
                      </p>
                    </div>
                    <span className="font-bold">Rs.{Number(item.totalPrice).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="pt-2 border-t border-dashed border-gray-400 space-y-0.5 text-right font-bold text-xs">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>Rs.{Number(completedSale.subtotal).toFixed(2)}</span>
                </div>
                {Number(completedSale.discountAmount) > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Discount:</span>
                    <span>-Rs.{Number(completedSale.discountAmount).toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm pt-1 border-t border-black">
                  <span>TOTAL PAID:</span>
                  <span>Rs.{Number(completedSale.totalAmount).toFixed(2)}</span>
                </div>
              </div>

              <div className="text-center text-[9px] pt-2 border-t border-dashed border-gray-400">
                <p>Thank you for choosing Sufi Pharmacy.</p>
                <p>Medicines once sold cannot be returned without receipt.</p>
                <p className="font-bold mt-1">Get Well Soon!</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCompletedSale(null)}
              >
                Close
              </Button>
              <Button
                size="sm"
                onClick={printReceipt}
                className="bg-indigo-600 hover:bg-indigo-500 text-white gap-1.5"
              >
                <Printer className="h-4 w-4" />
                Print Thermal Receipt
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Quick Add Customer */}
      {showAddCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-2xl border border-border bg-[#111827] p-5 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-foreground">Register New Patient</h3>
            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Patient Name *</label>
                <Input
                  placeholder="e.g. Muhammad Aslam"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Phone Number *</label>
                <Input
                  placeholder="03001234567"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setShowAddCustomer(false)}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="bg-indigo-600 hover:bg-indigo-500 text-white"
                  onClick={async () => {
                    if (!newCustName || !newCustPhone) return;
                    const res = await fetch("/api/pos/customers", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ name: newCustName, phone: newCustPhone }),
                    });
                    const d = await res.json();
                    if (d.customer) {
                      setCustomers((prev) => [d.customer, ...prev]);
                      setSelectedCustomerId(d.customer.id);
                      setShowAddCustomer(false);
                      setNewCustName("");
                      setNewCustPhone("");
                    }
                  }}
                >
                  Save Patient
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
