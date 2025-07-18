import dayjs from "dayjs";

export const selectStatusCall = {
  GR: "Garansi",
  KS: "Kontrak Servis",
  TST: "Tunjangan Servis Total",
  RT: "Rental",
  Chg: "Charge",
};

export const selectKeluhan = {
  P_JAM: "Paper Jam",
  COPY_Q: "Copy Quality",
  M_ADJUST: "Machine Adjustment",
  ELECT: "Electrical",
  MACH: "Machine",
};

export const selectProblem = {
  REPLACE: "Replace",
  CLEAN: "Clean",
  LUB: "Lubric",
  ADJUST: "Adjustment",
  REPAIR: "Repair",
};

export const selectStatusResult = {
  OK: "OK",
  CONT: "Continue",
  TS: "Technical Support",
  SS: "Software Support",
};

export const selectService = {
  GR: "Garansi",
  KS: "Kontrak Service",
  TST: "Tunjangan Service Total",
  RT: "Rental",
  Chrg: "Charge",
};

export const selectRole = {
  1: "Teknisi",
  2: "CS",
  3: "Supervisor",
};

export const selectType = {
  0: "Admin",
  1: "Bukan Admin",
};

// Set limits from env variables
const maxBackdateDays = Number(import.meta.env.VITE_BACKDATE_DAYS || 0);
const maxForwardDays = Number(Math.abs(import.meta.env.VITE_FORWARD_DAYS) || 0);

export const now = dayjs();
export const minDateTime = now.subtract(maxBackdateDays, "day");
export const maxDateTime = now.add(maxForwardDays, "day");
