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
  } catch (err) {
    const error = new Error("Invalid filter parameters: JSON parse error");
    error.statusCode = 400;
    throw error;
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
  
  try {
    const data = await getReportDataByType(type, filters);
    
    if (!Array.isArray(data)) {
      console.error("Excel export error: data is not an array", { type, filters, dataType: typeof data });
      throw new Error("Export failed: invalid data format");
    }
    
    const buffer = exportToExcel(type, data);
    
    if (!buffer || buffer.length === 0) {
      console.error("Excel export error: empty buffer generated", { type, dataLength: data?.length || 0 });
      throw new Error("Excel generation produced empty file");
    }

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=HaMeem_${reportName(type)}_${toFileMonth()}.xlsx`
    );

    return res.send(buffer);
  } catch (err) {
    console.error("Excel export failed:", {
      type,
      filterKeys: Object.keys(filters || {}),
      errorMessage: err.message,
      statusCode: err.statusCode || 500
    });
    throw err;
  }
});

export const exportPDFController = asyncHandler(async (req, res) => {
  const type = String(req.query.type || "").trim().toLowerCase();
  const filters = parseParams(req.query);
  
  try {
    const data = await getReportDataByType(type, filters);
    
    if (!Array.isArray(data)) {
      console.error("PDF export error: data is not an array", { type, filters, dataType: typeof data });
      throw new Error("Export failed: invalid data format");
    }
    
    const buffer = exportToPDF(type, data, filters);
    
    if (!buffer || buffer.length === 0) {
      console.error("PDF export error: empty buffer generated", { type, dataLength: data?.length || 0 });
      throw new Error("PDF generation produced empty file");
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=HaMeem_${reportName(type)}_${toFileMonth()}.pdf`
    );

    return res.send(buffer);
  } catch (err) {
    console.error("PDF export failed:", {
      type,
      filterKeys: Object.keys(filters || {}),
      errorMessage: err.message,
      statusCode: err.statusCode || 500
    });
    throw err;
  }
});
