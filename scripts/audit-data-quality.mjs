const baseUrl = process.env.QA_API_URL || "http://localhost:8000/api/v1";
const token = process.env.QA_ACCESS_TOKEN;
import { auditCatalog } from "./audit-data-quality-lib.mjs";

if (!token) {
  console.error("Defina QA_ACCESS_TOKEN para auditar o catálogo sem alterar dados.");
  process.exit(2);
}

const result = await auditCatalog({ baseUrl, token });
console.log(JSON.stringify(result, null, 2));
if (result.findings.length) process.exitCode = 1;
