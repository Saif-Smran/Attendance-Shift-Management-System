import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import xlsx from "xlsx";

import {
  getAttendanceReport,
  getOTReport,
  getRamadanReport,
  getRosterComplianceReport,
  getViolationsReport
} from "./report.service.js";

const REPORT_TITLE_MAP = {
  attendance: "Attendance Report",
  ot: "OT Report",
  violations: "Violations Report",
  ramadan: "Ramadan Report",
  "roster-compliance": "Roster Compliance Report"
};
const EXPORT_TIME_ZONE = "Asia/Dhaka";

const toError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const humanizeKey = (key) =>
  String(key || "")
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]+/g, " ")
    .replace(/^./, (char) => char.toUpperCase())
    .trim();

const formatDateOnly = (value) =>
  new Intl.DateTimeFormat("en-BD", {
    timeZone: EXPORT_TIME_ZONE,
    year: "numeric",
    month: "short",
    day: "2-digit"
  }).format(value);

const formatDateTime = (value) =>
  new Intl.DateTimeFormat("en-BD", {
    timeZone: EXPORT_TIME_ZONE,
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(value);

const normalizeValue = (key, value) => {
  if (value instanceof Date) {
    const normalizedKey = String(key || "").toLowerCase();
    return normalizedKey.includes("date") ? formatDateOnly(value) : formatDateTime(value);
  }

  if (Array.isArray(value)) {
    return value.join(", ");
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  return value ?? "-";
};

export const getReportDataByType = async (type, params = {}) => {
  const reportType = String(type || "").trim().toLowerCase();

  if (reportType === "attendance") {
    return getAttendanceReport(params);
  }

  if (reportType === "ot") {
    return getOTReport(params);
  }

  if (reportType === "violations") {
    return getViolationsReport(params);
  }

  if (reportType === "ramadan") {
    return getRamadanReport(params);
  }

  if (reportType === "roster-compliance") {
    return getRosterComplianceReport();
  }

  throw toError("Unsupported report type", 400);
};

export const exportToExcel = (type, data = []) => {
  const reportType = String(type || "").trim().toLowerCase();
  const title = REPORT_TITLE_MAP[reportType] || "Report";
  const safeRows = Array.isArray(data) ? data : [];

  const keys = safeRows.length > 0 ? Object.keys(safeRows[0]) : [];
  const header = keys.map((key) => humanizeKey(key));
  const bodyRows = safeRows.map((row) => keys.map((key) => normalizeValue(key, row[key])));

  const worksheet = xlsx.utils.aoa_to_sheet([
    ["Ha-Meem Group"],
    [title],
    [],
    header,
    ...bodyRows
  ]);

  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, title.replace(/\s+/g, "_"));

  return xlsx.write(workbook, { type: "buffer", bookType: "xlsx" });
};

export const exportToPDF = (type, data = [], filters = {}) => {
  const reportType = String(type || "").trim().toLowerCase();
  const title = REPORT_TITLE_MAP[reportType] || "Report";
  const safeRows = Array.isArray(data) ? data : [];
  const keys = safeRows.length > 0 ? Object.keys(safeRows[0]) : [];

  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });

  doc.setFontSize(16);
  doc.text("Ha-Meem Group", 40, 40);

  doc.setFontSize(12);
  doc.text(title, 40, 62);

  const from = filters.from || "-";
  const to = filters.to || "-";
  const month = filters.month || "-";

  doc.setFontSize(9);
  doc.text(`Generated: ${formatDateTime(new Date())}`, 40, 80);
  doc.text(`From: ${from}   To: ${to}   Month: ${month}`, 40, 94);

  autoTable(doc, {
    startY: 108,
    head: [keys.map((key) => humanizeKey(key))],
    body: safeRows.map((row) => keys.map((key) => String(normalizeValue(key, row[key])))),
    styles: {
      fontSize: 8,
      cellPadding: 4
    },
    headStyles: {
      fillColor: [13, 148, 136]
    }
  });

  return Buffer.from(doc.output("arraybuffer"));
};
