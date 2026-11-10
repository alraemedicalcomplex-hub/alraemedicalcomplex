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

  return (
    <div className="space-y-6">
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-muted-foreground text-xs">
            Loading prescription records...
          </div>
        ) : prescriptions.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground text-xs">
            No clinical prescriptions recorded yet.
          </div>
        ) : (
          prescriptions.map((rx) => (
            <Card key={rx.id} className="p-5 flex flex-col justify-between hover:border-indigo-500/40 transition">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-foreground text-sm flex items-center gap-2">
                      <span>{rx.patientName}</span>
                      {rx.patientAge && (
                        <span className="text-xs text-muted-foreground font-normal">
                          ({rx.patientAge}y, {rx.patientGender})
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-indigo-400 flex items-center gap-1.5 mt-0.5">
                      <Stethoscope className="h-3.5 w-3.5" />
                      <span>{rx.doctorName}</span>
                      {rx.pmdcNumber && (
                        <span className="font-mono text-[10px] text-muted-foreground">
                          (PMDC: {rx.pmdcNumber})
                        </span>
                      )}
                    </p>
                  </div>

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
                </div>

                {rx.clinicHospital && (
                  <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <Building className="h-3 w-3" />
                    <span>{rx.clinicHospital}</span>
                  </p>
                )}

                {/* Prescribed Medicines List */}
                <div className="pt-2 border-t border-border/60 space-y-1.5">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    Prescribed Medicines:
                  </span>
                  {rx.items.map((it) => (
                    <div key={it.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/20 border border-border/40 text-xs">
                      <div>
                        <span className="font-semibold text-foreground">{it.medicineName}</span>
                        <p className="text-[10px] text-muted-foreground">
                          {it.dosage} • {it.frequency} {it.durationDays ? `(${it.durationDays} days)` : ""}
                        </p>
                      </div>
                      <span className="font-mono text-xs font-bold text-indigo-400">
                        Qty: {it.quantityPrescribed}
                      </span>
                    </div>
                  ))}
                </div>

                {rx.verifiedBy && (
                  <p className="text-[10px] text-emerald-400 flex items-center gap-1 pt-1">
                    <CheckCircle2 className="h-3 w-3" />
                    <span>Verified by Pharm.D: {rx.verifiedBy.fullName}</span>
                  </p>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-border flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground">
                  Date: {formatDate(rx.createdAt)}
                </span>

                {rx.status === "PENDING" && (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-xs text-rose-400 border-red-500/30 hover:bg-red-500/10"
                      onClick={() => handleVerify(rx.id, "REJECTED")}
                    >
                      <XCircle className="h-3 w-3 mr-1" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      className="h-7 px-2 text-xs bg-emerald-600 hover:bg-emerald-500 text-white"
                      onClick={() => handleVerify(rx.id, "VERIFIED")}
                    >
                      <CheckCircle2 className="h-3 w-3 mr-1" />
                      Verify (Pharmacist)
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Modal: Record Prescription */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative w-full max-w-xl rounded-2xl border border-border bg-[#111827] p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-foreground">Record Patient Prescription</h3>

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
      )}
    </div>
  );
}
