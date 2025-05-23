import http from "http";
import sql from "mssql";
import { parse } from "url";
import { StringDecoder } from "string_decoder";
import xml2js from "xml2js";
import httpntlm from "httpntlm";
import dotenv from "dotenv";
import path from "path";
import multer from "multer";
import fs from "fs";
import { fileURLToPath } from "url";
import formidable from "formidable";
import dayjs from "dayjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const config = {
  server: process.env.DB_SERVER,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_DATABASE,
  options: {
    encrypt: false, // Set to true in production with SSL
    trustServerCertificate: true, // Only for development/testing
  },
};

// --- Global SQL Connection ---
let pool;
const initDB = async () => {
  try {
    pool = await sql.connect(config);
    console.log("✅ Connected to SQL Server");
  } catch (err) {
    console.error("❌ DB Connection failed:", err);
    process.exit(1);
  }
};

// Configure upload directory
const uploadPath = path.join(__dirname, "../client/src/uploads");

if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}

// Multer configuration
const allowedMimeTypes = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Only image and PDF files are allowed"));
  },
});

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

const navFilterEncode = (field, value) => {
  const data = encodeURIComponent(`${field} eq '${value}'`);
  return `?$filter=${data}`;
};

const navFilterTopEncode = (field, value) => {
  const data = encodeURIComponent(`${field} eq '${value}'`);
  return `?$filter=${data}&$top=1`;
};

const formatDateForSQL = (input) => {
  const d = dayjs(input);
  return d.isValid() ? d.format("YYYY-MM-DD HH:mm:ss") : null;
};

function sendResponse(res, statusCode, payload) {
  if (res.headersSent) return;
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(payload));
}

