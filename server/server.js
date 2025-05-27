// server.js
import express from "express";
import sql from "mssql";
import multer from "multer";
import dotenv from "dotenv";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dayjs from "dayjs";
import xml2js from "xml2js";
import httpntlm from "httpntlm";
import ExcelJS from "exceljs";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const PORT = process.env.PORT || 3000;

// Database config
const dbConfig = {
  server: process.env.DB_SERVER,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_DATABASE,
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

let pool;
const initDB = async () => {
  try {
    pool = await sql.connect(dbConfig);
    console.log("✅ Connected to SQL Server");
  } catch (err) {
    console.error("❌ DB Connection failed:", err);
    process.exit(1);
  }
};

// Upload path setup
const uploadPath = path.join(__dirname, "../client/src/uploads");
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// Multer config for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const filename = Date.now() + "-" + file.originalname;
    cb(null, filename);
  },
});
const upload = multer({ storage });

// Utilities
const formatDateForSQL = (input) => {
  const d = dayjs(input);
  return d.isValid() ? d.format("YYYY-MM-DD HH:mm:ss") : null;
};

const toNullableInt = (value) => {
  return value === undefined ||
    value === null ||
    value === "" ||
    value === "null"
    ? null
    : parseInt(value);
};

const navFilterEncode = (field, value) => {
  const data = encodeURIComponent(`${field} eq '${value}'`);
  return `?$filter=${data}`;
};

const navFilterTopEncode = (field, value) => {
  const data = encodeURIComponent(`${field} eq '${value}'`);
  return `?$filter=${data}&$top=1`;
};

const fetchNavData = (url = null, callback) => {
  httpntlm.get(
    {
      url,
      username: process.env.NAV_USER,
      password: process.env.NAV_PASS,
      domain: process.env.NAV_DOMAIN,
    },
    (err, response) => {
      if (err) {
        return callback({
          status: 500,
          error: "Failed to fetch data",
          details: err,
        });
      }

      xml2js.parseString(
        response.body,
        { explicitArray: false },
        (err, result) => {
          if (err) {
            return callback({
              status: 500,
              error: "Failed to parse XML",
              details: err,
            });
          }

          const entries = result?.feed?.entry || [];
          const results = Array.isArray(entries)
            ? entries.map((entry) => entry.content["m:properties"])
            : [entries.content["m:properties"]];

          return callback(null, results);
        }
      );
    }
  );
};

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// === GET Routes ===
app.get("/api/get-flk", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM dbo.${process.env.TABLE_LK}`
    );
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/get-flk-noseri", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM dbo.${process.env.TABLE_LK} WHERE type = 2`
    );
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/get-flk-norep", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM dbo.${process.env.TABLE_LK} WHERE type = 1`
    );
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/get-rep-seri-by-cus", async (req, res) => {
  const { id_cus = "", value = "" } = req.query;
  try {
    const query = `
      SELECT TOP 1 status_res, rep_ke FROM dbo.${process.env.TABLE_LK}
      WHERE no_cus = '${id_cus}' AND no_seri = '${value}'
      ORDER BY id DESC
    `;
    const result = await pool.query(query);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/get-rep-seri-by-cus-edit", async (req, res) => {
  const { id_cus, id, value } = req.query;
  try {
    const query = `
      SELECT TOP 1 status_res, rep_ke FROM dbo.${process.env.TABLE_LK}
      WHERE no_cus = ${id_cus} AND no_seri = ${value} AND id != ${id}
      ORDER BY id DESC
    `;
    const result = await pool.query(query);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/get-flk-one-by-id", async (req, res) => {
  const { id } = req.query;
  try {
    const result = await pool.query(
      `SELECT * FROM dbo.${process.env.TABLE_LK} WHERE id = ${id}`
    );
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/get-no-rep", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM dbo.${process.env.TABLE_LK} WHERE no_rep != ''`
    );
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/nav-data", (req, res) => {
  const id = "SPGFI" + req.query.id;
  const navURL = process.env.NAV_worksheet_URL + navFilterEncode("FGINO", id);
  fetchNavData(navURL, (err, data) => {
    if (err) return res.status(err.status).json(err);
    res.json(data);
  });
});

app.get("/api/nav-data-noseri", (req, res) => {
  const { id } = req.query;
  const navURL = process.env.NAV_WS_URL + navFilterTopEncode("Serial_No", id);
  fetchNavData(navURL, (err, data) => {
    if (err) return res.status(err.status).json(err);
    res.json(data);
  });
});

app.get("/api/nav", (req, res) => {
  const navURL = process.env.NAV_WS_URL;
  fetchNavData(navURL, (err, data) => {
    if (err) return res.status(err.status).json(err);
    res.json(data);
  });
});

