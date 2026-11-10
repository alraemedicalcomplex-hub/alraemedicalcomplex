"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Building2,
  Printer,
  ShieldCheck,
  Save,
  CheckCircle2,
  AlertCircle,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function SettingsPage() {
  const [name, setName] = useState("");
  const [legalName, setLegalName] = useState("");
  const [dslNumber, setDslNumber] = useState("");
  const [ntnNumber, setNtnNumber] = useState("");
  const [strnNumber, setStrnNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Lahore");
  const [lowStockThreshold, setLowStockThreshold] = useState("15");
  const [expiryAlertDays, setExpiryAlertDays] = useState("90");
  const [thermalPrinterWidth, setThermalPrinterWidth] = useState("80mm");
  const [receiptFooterMessage, setReceiptFooterMessage] = useState("");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/settings");
        const data = await res.json();
        if (data.pharmacy) {
          const p = data.pharmacy;
          setName(p.name || "");
          setLegalName(p.legalName || "");
          setDslNumber(p.dslNumber || "");
          setNtnNumber(p.ntnNumber || "");
          setStrnNumber(p.strnNumber || "");
          setPhone(p.phone || "");
          setEmail(p.email || "");
          setAddress(p.address || "");
          setCity(p.city || "Lahore");

          if (p.settings) {
            const s = p.settings;
            setLowStockThreshold(s.lowStockThreshold?.toString() || "15");
            setExpiryAlertDays(s.expiryAlertDays?.toString() || "90");
            setThermalPrinterWidth(s.thermalPrinterWidth || "80mm");
            setReceiptFooterMessage(s.receiptFooterMessage || "");
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          legalName,
          dslNumber,
          ntnNumber,
          strnNumber,
          phone,
          email,
          address,
          city,
          lowStockThreshold: parseInt(lowStockThreshold, 10),
          expiryAlertDays: parseInt(expiryAlertDays, 10),
          thermalPrinterWidth,
          receiptFooterMessage,
        }),
      });

      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Settings className="h-6 w-6 text-indigo-500" />
          Pharmacy & System Configuration
        </h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Configure pharmacy license, tax registration, Pakistan regulatory thresholds, and POS printer format
        </p>
      </div>

      {saveSuccess && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-400">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>Application and pharmacy settings updated successfully!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Pharmacy Registration Info */}
        <Card>
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-indigo-400" />
              Pharmacy Legal Entity & DRAP License
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Pharmacy Trading Name *</label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Legal Company Name</label>
                <Input value={legalName} onChange={(e) => setLegalName(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Drug Sale License (DSL) No *</label>
                <Input value={dslNumber} onChange={(e) => setDslNumber(e.target.value)} placeholder="DSL-LHR-2024-..." required />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">NTN Number</label>
                <Input value={ntnNumber} onChange={(e) => setNtnNumber(e.target.value)} placeholder="4329012-7" />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">STRN Number</label>
                <Input value={strnNumber} onChange={(e) => setStrnNumber(e.target.value)} placeholder="3277876123456" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Official Phone *</label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} required />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Email Address</label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">City / District *</label>
                <Input value={city} onChange={(e) => setCity(e.target.value)} required />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Physical Store Address *</label>
              <Input value={address} onChange={(e) => setAddress(e.target.value)} required />
            </div>
          </CardContent>
        </Card>

        {/* Operating & Alert Thresholds */}
        <Card>
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              Inventory & Regulatory Thresholds
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Low Stock Alert Trigger (Units)</label>
                <Input
                  type="number"
                  value={lowStockThreshold}
                  onChange={(e) => setLowStockThreshold(e.target.value)}
                  min="1"
                />
                <p className="text-[10px] text-muted-foreground">Batches at or below this count will flag low-stock warnings.</p>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Expiry Lead Warning (Days)</label>
                <Input
                  type="number"
                  value={expiryAlertDays}
                  onChange={(e) => setExpiryAlertDays(e.target.value)}
                  min="30"
                />
                <p className="text-[10px] text-muted-foreground">Standard DRAP recommendation is 90 days lead time for FEFO prioritizing.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Thermal Receipt Settings */}
        <Card>
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Printer className="h-4 w-4 text-amber-400" />
              POS Thermal Receipt Layout
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Printer Roll Width</label>
                <select
                  value={thermalPrinterWidth}
                  onChange={(e) => setThermalPrinterWidth(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="80mm">Standard 80mm Thermal Paper</option>
                  <option value="58mm">Compact 58mm Thermal Paper</option>
                  <option value="A4">A4 Full Page Laser Invoice</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Receipt Footer Notice</label>
                <Input
                  value={receiptFooterMessage}
                  onChange={(e) => setReceiptFooterMessage(e.target.value)}
                  placeholder="Return conditions, customer care phone..."
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2 px-6"
            isLoading={isSaving}
          >
            <Save className="h-4 w-4" />
            <span>Save Configuration</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
