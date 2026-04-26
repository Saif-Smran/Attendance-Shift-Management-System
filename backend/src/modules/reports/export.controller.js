import asyncHandler from "../../utils/asyncHandler.js";

import { exportToExcel, exportToPDF, getReportDataByType } from "./export.service.js";

const parseParams = (query = {}) => {
  const raw = query.params;

  if (!raw) {
    const next = { ...query };
    delete next.type;
    return next;
  }

  if (typeof raw !== "string") {
    return raw;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
};

const toFileMonth = () => new Date().toISOString().slice(0, 7);

const reportName = (type) => {
  const map = {
    attendance: "AttendanceReport",
    ot: "OTReport",
    violations: "ViolationsReport",
    ramadan: "RamadanReport",
    "roster-compliance": "RosterComplianceReport"
  };

  return map[type] || "Report";
};

export const exportExcelController = asyncHandler(async (req, res) => {
  const type = String(req.query.type || "").trim().toLowerCase();
  const filters = parseParams(req.query);
  const data = await getReportDataByType(type, filters);
  const buffer = exportToExcel(type, data);

  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=HaMeem_${reportName(type)}_${toFileMonth()}.xlsx`
  );

  return res.send(buffer);
});

export const exportPDFController = asyncHandler(async (req, res) => {
  const type = String(req.query.type || "").trim().toLowerCase();
  const filters = parseParams(req.query);
  const data = await getReportDataByType(type, filters);
  const buffer = exportToPDF(type, data, filters);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=HaMeem_${reportName(type)}_${toFileMonth()}.pdf`
  );

  return res.send(buffer);
});
