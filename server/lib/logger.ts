export const logger = {
  info: (arg1: any, arg2?: string) => {
    if (typeof arg1 === "string") console.log(`[INFO] ${arg1}`);
    else console.log(`[INFO] ${arg2 || ""}`, arg1);
  },
  warn: (arg1: any, arg2?: string) => {
    if (typeof arg1 === "string") console.warn(`[WARN] ${arg1}`);
    else console.warn(`[WARN] ${arg2 || ""}`, arg1);
  },
  error: (arg1: any, arg2?: string) => {
    if (typeof arg1 === "string") console.error(`[ERROR] ${arg1}`);
    else console.error(`[ERROR] ${arg2 || ""}`, arg1);
  },
  debug: (arg1: any, arg2?: string) => {
    if (typeof arg1 === "string") console.debug(`[DEBUG] ${arg1}`);
    else console.debug(`[DEBUG] ${arg2 || ""}`, arg1);
  },
};
