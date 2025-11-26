/* Client-only provider to keep verification responses in memory. */
"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type {
  Stage,
  PersonalInfo,
  DocumentSelection,
  WalletSelection,
  VerificationStatus,
  VerificationState
} from "@/types/verification";

type VerificationContextValue = VerificationState & {
  setStage: (stage: Stage) => void;
  setStatus: (status: VerificationStatus) => void;
  setPersonalInfo: (info: PersonalInfo | null) => void;
  setDocument: (doc: DocumentSelection | null) => void;
  setWallet: (wallet: WalletSelection | null) => void;
  setSessionId: (sessionId: string | null) => void;
  submitInfo: (payload: {
    personalInfo?: PersonalInfo | null;
    document?: DocumentSelection | null;
    wallet?: WalletSelection | null;
  }) => Promise<void>;
  reset: () => void;
};

const defaultState: VerificationState = {
  stage: "verify",
  status: "idle",
  personalInfo: null,
  document: null,
  wallet: null,
  sessionId: null,
};

const VerificationContext = createContext<VerificationContextValue | null>(null);

export function VerificationProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<VerificationState>(defaultState);

  const value = useMemo<VerificationContextValue>(
    () => ({
      ...state,
      setStage: (stage: Stage) => setState((prev: VerificationState) => ({ ...prev, stage })),
      setStatus: (status: VerificationStatus) => setState((prev: VerificationState) => ({ ...prev, status })),
      setPersonalInfo: (personalInfo: PersonalInfo | null) => setState((prev: VerificationState) => ({ ...prev, personalInfo })),
      setDocument: (document: DocumentSelection | null) => setState((prev: VerificationState) => ({ ...prev, document })),
      setWallet: (wallet: WalletSelection | null) => setState((prev: VerificationState) => ({ ...prev, wallet })),
      setSessionId: (sessionId: string | null) => setState((prev: VerificationState) => ({ ...prev, sessionId })),
      submitInfo: async ({ personalInfo, document, wallet }: { personalInfo?: PersonalInfo | null; document?: DocumentSelection | null; wallet?: WalletSelection | null }) => {
        // If this is the personal info submission, create a KYC session
        if (personalInfo && !state.sessionId) {
          try {
            const response = await fetch("http://localhost:3001/api/kyc/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ walletAddress: "5XvTMWXU2qiWADQgC9b592hEctu3EcfRzeVKTAnzrQV4" }), // Valid dummy address for testing
            });
            const data = await response.json();
            if (data.sessionId) {
              setState((prev: VerificationState) => ({ ...prev, sessionId: data.sessionId }));
            }
          } catch (err) {
            console.error("Failed to create KYC session", err);
            throw err;
          }
        }

        setState((prev: VerificationState) => ({
          ...prev,
          personalInfo: personalInfo ?? prev.personalInfo,
          document: document ?? prev.document,
          wallet: wallet ?? prev.wallet,
        }));
        return Promise.resolve();
      },
      reset: () => setState(defaultState),
    }),
    [state]
  );

  // Poll for KYC status once we have a sessionId
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;

    if (state.sessionId && state.status !== "success") {
      interval = setInterval(async () => {
        try {
          const response = await fetch(`http://localhost:3001/api/kyc/status?sessionId=${state.sessionId}`);
          const data = await response.json();

          if (data.status === "Approved") {
            setState((prev: VerificationState) => ({ ...prev, status: "success" }));
            clearInterval(interval);
          }
        } catch (err) {
          console.error("Failed to check KYC status", err);
        }
      }, 2000); // Poll every 2 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [state.sessionId, state.status]);

  return <VerificationContext.Provider value={value}>{children}</VerificationContext.Provider>;
}

export function useVerification() {
  const ctx = useContext(VerificationContext);
  if (!ctx) {
    throw new Error("useVerification must be used within a VerificationProvider");
  }
  return ctx;
}
