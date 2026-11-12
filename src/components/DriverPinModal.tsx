import React, { useState } from 'react';
import { Lock, Delete, AlertCircle, X, ShieldAlert } from 'lucide-react';
import { Driver } from '../types';
import { authService } from '../services/authService';

interface DriverPinModalProps {
  driver: Driver;
  institutionId: string;
  onSuccess: (driver: Driver) => void;
  onCancel: () => void;
}

export const DriverPinModal: React.FC<DriverPinModalProps> = ({
  driver,
  institutionId,
  onSuccess,
  onCancel
}) => {
  const [pin, setPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleDigit = (digit: string) => {
    if (pin.length < 4 && !isLocked && !isLoading) {
      const nextPin = pin + digit;
      setPin(nextPin);
      if (nextPin.length === 4) {
        verify(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    if (pin.length > 0 && !isLoading) {
      setPin(pin.slice(0, -1));
      setErrorMsg(null);
    }
  };

  const handleClear = () => {
    setPin('');
    setErrorMsg(null);
  };

  const verify = async (codeToVerify: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const result = await authService.verifyDriverPin(institutionId, driver.id, codeToVerify);
      if (result.success && result.driver) {
        await authService.completeDriverLogin(institutionId, result.driver);
        onSuccess(result.driver);
      } else {
        setPin('');
        setIsLocked(!!result.locked);
        setErrorMsg(result.message || 'Incorrect PIN');
      }
    } catch (err: any) {
      setPin('');
      setErrorMsg(err.message || 'Failed to verify PIN');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-float border border-slate-200 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center font-bold">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-sm">Driver Personal PIN</h3>
              <p className="text-[11px] text-slate-400">Security Verification</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close PIN verification"
            className="w-8 h-8 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Driver identity summary */}
        <div className="p-6 text-center space-y-4">
          <div>
            <div className="text-base font-bold text-slate-900">{driver.name}</div>
            <div className="text-xs text-slate-500 font-mono">{driver.phone}</div>
          </div>

          <p className="text-xs text-slate-600">
            Enter your 4-digit personal security PIN to access today's bus fleet controls.
          </p>

          {/* 4-digit display indicator */}
          <div className="flex justify-center items-center gap-4 py-2">
            {[0, 1, 2, 3].map((idx) => {
              const filled = pin.length > idx;
              return (
                <div
                  key={idx}
                  className={`w-4 h-4 rounded-full transition-all duration-150 ${
                    filled
                      ? 'bg-amber-500 scale-125 ring-4 ring-amber-100'
                      : 'bg-slate-200 border-2 border-slate-300'
                  }`}
                />
              );
            })}
          </div>

          {/* Error / Rate limiting banner */}
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2 text-left">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Tactile Keypad */}
          <div className="grid grid-cols-3 gap-2.5 pt-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                disabled={isLocked || isLoading}
                onClick={() => handleDigit(digit)}
                className="h-13 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-amber-100 active:scale-95 text-slate-900 text-xl font-bold font-heading transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
              >
                {digit}
              </button>
            ))}

            <button
              type="button"
              disabled={isLocked || isLoading || pin.length === 0}
              onClick={handleClear}
              className="h-13 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-xs font-semibold text-slate-600 transition-all disabled:opacity-40"
            >
              Clear
            </button>

            <button
              type="button"
              disabled={isLocked || isLoading}
              onClick={() => handleDigit('0')}
              className="h-13 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-amber-100 active:scale-95 text-slate-900 text-xl font-bold font-heading transition-all disabled:opacity-40"
            >
              0
            </button>

            <button
              type="button"
              disabled={isLocked || isLoading || pin.length === 0}
              onClick={handleBackspace}
              aria-label="Backspace"
              className="h-13 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 flex items-center justify-center transition-all disabled:opacity-40"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>

          <div className="text-[11px] text-slate-400">
            For development testing, default PIN is <strong className="text-slate-700 font-mono">1234</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
