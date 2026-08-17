import { readFileSync, writeFileSync } from "node:fs";

const [reportPath, outputPath] = process.argv.slice(2);
if (!reportPath || !outputPath) throw new Error("Usage: node build_inbox_candidate_sql.mjs <report.json> <output.sql>");

const report = JSON.parse(readFileSync(reportPath, "utf8"));
const quote = value => value === null || value === undefined ? "NULL" : `'${String(value).replace(/\\/g, "\\\\").replace(/'/g, "\\'")}'`;
const importStatement = `INSERT INTO inbox_imports (file_name, file_count, total_customer_messages, unique_question_count, repeated_question_messages, repeated_question_rate_basis_points) VALUES ('Facebook Inbox export (staff-imported review candidates)', ${Number(report.processedFiles)}, ${Number(report.totalCustomerMessages)}, ${Number(report.uniqueQuestionCount)}, ${Number(report.repeatedQuestionMessages)}, ${Math.round(Number(report.repeatedQuestionRate) * 100)});`;
const candidateRows = report.candidates.map(candidate => `(@import_id, ${quote(candidate.question)}, NULL, ${quote(candidate.language)}, ${Number(candidate.frequency)}, NULL, 'pending')`);
const candidateStatement = `INSERT INTO faq_candidates (import_id, question, suggested_answer, language, frequency, sample_thread_ref, status) VALUES\n${candidateRows.join(",\n")};`;
writeFileSync(outputPath, `${importStatement}\nSET @import_id = LAST_INSERT_ID();\n${candidateStatement}\n`);