// === POST Routes ===
app.post("/api/create-flk", upload.single("pic"), async (req, res) => {
  try {
    const fields = req.body;
    const file = req.file;
    if (!file)
      return res.status(400).json({ ok: false, message: "File is required" });

    const filePath = path.join(uploadPath, file.filename);
    const {
      no_rep,
      no_seri,
      type,
      no_cus,
      no_call,
      pelapor,
      waktu_call,
      waktu_dtg,
      status_call,
      keluhan,
      kat_keluhan,
      problem,
      kat_problem,
      solusi,
      waktu_mulai,
      waktu_selesai,
      saran,
      status_res,
      created_by,
      deleted_at,
      no_lap,
    } = fields;

    // Sanitize Null
    const rep_ke = toNullableInt(fields.rep_ke);
    const count_bw = toNullableInt(fields.count_bw);
    const count_cl = toNullableInt(fields.count_cl);

    const call = formatDateForSQL(waktu_call);
    const dtg = formatDateForSQL(waktu_dtg);
    const mulai = formatDateForSQL(waktu_mulai);
    const selesai = formatDateForSQL(waktu_selesai);

    const result = await pool.query`
      INSERT INTO [dbo].[WebVTK] (
        no_rep, no_cus, no_call, pelapor, waktu_call, waktu_dtg, status_call,
        keluhan, kat_keluhan, problem, kat_problem, solusi, waktu_mulai,
        waktu_selesai, count_bw, count_cl, saran, status_res, rep_ke, no_seri,
        type, created_by, deleted_at, pic, no_lap
      ) OUTPUT INSERTED.id VALUES (
        ${no_rep}, ${no_cus}, ${no_call}, ${pelapor}, ${call}, ${dtg},
        ${status_call}, ${keluhan}, ${kat_keluhan}, ${problem}, ${kat_problem},
        ${solusi}, ${mulai}, ${selesai}, ${count_bw}, ${count_cl},
        ${saran}, ${status_res}, ${rep_ke}, ${no_seri}, ${type},
        ${created_by}, ${deleted_at}, ${filePath}, ${no_lap}
      )
    `;

    const id = result.recordset[0].id;

    res.json({ ok: true, message: "Data inserted.", data: { id } });
  } catch (error) {
    console.error("Insert Error:", error);
    res.status(500).json({
      ok: false,
      message: "Database insert error",
      error: error.message, // Short message
      details: error, // Full error object
    });
  }
});

// === POST: Create Barang ===
app.post("/api/create-brg", async (req, res) => {
  const { no_lk, barang } = req.body;

  if (!no_lk || !Array.isArray(items)) {
    return res.status(400).json({ ok: false, message: "Invalid Input" });
  }

  try {
    for (const item of items) {
      const { no_brg, nama, qty } = item;

      const query = `
        INSERT INTO dbo.${process.env.TABLE_BRG} (no_lk, no_brg, nama_brg, qty)
        VALUES ('${no_lk}', '${no_brg}', '${nama}', ${qty})
      `;

      const result = await pool.query(query);
    }

    res.json({ ok: true, message: "Barang inserted" });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ ok: false, message: "Insert failed", error: err.message });
  }
});

// === POST: Edit FLK by ID ===
app.post("/api/edit-flk", async (req, res) => {
  const { id } = req.query;
  const data = req.body;

  const toNullableInt = (val) =>
    val === "" || val === "null" ? null : parseInt(val);

  try {
    const {
      no_rep,
      no_seri,
      no_cus,
      no_call,
      pelapor,
      waktu_call,
      waktu_dtg,
      status_call,
      keluhan,
      kat_keluhan,
      problem,
      kat_problem,
      solusi,
      waktu_mulai,
      waktu_selesai,
      count_bw,
      count_cl,
      saran,
      status_res,
      rep_ke,
    } = data;

    await pool.query`
      UPDATE [dbo].[WebVTK]
      SET 
        no_rep = ${no_rep}, no_seri = ${no_seri}, no_cus = ${no_cus},
        no_call = ${no_call}, pelapor = ${pelapor}, waktu_call = ${waktu_call},
        waktu_dtg = ${waktu_dtg}, status_call = ${status_call},
        keluhan = ${keluhan}, kat_keluhan = ${kat_keluhan},
        problem = ${problem}, kat_problem = ${kat_problem}, solusi = ${solusi},
        waktu_mulai = ${waktu_mulai}, waktu_selesai = ${waktu_selesai},
        count_bw = ${toNullableInt(count_bw)}, count_cl = ${toNullableInt(
      count_cl
    )},
        saran = ${saran}, status_res = ${status_res}, rep_ke = ${toNullableInt(
      rep_ke
    )}
      WHERE id = ${id}
    `;

    res.json({
      ok: true,
      status: 1,
      message: "Data updated successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      ok: false,
      status: 0,
      message: "Update failed",
      error: err.message,
    });
  }
});

