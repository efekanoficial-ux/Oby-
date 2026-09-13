import fs from "fs";
let content = fs.readFileSync("src/context/AuthContext.tsx", "utf-8");

// Add deleteRequest to AuthContext interface
content = content.replace(
  "adminUpdateKYC: (userId: string, status: string, reason?: string) => Promise<void>;",
  "adminUpdateKYC: (userId: string, status: string, reason?: string) => Promise<void>;\n  deleteRequest: (id: string) => Promise<void>;"
);

// Add deleteRequest implementation
const processReqStr = "const processRequest = async (id: string, accept: boolean, reason?: string) => {";
const delReqStr = `  const deleteRequest = async (id: string) => {
    try {
      await deleteDoc(doc(db, "requests", id));
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch (e) {
      console.error(e);
      alert("Hata oluştu.");
    }
  };

  const processRequest = async (id: string, accept: boolean, reason?: string) => {`;

content = content.replace(processReqStr, delReqStr);

// Add to provider
content = content.replace(
  "deleteUserPermanently,",
  "deleteUserPermanently,\n      deleteRequest,"
);

fs.writeFileSync("src/context/AuthContext.tsx", content);
