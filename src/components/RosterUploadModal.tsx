// ==============================================================================
// BusSync: RosterUploadModal
// Admin CSV modal with real-time file validation, error preview, and batch import.
// ==============================================================================

import React, { useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, X, Check } from 'lucide-react';
import { adminService, RosterCSVRow } from '../services/adminService';

interface RosterUploadModalProps {
  institutionId: string;
  onSuccess: (count: number) => void;
  onClose: () => void;
}

export const RosterUploadModal: React.FC<RosterUploadModalProps> = ({
  institutionId,
  onSuccess,
  onClose
}) => {
  const [csvContent, setCsvContent] = useState<string>('');
  const [validRows, setValidRows] = useState<RosterCSVRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [importedCount, setImportedCount] = useState<number>(0);

  const sampleTemplate = `email,name,role,route_code,stop_name
student1@campus.edu,Rahul Roy,student,R-101,Bellandur Gate
employee1@campus.edu,Deepa Nair,employee,R-101,HSR Sector 2 Circle`;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvContent(text);
      validate(text);
    };
    reader.readAsText(file);
  };

  const validate = (text: string) => {
    const res = adminService.parseRosterCSV(text);
    setValidRows(res.validRows);
    setErrors(res.errors);
  };

  const handleImport = async () => {
    if (validRows.length === 0) return;
    const count = await adminService.importRoster(institutionId, validRows);
    setImportedCount(count);
    setIsSuccess(true);
    onSuccess(count);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-float border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-sm">Upload Roster CSV</h3>
              <p className="text-[11px] text-slate-400">Institutional Directory Import</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          {!isSuccess ? (
            <>
              {/* File Drop Area */}
              <div className="border-2 border-dashed border-slate-300 hover:border-amber-400 rounded-2xl p-6 text-center transition-colors bg-slate-50/50">
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="csv-file-input"
                />
                <label htmlFor="csv-file-input" className="cursor-pointer flex flex-col items-center">
                  <FileText className="w-8 h-8 text-amber-500 mb-2" />
                  <span className="text-sm font-bold text-slate-800">
                    {fileName ? fileName : 'Click to select CSV file'}
                  </span>
                  <span className="text-xs text-slate-500 mt-0.5">
                    Columns: email, name, role (student/employee), route_code, stop_name
                  </span>
                </label>
              </div>

              {/* Template Paste Helper */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Or paste CSV raw text below:</span>
                <button
                  type="button"
                  onClick={() => {
                    setCsvContent(sampleTemplate);
                    validate(sampleTemplate);
                    setFileName('sample_template.csv');
                  }}
                  className="text-amber-700 hover:underline font-semibold"
                >
                  Load Sample CSV Template
                </button>
              </div>

              <textarea
                rows={4}
                value={csvContent}
                placeholder="email,name,role,route_code,stop_name..."
                onChange={(e) => {
                  setCsvContent(e.target.value);
                  validate(e.target.value);
                }}
                className="w-full p-3 font-mono text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
              />

              {/* Validation Errors Preview */}
              {errors.length > 0 && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl space-y-1">
                  <div className="text-xs font-bold text-red-700 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 text-red-600" />
                    Validation Errors Found ({errors.length}):
                  </div>
                  <ul className="text-[11px] text-red-600 list-disc list-inside space-y-0.5">
                    {errors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Valid Rows Preview Table */}
              {validRows.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>Valid Entries to Import ({validRows.length}):</span>
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" /> Ready for Import
                    </span>
                  </div>
                  <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-700 font-bold sticky top-0">
                        <tr>
                          <th className="p-2">Name</th>
                          <th className="p-2">Email</th>
                          <th className="p-2">Role</th>
                          <th className="p-2">Stop</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {validRows.map((r, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="p-2 font-medium">{r.name}</td>
                            <td className="p-2 font-mono text-slate-600">{r.email}</td>
                            <td className="p-2 uppercase text-[10px] font-bold">{r.role}</td>
                            <td className="p-2 text-slate-500">{r.stop_name || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleImport}
                disabled={validRows.length === 0}
                className="w-full btn-amber py-3.5 rounded-2xl font-bold text-sm shadow-sm transition-all active:scale-[0.99] disabled:opacity-40"
              >
                Import {validRows.length} Valid Roster Members
              </button>
            </>
          ) : (
            <div className="p-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h4 className="text-xl font-extrabold font-heading text-slate-900">
                  Import Completed Successfully
                </h4>
                <p className="text-xs text-slate-600">
                  Successfully imported <strong>{importedCount}</strong> student &amp; employee entries into the roster directory.
                </p>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full btn-amber py-3 rounded-xl font-bold text-sm shadow-sm"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

