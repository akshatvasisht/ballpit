export type Stage = "verify" | "documents" | "wallet" | "confirm";

export type PersonalInfo = {
    fullName: string;
    email: string;
    dob: string;
    address: string;
};

export type DocumentSelection = {
    type: string;
    fileName?: string;
};

export type WalletSelection = {
    wallet: string;
    address?: string;
};

export type VerificationStatus = "idle" | "in_progress" | "success" | "error";

export type VerificationState = {
    stage: Stage;
    status: VerificationStatus;
    personalInfo: PersonalInfo | null;
    document: DocumentSelection | null;
    wallet: WalletSelection | null;
    sessionId: string | null;
};
