// VO-HOLD / VO-ERR (C-2, C-3, C-4, C-20, C-22): every case except the non-string caption.
HOLD_RUN(HOLD_CASES.filter((c) => c.id !== "nonstring"));