// Create server
const server = http.createServer(async (req, res) => {
  // DB connection
  const parsedUrl = parse(req.url, true);
  const method = req.method;
  const path = parsedUrl.pathname.replace(/^\/+|\/+$/g, "");
  const query = parsedUrl.query;
  const decoder = new StringDecoder("utf-8");
  let buffer = "";

  // Enable CORS for all responses
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle preflight requests
  if (method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  res.setHeader("Content-Type", "application/json");

  if (method === "POST" && path === "/uploads") {
    upload(req, res, (err) => {
      if (err) {
        console.error("Upload error:", err);
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: err.message }));
        return;
      }

      if (!req.file) {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "No file uploaded" }));
        return;
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          message: "File uploaded successfully",
          filename: req.file.filename,
          originalName: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype,
        })
      );
    });
  }

  if (method === "GET" && path === "api/get-flk") {
    const url = `SELECT * FROM dbo.${process.env.TABLE_LK}`;
    const result = await pool.query(url);
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify(result.recordset));
  }

  if (method === "GET" && path === "api/get-flk-noseri") {
    const url = `SELECT * FROM dbo.${process.env.TABLE_LK} WHERE type = 2`;

    const result = await pool.query(url);
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify(result.recordset));
  }

  if (method === "GET" && path === "api/get-flk-norep") {
    const url = `SELECT * FROM dbo.${process.env.TABLE_LK} WHERE type = 1`;

    const result = await pool.query(url);
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify(result.recordset));
  }

  if (method === "GET" && path === "api/get-rep-seri-by-cus") {
    const id_cus = query.id_cus ? query.id_cus : "";
    const value = query.value ? query.value : "";

    const url = `SELECT TOP 1 status_res, rep_ke FROM dbo.${process.env.TABLE_LK} WHERE no_cus = '${id_cus}' AND no_seri = '${value}' ORDER BY id DESC`;

    const result = await pool.query(url);
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify(result.recordset));
  }

  if (method === "GET" && path === "api/get-rep-seri-by-cus-edit") {
    const id_cus = query.id_cus;
    const id = query.id;
    const value = query.value;

    const url = `SELECT TOP 1 status_res, rep_ke FROM dbo.${process.env.TABLE_LK} WHERE no_cus = ${id_cus} AND no_seri = ${value} AND id != ${id} ORDER BY id DESC`;

    const result = await pool.query(url);
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify(result.recordset));
  }

  if (method === "GET" && path === "api/get-flk-one-by-id") {
    const id = query.id;

    const url = `SELECT * FROM dbo.${process.env.TABLE_LK} WHERE id = ${id}`;

    const result = await pool.query(url);
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify(result.recordset));
  }

  if (method === "GET" && path === "api/get-no-rep") {
    const url = `SELECT * FROM dbo.${process.env.TABLE_LK} where no_rep != ''`;
    const result = await pool.query(url);
    res.writeHead(200, { "Content-Type": "application/json" });
    return res.end(JSON.stringify(result.recordset));
    // const id = query.id;

    // const navURL = process.env.NAV_WS_URL + navFilterEncode("FGINO", id);

    // fetchNavData(navURL, (err, data) => {
    //   if (err) {
    //     res.writeHead(err.status, { "Content-Type": "application/json" });
    //     res.end(JSON.stringify(err));
    //     return;
    //   }

    //   res.writeHead(200, { "Content-Type": "application/json" });
    //   res.end(JSON.stringify(data));
    // });

    // return;
  }

  if (method === "GET" && path === "api/nav-data") {
    const id = "SPGFI" + query.id;
    const navURL = process.env.NAV_WS_URL + navFilterEncode("FGINO", id);

    fetchNavData(navURL, (err, data) => {
      if (err) {
        res.writeHead(err.status, { "Content-Type": "application/json" });
        res.end(JSON.stringify(err));
        return;
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(data));
    });

    return;
  }

  if (method === "GET" && path === "api/nav-data-noseri") {
    const id = query.id;
    const navURL = process.env.NAV_WS_URL + navFilterTopEncode("Serial_No", id);

    fetchNavData(navURL, (err, data) => {
      if (err) {
        res.writeHead(err.status, { "Content-Type": "application/json" });
        res.end(JSON.stringify(err));
        return;
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(data));
    });

    return;
  }

  if (method === "GET" && path === "api/nav") {
    const id = query.id;
    const navURL = process.env.NAV_WS_URL;

    fetchNavData(navURL, (err, data) => {
      if (err) {
        res.writeHead(err.status, { "Content-Type": "application/json" });
        res.end(JSON.stringify(err));
        return;
      }

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(data));
    });

    return;
  }

  if (method === "POST" && path === "api/create-flk") {
    const form = formidable({
      multiples: false,
      uploadDir: uploadPath,
      keepExtensions: true,
    });

    form.parse(req, async (err, fields, files) => {
      if (err) {
        res.writeHead(400, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ ok: false, message: err.message }));
      }

      try {
        // Move the uploaded file from temp folder to your desired location (optional)
        const oldPath = files.pic?.[0].filepath; // depending on formidable version\
        const newPath = uploadPath + "/" + files.pic?.[0].newFilename;

        fs.renameSync(oldPath, newPath);

        // Access your form fields like fields.no_rep, etc.
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
          count_bw,
          count_cl,
          saran,
          status_res,
          rep_ke,
          created_by,
          deleted_at,
          no_lap,
        } = fields;

        const call = formatDateForSQL(waktu_call);
        const dtg = formatDateForSQL(waktu_dtg);
        const mulai = formatDateForSQL(waktu_mulai);
        const selesai = formatDateForSQL(waktu_selesai);

        await pool.query`
                INSERT INTO [dbo].[WebVTK] (
                  no_rep, no_cus, no_call, pelapor, waktu_call, waktu_dtg, status_call,
                  keluhan, kat_keluhan, problem, kat_problem, solusi, waktu_mulai,
                  waktu_selesai, count_bw, count_cl, saran, status_res, rep_ke, no_seri,
                  type, created_by, deleted_at, pic, no_lap
                )
                VALUES (
                  ${no_rep}, ${no_cus}, ${no_call}, ${pelapor}, ${call}, ${dtg},
                  ${status_call}, ${keluhan}, ${kat_keluhan}, ${problem}, ${kat_problem},
                  ${solusi}, ${mulai}, ${selesai}, ${count_bw}, ${count_cl},
                  ${saran}, ${status_res}, ${rep_ke}, ${no_seri}, ${type}, ${created_by}, ${deleted_at}, ${newPath}, ${no_lap}
                )
              `;

        res.writeHead(200, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ ok: true, message: "Data inserted." }));
      } catch (error) {
        console.error("Insert Error:", error);
        res.writeHead(500, { "Content-Type": "application/json" });
        return res.end(JSON.stringify({ ok: false, message: "DB error." }));
      }
    });

    return;
  }

  if (method === "POST" && path === "api/create-brg") {
    let body = "";
    let handled = false;

    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", async () => {
      if (!handled) {
        handled = true;
        console.log("Start handleCreateBrg");

        try {
          const { no_seri, items } = JSON.parse(body);

          if (!no_seri || !Array.isArray(items)) {
            console.log("Invalid input");
            return sendResponse(res, 400, {
              ok: false,
              message: "Invalid input",
            });
          }

          for (const item of items) {
            const { no_brg, nama, qty } = item;
            console.log("Processing item:", no_brg);

            try {
              const query = `
          INSERT INTO dbo.${process.env.TABLE_BRG} (no_seri, no_brg, nama_brg, qty)
          VALUES (@no_seri, @no_brg, @nama_brg, @qty)
        `;

              await pool
                .request()
                .input("no_seri", no_seri)
                .input("no_brg", no_brg)
                .input("nama_brg", nama)
                .input("qty", qty)
                .query(query);

              console.log("Inserted item:", no_brg);
            } catch (sqlErr) {
              console.error("SQL Error on item:", no_brg, sqlErr);

              // Send failure and exit loop early
              if (!res.headersSent) {
                return sendResponse(res, 500, {
                  ok: false,
                  message: `Insert failed on item ${no_brg}`,
                  error: sqlErr.message,
                });
              } else {
                return; // Stop further execution
              }
            }
          }

          if (!res.headersSent) {
            console.log("Sending final 200 response");
            return sendResponse(res, 200, {
              ok: true,
              message: "Barang inserted",
            });
          } else {
            console.warn("Headers already sent, skipping final response");
          }
        } catch (err) {
          console.error("Top-level error:", err);

          if (!res.headersSent) {
            return sendResponse(res, 500, {
              ok: false,
              message: "Unexpected server error",
              error: err.message,
            });
          }
        }
      } else {
        console.warn("Request already handled");
      }
    });

    req.on("error", (err) => {
      if (!res.headersSent) {
        sendResponse(res, 500, {
          ok: false,
          message: "Request stream error",
          error: err.message,
        });
      }
    });
  }

  if (method === "POST" && path === "api/edit-flk") {
    const id = query.id;
    try {
      const data = JSON.parse(buffer);

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

      const result = await pool.query`
            UPDATE [dbo].[WebVTK]
            SET 
                no_rep = ${no_rep},
                no_seri = ${no_seri},
                no_cus = ${no_cus},
                no_call = ${no_call},
                pelapor = ${pelapor},
                waktu_call = ${waktu_call},
                waktu_dtg = ${waktu_dtg},
                status_call = ${status_call},
                keluhan = ${keluhan},
                kat_keluhan = ${kat_keluhan},
                problem = ${problem},
                kat_problem = ${kat_problem},
                solusi = ${solusi},
                waktu_mulai = ${waktu_mulai},
                waktu_selesai = ${waktu_selesai},
                count_bw = ${count_bw},
                count_cl = ${count_cl},
                saran = ${saran},
                status_res = ${status_res},
                rep_ke = ${rep_ke}
            WHERE id = ${id}
        `;

      res.writeHead(200);
      return res.end(
        JSON.stringify({
          ok: true,
          status: 1,
          data: result.recordset,
          message: "Data updated successfully",
        })
      );
    } catch (err) {
      console.error(err);
      res.writeHead(500);
      return res.end(
        JSON.stringify({
          ok: false,
          status: 0,
          data: "",
          message: "Update failed",
        })
      );
    }
  }

  // Fallback: Not found
  // res.writeHead(404);
  // return res.end(JSON.stringify({ message: "Not found" }));
});
// --- Start the Server ---
initDB().then(() => {
  server.listen(process.env.PORT, () => {
    const text =
      "✅ Server running on http://localhost:" + String(process.env.PORT);
    console.log(text);
  });
});