// === POST: Export to Excel ===
app.post("/api/export-excel", async (req, res) => {
  try {
    const { data: data, reportTitle, columns } = req.body;

    const dataIds = data.map((item) => item.id);
    if (!dataIds.length) return res.status(400).send("No data received");

    const barangResult = await pool.request().query(`
      SELECT *
      FROM dbo.${process.env.TABLE_BRG}
      WHERE no_lk IN (${dataIds.map((id) => `'${id}'`).join(",")})
    `);

    const mapBarang = {};
    for (const item of barangResult.recordset) {
      const { no_lk, nama_brg, no_brg, qty } = item;
      if (!mapBarang[no_lk]) {
        mapBarang[no_lk] = [];
      }
      mapBarang[no_lk].push({
        nama_brg: nama_brg,
        no_brg: no_brg,
        qty: qty,
      });
    }

    // Map items to transaction
    const mergedData = data.map((trx) => ({
      ...trx,
      barang: mapBarang[trx.id] || [],
      type: trx.type === 1 ? "Dengan Barang" : "Tanpa Barang",
    }));

    // ====== Start Excel Export ======
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Report");

    const dataInfo = ["Nama Pelanggan", "Alamat", "No.Seri"];
    const dataInfoVal = {
      nama_cus: "Vincent",
      alamat:
        "8, Jl. Bungur Besar Raya No.89, RT.8/RW.1, Kemayoran, Kec. Kemayoran, Kota Jakarta Pusat, Daerah Khusus Ibukota Jakarta 10620",
      no_seri: 123344,
    };

    // Title row
    worksheet.mergeCells("A1", "I1");
    worksheet.getCell("A1").value = reportTitle || "Export Report";
    worksheet.getCell("A1").font = { bold: true, size: 16 };
    worksheet.getCell("A1").alignment = { horizontal: "center" };
    worksheet.addRow([]);

    worksheet.getCell("A3").value = "Nama Customer =";
    worksheet.getCell("B3").value = dataInfoVal.nama_cus;
    worksheet.getCell("A4").value = "Alamat";
    worksheet.getCell("B4").value = dataInfoVal.alamat;
    worksheet.getCell("A5").value = "No. Seri";
    worksheet.getCell("B5").value = dataInfoVal.no_seri;
    worksheet.addRow([]);

    // Assume your column setup
    const mainHeaders = columns.map((col) => col.headerName);
    const itemSubHeaders = ["Nama Barang", "No Barang", "Qty"];

    // Header
    const subHeaderRow = worksheet.addRow([...mainHeaders, ...itemSubHeaders]);
    subHeaderRow.font = { bold: true };

    // Style both rows
    [subHeaderRow].forEach((row) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        };
        cell.alignment = {
          vertical: "middle",
          horizontal: "center",
          wrapText: true,
        };
      });
    });

    // Write transaction roworksheet with items
    mergedData.forEach((trx, index) => {
      const itemCount = trx.barang.length || 1;

      for (let i = 0; i < itemCount; i++) {
        const item = trx.barang[i] || {};

        // If frontend did not set 'no', we can override it here
        if (i === 0 && !trx.no) trx.no = index + 1;

        const baseFields = columns.map((col) =>
          i === 0 ? trx[col.field] : "-"
        );
        const row = worksheet.addRow([
          ...baseFields,
          item.nama_brg || "-",
          item.no_brg || "-",
          item.qty || "-",
        ]);

        row.eachCell((cell) => {
          cell.border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" },
          };
        });
      }

      // Merge transaction info columns
      if (itemCount > 1) {
        for (let i = 0; i < columns.length; i++) {
          const colLetter = worksheet.getColumn(i + 1).letter;
          worksheet.mergeCells(
            `${colLetter}${
              worksheet.lastRow.number - itemCount + 1
            }:${colLetter}${worksheet.lastRow.number}`
          );
        }
      }
    });

    // Auto-fit columns
    worksheet.columns.forEach((col) => {
      let maxLength = 10;
      col.eachCell({ includeEmpty: true }, (cell) => {
        const val = cell.value ? cell.value.toString() : "";
        maxLength = Math.max(maxLength, val.length);
      });
      col.width = maxLength + 2;
    });

    // Send the Excel file to the client
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${reportTitle || "report"}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("Excel export error:", err);
    res.status(500).send("Failed to generate Excel report");
  }
});

app.use((req, res) => {
  res.status(404).json({ message: "Not found" });
});

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
  });
});
