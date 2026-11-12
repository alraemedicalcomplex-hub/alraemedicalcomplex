"use client";

import React, { useState, useEffect } from "react";
import {
  FileText,
  Plus,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  UserCheck,
  Stethoscope,
  Building,
  Calendar,
  Pill,
  Search,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

interface PrescriptionRecord {
  id: string;
  patientName: string;
  patientAge?: number | null;
  patientGender?: string | null;
  doctorName: string;
  pmdcNumber?: string | null;
  clinicHospital?: string | null;
  status: "PENDING" | "VERIFIED" | "DISPENSED" | "REJECTED";
  createdAt: string;
  verifiedBy?: { fullName: string } | null;
  items: {
    id: string;
    medicineName: string;
    dosage?: string | null;
    frequency?: string | null;
    durationDays?: number | null;
    quantityPrescribed: number;
    quantityDispensed: number;
  }[];
}

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<PrescriptionRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // New Prescription Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientGender, setPatientGender] = useState("Male");
  const [doctorName, setDoctorName] = useState("");
  const [pmdcNumber, setPmdcNumber] = useState("");
  const [clinicHospital, setClinicHospital] = useState("");
  const [rxNotes, setRxNotes] = useState("");
  const [items, setItems] = useState<any[]>([
    { medicineName: "", dosage: "1 Tablet", frequency: "TDS (3x/day)", durationDays: "7", quantityPrescribed: "21" },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const fetchPrescriptions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/prescriptions");
      const data = await res.json();
      if (data.prescriptions) setPrescriptions(data.prescriptions);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const handleVerify = async (prescriptionId: string, newStatus: "VERIFIED" | "REJECTED") => {
    try {
      const res = await fetch("/api/prescriptions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prescriptionId, status: newStatus }),
      });

      if (res.ok) {
        fetchPrescriptions();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreatePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError("");

    try {
      const res = await fetch("/api/prescriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientName,
          patientAge,
          patientGender,
          doctorName,
          pmdcNumber,
          clinicHospital,
          notes: rxNotes,
          items,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFormError(data.error || "Failed to record prescription");
        setIsSubmitting(false);
        return;
      }

      setShowAddModal(false);
      setPatientName("");
      setDoctorName("");
      fetchPrescriptions();
    } catch {
      setFormError("Server connection error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const pendingCount = prescriptions.filter((r) => r.status === "PENDING").length;
  const verifiedCount = prescriptions.filter((r) => r.status === "VERIFIED").length;
  const dispensedCount = prescriptions.filter((r) => r.status === "DISPENSED").length;

  const filteredPrescriptions = prescriptions.filter((rx) => {
    if (statusFilter !== "ALL" && rx.status !== statusFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      rx.patientName.toLowerCase().includes(q) ||
      rx.doctorName.toLowerCase().includes(q) ||
      (rx.pmdcNumber && rx.pmdcNumber.toLowerCase().includes(q)) ||
      (rx.clinicHospital && rx.clinicHospital.toLowerCase().includes(q)) ||
      rx.items.some((it) => it.medicineName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FileText className="h-6 w-6 text-indigo-500" />
            Prescriptions & Controlled Drug Verification
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            DRAP compliance clinical oversight, PMDC registered prescribers, and pharmacist verification
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white gap-1.5 text-xs shadow-md shadow-indigo-600/20"
        >
          <Plus className="h-4 w-4" />
          <span>Record New Prescription</span>
        </Button>
      </div>

      {/* Top Unified Summary Ribbon */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="grid grid-cols-1 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border/60">
          <div className="p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Total Prescriptions
              </span>
              <h3 className="text-2xl font-bold text-foreground font-mono">{prescriptions.length}</h3>
              <p className="text-[11px] text-muted-foreground">Clinical records filed</p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <FileText className="h-4 w-4" />
            </div>
          </div>

          <div className="p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Pending Verification
              </span>
              <h3 className="text-2xl font-bold text-amber-400 font-mono">{pendingCount}</h3>
              <p className="text-[11px] text-muted-foreground">Awaiting Pharm.D sign-off</p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>

          <div className="p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Verified & Safe
              </span>
              <h3 className="text-2xl font-bold text-emerald-400 font-mono">{verifiedCount}</h3>
              <p className="text-[11px] text-muted-foreground">Ready for dispensing</p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>

          <div className="p-4 sm:p-5 flex items-center justify-between">
            <div className="space-y-0.5">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                Completed & Dispensed
              </span>
              <h3 className="text-2xl font-bold text-blue-400 font-mono">{dispensedCount}</h3>
              <p className="text-[11px] text-muted-foreground">Fulfilled at POS</p>
            </div>
            <div className="h-9 w-9 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <UserCheck className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <Card className="p-3">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="w-full sm:max-w-md">
            <Input
              placeholder="Search by patient, doctor, PMDC, hospital, or prescribed drug..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              icon={<Search className="h-4 w-4" />}
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto ml-auto">
            {["ALL", "PENDING", "VERIFIED", "DISPENSED", "REJECTED"].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  statusFilter === st
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-muted/40 text-muted-foreground hover:bg-muted"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Enterprise Full-Width Prescriptions Data Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/40 font-semibold text-muted-foreground">
                  <th className="py-3 px-4">Date & Patient</th>
                  <th className="py-3 px-4">Doctor & PMDC</th>
                  <th className="py-3 px-4">Clinic / Hospital</th>
                  <th className="py-3 px-4">Prescribed Medicines</th>
                  <th className="py-3 px-4">Pharmacist Review</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      Loading clinical prescriptions...
                    </td>
                  </tr>
                ) : filteredPrescriptions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted-foreground">
                      {searchQuery || statusFilter !== "ALL"
                        ? "No prescriptions match your search filter."
                        : "No clinical prescriptions recorded."}
                    </td>
                  </tr>
                ) : (
                  filteredPrescriptions.map((rx) => (
                    <tr key={rx.id} className="hover:bg-muted/30 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-foreground text-sm flex items-center gap-1.5">
                          <span>{rx.patientName}</span>
                          {rx.patientAge && (
                            <span className="text-xs text-muted-foreground font-normal">
                              ({rx.patientAge}y, {rx.patientGender})
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(rx.createdAt, true)}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-foreground flex items-center gap-1.5">
                          <Stethoscope className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                          <span>{rx.doctorName}</span>
                        </div>
                        {rx.pmdcNumber && (
                          <div className="font-mono text-[10px] text-slate-400 mt-0.5">
                            PMDC: {rx.pmdcNumber}
                          </div>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-muted-foreground max-w-[160px] truncate">
                        {rx.clinicHospital ? (
                          <span className="flex items-center gap-1">
                            <Building className="h-3 w-3 shrink-0" />
                            {rx.clinicHospital}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-3.5 px-4 max-w-[320px]">
                        <div className="flex flex-wrap gap-1.5">
                          {rx.items.map((it) => (
                            <span
                              key={it.id}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-muted/60 text-foreground border border-border/60"
                            >
                              <Pill className="h-3 w-3 text-indigo-400" />
                              <span className="font-semibold">{it.medicineName}</span>
                              <span className="text-[10px] text-muted-foreground">
                                ({it.quantityPrescribed}x)
                              </span>
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-xs">
                        {rx.verifiedBy ? (
                          <div className="text-emerald-400 font-medium flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                            <span>{rx.verifiedBy.fullName}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-[11px]">Unverified</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge
                          variant={
                            rx.status === "VERIFIED"
                              ? "success"
                              : rx.status === "PENDING"
                              ? "warning"
                              : rx.status === "DISPENSED"
                              ? "default"
                              : "destructive"
                          }
                          className="text-[10px]"
                        >
                          {rx.status}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {rx.status === "PENDING" ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2 text-xs text-rose-400 border-red-500/30 hover:bg-red-500/10"
                              onClick={() => handleVerify(rx.id, "REJECTED")}
                            >
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              className="h-7 px-2.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm"
                              onClick={() => handleVerify(rx.id, "VERIFIED")}
                            >
                              Verify
                            </Button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-muted-foreground">Processed</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal: Add New Prescription */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm">
          <div className="flex min-h-full items-center justify-center p-4 sm:p-6 text-center">
            <div className="w-full max-w-xl rounded-2xl border border-border bg-[#111827] p-6 sm:p-8 text-left shadow-2xl space-y-4">
              <div className="flex items-start justify-between pb-3 border-b border-border/80">
                <div>
                  <h3 className="text-xl font-bold text-foreground">Record Patient Prescription</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Enter patient, doctor, and prescribed items</p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="h-8 w-8 rounded-lg border border-border bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-700 flex items-center justify-center transition shrink-0 ml-4"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {formError && (
                <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-2.5 text-xs text-red-400">
                  {formError}
                </div>
              )}

              <form onSubmit={handleCreatePrescription} className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2 space-y-1">
                    <label className="text-xs font-medium text-slate-300">Patient Full Name *</label>
                    <Input placeholder="e.g. Asma Begum" value={patientName} onChange={(e) => setPatientName(e.target.value)} required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300">Age</label>
                    <Input type="number" placeholder="42" value={patientAge} onChange={(e) => setPatientAge(e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300">Physician Name *</label>
                    <Input placeholder="Dr. Muhammad Tariq" value={doctorName} onChange={(e) => setDoctorName(e.target.value)} required />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-slate-300">PMDC Registration #</label>
                    <Input placeholder="48192-P" value={pmdcNumber} onChange={(e) => setPmdcNumber(e.target.value)} />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Hospital / Medical Center</label>
                  <Input placeholder="e.g. Shalamar Hospital, Lahore" value={clinicHospital} onChange={(e) => setClinicHospital(e.target.value)} />
                </div>

                {/* Medicine items */}
                <div className="space-y-2 pt-2 border-t border-border">
                  <label className="text-xs font-medium text-slate-300 block">Prescribed Medicines</label>
                  {items.map((it, idx) => (
                    <div key={idx} className="p-3 rounded-lg border border-border bg-card/60 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Medicine name (e.g. Augmentin 625mg)"
                          value={it.medicineName}
                          onChange={(e) => {
                            const val = e.target.value;
                            setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, medicineName: val } : item)));
                          }}
                          className="h-8 text-xs"
                          required
                        />
                        <Input
                          placeholder="Dosage (e.g. 1 Tablet)"
                          value={it.dosage}
                          onChange={(e) => {
                            const val = e.target.value;
                            setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, dosage: val } : item)));
                          }}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <Input
                          placeholder="Frequency (TDS / BD)"
                          value={it.frequency}
                          onChange={(e) => {
                            const val = e.target.value;
                            setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, frequency: val } : item)));
                          }}
                          className="h-8 text-xs"
                        />
                        <Input
                          type="number"
                          placeholder="Days (e.g. 7)"
                          value={it.durationDays}
                          onChange={(e) => {
                            const val = e.target.value;
                            setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, durationDays: val } : item)));
                          }}
                          className="h-8 text-xs"
                        />
                        <Input
                          type="number"
                          placeholder="Qty (21)"
                          value={it.quantityPrescribed}
                          onChange={(e) => {
                            const val = e.target.value;
                            setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, quantityPrescribed: val } : item)));
                          }}
                          className="h-8 text-xs"
                          required
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                  <Button variant="outline" size="sm" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white" isLoading={isSubmitting}>
                    Save Prescription
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
