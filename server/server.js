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
import bcrypt from "bcrypt";
import cookieSession from "cookie-session";
import passport from "passport";
import session from "express-session";
import passportGoogle from "passport-google-oauth20";
import timeout from "connect-timeout";
import timeoutHandler from "./timeoutHandler.js";
import { hasChanges } from "./server_helper.js";
import { error } from "console";

const GoogleStrategy = passportGoogle.Strategy;

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const PORT = process.env.PORT || 3000;
const SALT = 10;

app.use(timeout("10s")); // Request timeout

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
  pool: {
    max: 10, // Maximum number of connections
    min: 0, // Minimum number of connections
    idleTimeoutMillis: 30000, // Close idle connections after 30s
  },
  requestTimeout: 3000,
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
const uploadUsersPath = path.join(__dirname, "../client/src/uploads/users");
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
}
if (!fs.existsSync(uploadUsersPath)) {
  fs.mkdirSync(uploadUsersPath, { recursive: true });
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
const formatDatesForSQL = (input) => {
  const d = dayjs(input, "DD-MM-YYYY");
  return d.isValid() ? d.format("YYYY-MM-DD") : null;
};

const formatNumber = (val) =>
  typeof val === "number"
    ? val.toLocaleString("id-ID")
    : parseFloat(val)?.toLocaleString("id-ID") || "-";

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
const navSubStringEncode = (field, value) => {
  const data = encodeURIComponent(`substringof('${value}',${field})`);
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

const requireLogin = (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: "Unauthorized: Login required" });
};

// Middleware
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
  session({
    secret: process.env.SESSION_SECRET, // use same .env value
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000, // 1 day
      sameSite: "lax", // or 'none' if using HTTPS and cross-origin
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/auth/google/callback",
    },
    (accessToken, refreshToken, profile, done) => {
      // Save user info here (e.g. to DB), for now just return profile
      return done(null, profile);
    }
  )
);

app.get(
  "/auth/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  })
);

app.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login",
    session: true,
  }),
  (req, res) => {
    // Redirect to frontend after successful login
    res.redirect("http://localhost:5173/");
  }
);

app.get("/auth/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      console.error("Error during logout:", err);
      return next(err); // Pass error to Express error handler
    }
    // Destroy the session on the server
    req.session.destroy((destroyErr) => {
      if (destroyErr) {
        console.error("Error destroying session:", destroyErr);
        return next(destroyErr);
      }
      // Clear the session cookie from the client's browser
      res.clearCookie("connect.sid"); // Assuming 'connect.sid' is your session cookie name
      // IMPORTANT: Send a success response instead of a redirect.
      // The frontend will handle the redirection.
      res.status(200).json({ ok: true, message: "Logged out successfully" });
    });
  });
});

app.get("/api/user", (req, res) => {
  if (req.isAuthenticated()) {
    res.json(req.user);
  } else {
    res.status(401).json({ message: "Not authenticated" });
  }
});

app.get("/api/get-users-by-email", async (req, res) => {
  const { email = "" } = req.query;

  try {
    const result = await pool.query(
      `SELECT * FROM dbo.${process.env.TABLE_USER} WHERE email = '${email}'`
    );
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

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
  const { id_cus = "", no_seri = "", id = "" } = req.query;
  try {
    const query = `
      SELECT TOP 1 status_res, rep_ke FROM dbo.${process.env.TABLE_LK}
      WHERE no_cus = '${id_cus}' AND no_seri = '${no_seri}' AND id != '${id}'
      ORDER BY id DESC
    `;
    const result = await pool.query(query);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/get-rep-seri-by-cus-edit", async (req, res) => {
  try {
    const { no_cus = "", id = "", no_seri = "" } = req.query;
    const query = `
      SELECT TOP 1 status_res, rep_ke FROM dbo.${process.env.TABLE_LK}
      WHERE no_cus = '${no_cus}' AND no_seri = '${no_seri}' AND id != '${id}'
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

app.get("/api/get-last-service", async (req, res) => {
  const { no_seri } = req.query;

  try {
    const result = await pool.query(
      `SELECT TOP 1 waktu_selesai, count_bw, count_cl FROM dbo.${process.env.TABLE_LK} WHERE no_seri = '${no_seri}' ORDER BY waktu_selesai DESC`
    );
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/get-contract-lk", async (req, res) => {
  const { no_cus } = req.query;
  try {
    const result = await pool.query(
      `SELECT * FROM dbo.${process.env.TABLE_CONTRACT} WHERE no_cus = '${no_cus}' ORDER BY tgl_contract_exp DESC`
    );

    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/get-instalasi-lk", async (req, res) => {
  const { id_contract } = req.query;

  try {
    const result = await pool.query(
      `SELECT * FROM dbo.${process.env.TABLE_CONTRACT_MACHINE} WHERE id_contract = '${id_contract}' ORDER BY tgl_instalasi DESC`
    );

    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/get-area-lk", async (req, res) => {
  const { no_cus } = req.query;
  try {
    const result = await pool.query(
      `SELECT area.kode_area , area.groups, teknisi.name as nama_teknisi, spv.name as nama_spv from dbo.${process.env.TABLE_CUSTOMER} as cus join dbo.${process.env.TABLE_AREA} as area 
on cus.kode_area = area.kode_area join dbo.${process.env.TABLE_USER} as teknisi on teknisi.id = area.id_teknisi
join dbo.${process.env.TABLE_USER} as spv on spv.id = area.id_supervisor where cus.no_cus = '${no_cus}'`
    );

    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// === HIT NAVISION ===
app.get("/api/nav-by-no-cus", (req, res) => {
  const no_cus = req.query.no_cus;
  const navURL =
    process.env.NAV_WS_URL + navFilterEncode("Sell_to_Customer_No", no_cus);

  fetchNavData(navURL, (err, data) => {
    if (err)
      return res.status(err.status).json({ error: err, ok: false, data: null });
    res.status(200).json({ ok: true, data: data });
  });
});

app.get("/api/nav-by-nama-cus", (req, res) => {
  const { nama_cus } = req.query;
  const navURL =
    process.env.NAV_WS_URL +
    navSubStringEncode("Sell_to_Customer_Name", nama_cus);

  fetchNavData(navURL, (err, data) => {
    if (err)
      return res.status(err.status).json({ error: err, ok: false, data: null });
    res.status(200).json({ ok: true, data: data });
  });
});

app.get("/api/nav-data", (req, res) => {
  const id = "SPGFI" + req.query.id;
  const navURL = process.env.NAV_WS_URL + navFilterEncode("FGINO", id);
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

// ==== FLK CRUD ====
app.post("/api/create-flk", upload.single("pic"), async (req, res) => {
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
    no_lap,
    no_fd,
  } = fields;

  const transaction = new sql.Transaction(pool);
  try {
    await transaction.begin();
    const request = new sql.Request(transaction);

    // Sanitize Null
    const rep_ke = toNullableInt(fields.rep_ke);
    const count_bw = toNullableInt(fields.count_bw);
    const count_cl = toNullableInt(fields.count_cl);

    const call = formatDateForSQL(waktu_call);
    const dtg = formatDateForSQL(waktu_dtg);
    const mulai = formatDateForSQL(waktu_mulai);
    const selesai = formatDateForSQL(waktu_selesai);

    const query = `
      INSERT INTO dbo.${process.env.TABLE_LK} (
        no_rep, no_cus, no_call, pelapor, waktu_call, waktu_dtg, status_call,
        keluhan, kat_keluhan, problem, kat_problem, solusi, waktu_mulai,
        waktu_selesai, count_bw, count_cl, saran, status_res, rep_ke, no_seri,
        type, created_by, pic, no_lap, no_fd
      ) OUTPUT INSERTED.id VALUES (
        '${no_rep}', '${no_cus}', '${no_call}', '${pelapor}', '${call}', '${dtg}',
        '${status_call}', '${keluhan}', '${kat_keluhan}', '${problem}', '${kat_problem}',
        '${solusi}', '${mulai}', '${selesai}', '${count_bw}', '${count_cl}',
        '${saran}', '${status_res}', ${rep_ke}, '${no_seri}', '${type}',
        '${created_by}', '${filePath}', '${no_lap}', '${no_fd}'
      )
    `;

    const execute = await request.query(query);

    const id = execute.recordset[0].id;
    await transaction.commit();
    res.json({ ok: true, message: "Data inserted.", data: { id } });
  } catch (err) {
    console.error(err);
    try {
      await transaction.rollback();
      console.log("Transaction rolled back.");
    } catch (rollbackErr) {
      console.error("Error rolling back transaction:", rollbackErr);
    }

    if (err.name === "RequestError" && err.message.includes("Timeout")) {
      console.log("Detected a database request timeout.");
      // Use 408 Request Timeout for client-side handling
      res.status(408).json({
        ok: false,
        message: "Database operation timed out. Please try again.",
      });
    } else {
      // Handle all other types of database or logic errors
      console.log("Detected a general server error.");
      res.status(500).json({
        ok: false,
        message: "Failed to create laporan kerja due to a server error.",
        error: err.message,
      });
    }
  }
});

app.post("/api/create-brg", async (req, res) => {
  const { no_lk, items } = req.body;

  if (!no_lk || !Array.isArray(items)) {
    return res.status(400).json({ ok: false, message: "Invalid Input" });
  }
  const transaction = new sql.Transaction(pool);
  try {
    await transaction.begin();
    const request = new sql.Request(transaction);

    for (const item of items) {
      const { no_brg, nama, qty } = item;

      const query = `
        INSERT INTO dbo.${process.env.TABLE_BRG} (no_lk, no_brg, nama_brg, qty)
        VALUES ('${no_lk}', '${no_brg}', '${nama}', ${qty})
      `;

      const execute = await request.query(query);
    }

    await transaction.commit();

    res.json({ ok: true, message: "Barang inserted" });
  } catch (err) {
    console.error(err);
    try {
      await transaction.rollback();
      console.log("Transaction rolled back.");
    } catch (rollbackErr) {
      console.error("Error rolling back transaction:", rollbackErr);
    }

    if (err.name === "RequestError" && err.message.includes("Timeout")) {
      console.log("Detected a database request timeout.");
      // Use 408 Request Timeout for client-side handling
      res.status(408).json({
        ok: false,
        message: "Database operation timed out. Please try again.",
      });
    } else {
      // Handle all other types of database or logic errors
      console.log("Detected a general server error.");
      res.status(500).json({
        ok: false,
        message: "Failed to create barang due to a server error.",
        error: err.message,
      });
    }
  }
});

app.post("/api/edit-flk", upload.single("pic"), async (req, res) => {
  const { id } = req.query;
  const fields = req.body;
  const file = req.file;
  if (!file)
    return res.status(400).json({ ok: false, message: "File is required" });

  const filePath = path.join(uploadPath, file.filename);
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
    saran,
    status_res,
    no_lap,
  } = fields;

  const transaction = new sql.Transaction(pool);
  try {
    await transaction.begin();
    const request = new sql.Request(transaction);

    // Sanitize Null
    const rep_ke = toNullableInt(fields.rep_ke);
    const count_bw = toNullableInt(fields.count_bw);
    const count_cl = toNullableInt(fields.count_cl);

    const call = formatDateForSQL(waktu_call);
    const dtg = formatDateForSQL(waktu_dtg);
    const mulai = formatDateForSQL(waktu_mulai);
    const selesai = formatDateForSQL(waktu_selesai);

    let query = `
      UPDATE [dbo].[WebVTK]
      SET 
        no_seri = '${no_seri}', no_cus = '${no_cus}',
        no_call = '${no_call}', pelapor = '${pelapor}', waktu_call = '${call}',
        waktu_dtg = '${dtg}', status_call = '${status_call}',
        keluhan = '${keluhan}', kat_keluhan = '${kat_keluhan}',
        problem = '${problem}', kat_problem = '${kat_problem}', solusi = '${solusi}',
        waktu_mulai = '${mulai}', waktu_selesai = '${selesai}',
        count_bw = '${count_bw}', count_cl = '${count_cl}',
        saran = '${saran}', status_res = '${status_res}', no_lap = '${no_lap}'
    `;

    if (rep_ke) {
      query += `, rep_ke = '${rep_ke}'`;
    }

    if (no_rep) {
      query += `, no_rep = '${no_rep}'`;
    }

    if (file) {
      query += `, pic = '${filePath}'`;
    }

    query += ` WHERE id = ${id}`;

    const execute = await request.query(query);

    await transaction.commit();
    res.json({ ok: true, message: "Data updated." });
  } catch (err) {
    console.error(err);
    try {
      await transaction.rollback();
      console.log("Transaction rolled back.");
    } catch (rollbackErr) {
      console.error("Error rolling back transaction:", rollbackErr);
    }

    if (err.name === "RequestError" && err.message.includes("Timeout")) {
      console.log("Detected a database request timeout.");
      // Use 408 Request Timeout for client-side handling
      res.status(408).json({
        ok: false,
        message: "Database operation timed out. Please try again.",
      });
    } else {
      // Handle all other types of database or logic errors
      console.log("Detected a general server error.");
      res.status(500).json({
        ok: false,
        message: "Failed to create laporan kerja due to a server error.",
        error: err.message,
      });
    }
  }
});

// ==== EXPORT ====
app.post("/api/export-data", async (req, res) => {
  try {
    const { dari, sampai, jenis, no_cus, no_seri } = req.body;

    const conditions = [];
    const request = pool.request();

    if (jenis === "no_rep") {
      conditions.push("type = @type");
      request.input("type", 1);
    } else if (jenis === "no_seri") {
      conditions.push("type = @type");
      request.input("type", 2);
    }

    if (dari && sampai) {
      conditions.push(
        "FORMAT(waktu_selesai, 'yyyy-MM-dd') BETWEEN @dari AND @sampai"
      );
      request.input("dari", dayjs(dari).format("YYYY-MM-DD"));
      request.input("sampai", dayjs(sampai).format("YYYY-MM-DD"));
    }

    if (no_cus) {
      conditions.push("no_cus = @no_cus");
      request.input("no_cus", no_cus);
    }

    if (no_seri) {
      conditions.push("no_seri = @no_seri");
      request.input("no_seri", no_seri);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const query = `SELECT * FROM dbo.${process.env.TABLE_LK} ${whereClause} ORDER BY waktu_selesai ASC`;

    // execute
    const result = await request.query(query);

    res.json({
      ok: true,
      message: "Data get filter success",
      data: result.recordset,
    });
  } catch (err) {
    console.error("Get data filter error:", err);
    res.status(500).send("Failed to get data filter");
  }

  return;
});

app.post("/api/export-data-customer", async (req, res) => {
  try {
    const { dari, sampai, jenis, no_cus } = req.body;

    const conditions = [];
    const request = pool.request();

    if (jenis === "no_rep") {
      conditions.push("type = @type");
      request.input("type", 1);
    } else if (jenis === "no_seri") {
      conditions.push("type = @type");
      request.input("type", 2);
    }

    if (dari && sampai) {
      conditions.push(
        "FORMAT(waktu_selesai, 'yyyy-MM-dd') BETWEEN @dari AND @sampai"
      );
      request.input("dari", dayjs(dari).format("YYYY-MM-DD"));
      request.input("sampai", dayjs(sampai).format("YYYY-MM-DD"));
    }

    if (no_cus) {
      conditions.push("no_cus = @no_cus");
      request.input("no_cus", no_cus);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const query = `SELECT * FROM dbo.${process.env.TABLE_LK} ${whereClause} ORDER BY waktu_selesai, no_seri ASC`;

    // execute
    const result = await request.query(query);

    res.json({
      ok: true,
      message: "Data get filter success",
      data: result.recordset,
    });
  } catch (err) {
    console.error("Get data filter error:", err);
    res.status(500).send("Failed to get data filter");
  }

  return;
});

app.post("/api/export-data-area", async (req, res) => {
  try {
    const { dari, sampai, jenis, groups, kode_area } = req.body;

    const conditions = [];
    const request = pool.request();

    if (jenis === "no_rep") {
      conditions.push("type = @type");
      request.input("type", 1);
    } else if (jenis === "no_seri") {
      conditions.push("type = @type");
      request.input("type", 2);
    }

    if (dari && sampai) {
      conditions.push(
        "FORMAT(waktu_selesai, 'yyyy-MM-dd') BETWEEN @dari AND @sampai"
      );
      request.input("dari", dayjs(dari).format("YYYY-MM-DD"));
      request.input("sampai", dayjs(sampai).format("YYYY-MM-DD"));
    }

    if (groups) {
      conditions.push("area.groups = @groups");
      request.input("groups", groups);
    }

    if (kode_area) {
      conditions.push("area.kode_area = @kode_area");
      request.input("kode_area", kode_area);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const query = `SELECT lk.* FROM dbo.${process.env.TABLE_LK} AS lk JOIN dbo.${process.env.TABLE_CUSTOMER} AS cus ON lk.no_cus = cus.no_cus
JOIN dbo.${process.env.TABLE_AREA} AS area ON cus.kode_area = area.kode_area ${whereClause} ORDER BY lk.waktu_selesai, lk.no_seri ASC`;

    // execute
    const result = await request.query(query);

    res.json({
      ok: true,
      message: "Data get filter success",
      data: result.recordset,
    });
  } catch (err) {
    console.error("Get data filter error:", err);
    res.status(500).send("Failed to get data filter");
  }

  return;
});

app.post("/api/export-data-teknisi", async (req, res) => {
  try {
    const { dari, sampai, jenis, teknisi } = req.body;

    const conditions = [];
    const request = pool.request();

    if (jenis === "no_rep") {
      conditions.push("type = @type");
      request.input("type", 1);
    } else if (jenis === "no_seri") {
      conditions.push("type = @type");
      request.input("type", 2);
    }

    if (dari && sampai) {
      conditions.push(
        "FORMAT(waktu_selesai, 'yyyy-MM-dd') BETWEEN @dari AND @sampai"
      );
      request.input("dari", dayjs(dari).format("YYYY-MM-DD"));
      request.input("sampai", dayjs(sampai).format("YYYY-MM-DD"));
    }

    if (teknisi) {
      conditions.push("teknisi.id = @teknisi");
      request.input("teknisi", teknisi);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const query = `SELECT lk.* FROM dbo.${process.env.TABLE_LK} AS lk JOIN dbo.${process.env.TABLE_CUSTOMER} AS cus ON lk.no_cus = cus.no_cus JOIN dbo.${process.env.TABLE_AREA} AS area ON cus.kode_area = area.kode_area JOIN dbo.${process.env.TABLE_USER} AS teknisi ON area.id_teknisi = teknisi.id ${whereClause} ORDER BY lk.waktu_selesai, lk.no_seri ASC`;

    // execute
    const result = await request.query(query);

    res.json({
      ok: true,
      message: "Data get filter success",
      data: result.recordset,
    });
  } catch (err) {
    console.error("Get data filter error:", err);
    res.status(500).send("Failed to get data filter");
  }

  return;
});

app.post("/api/export-report", async (req, res) => {
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

    const sanitizeFields = (data) => {
      const sanitized = {};
      for (const key in data) {
        sanitized[key] =
          data[key] != null && data[key] !== "" ? data[key] : "-";
      }
      return sanitized;
    };

    // Map items to transaction
    const mergedData = data.map((trx) => {
      const safeTrx = sanitizeFields(trx);

      return {
        ...safeTrx,
        waktu_mulai: dayjs(trx.waktu_mulai).format("DD/MM/YYYY HH:mm"),
        waktu_selesai: dayjs(trx.waktu_selesai).format("DD/MM/YYYY HH:mm"),
        waktu_call: dayjs(trx.waktu_call).format("DD/MM/YYYY HH:mm"),
        waktu_dtg: dayjs(trx.waktu_dtg).format("DD/MM/YYYY HH:mm"),
        created_at: dayjs(trx.created_at).format("DD/MM/YYYY HH:mm"),
        type: trx.type === 1 ? "Dengan Barang" : "Tanpa Barang",
        barang: mapBarang[trx.id] || [],
      };
    });

    // ====== Start Excel Export ======
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Report");

    const dataInfoVal = {
      // nama_cus: "Vincent",
      // alamat:
      //   "8, Jl. Bungur Besar Raya No.89, RT.8/RW.1, Kemayoran, Kec. Kemayoran, Kota Jakarta Pusat, Daerah Khusus Ibukota Jakarta 10620",
      // no_seri: 123344,
      // penanggung_jawab: "Marcel",
      // jabatan: "Staff",
      // telp: "987678",
      // model: "C123",
      // no_rangka: "CT765678",
      // inst: "28/03/2023",
      // con: "28/03/2024",
      // end_con: "22/09/2025",
    };

    // Title row
    worksheet.mergeCells("A1", "I1");
    worksheet.getCell("A1").value = reportTitle || "Export Report";
    worksheet.getCell("A1").font = { bold: true, size: 16 };
    worksheet.getCell("A1").alignment = { horizontal: "center" };
    worksheet.addRow([]);

    const infoArray = [
      ["Nama Pelanggan", dataInfoVal.nama_cus || "-"],
      ["No. Seri", dataInfoVal.no_seri || "-"],
      ["Tgl Install", dataInfoVal.inst || "-"],
      ["Alamat", dataInfoVal.alamat || "-"],
      ["Model", dataInfoVal.model || "-"],
      ["Tgl Kontrak", dataInfoVal.con || "-"],
      ["Penanggung Jawab", dataInfoVal.penanggung_jawab || "-"],
      ["No. Rangka", dataInfoVal.no_rangka || "-"],
      ["Tgl Akhir Kontrak", dataInfoVal.end_con || "-"],
      ["Jabatan", dataInfoVal.jabatan || "-"],
      ["No. Telp", dataInfoVal.telp || "-"],
    ];

    // Add a single row with this info (e.g., row 3)
    const infoRow = worksheet.addRow([]);

    // Split into chunks (3 items per row)
    const chunkSize = 3;
    for (let i = 0; i < infoArray.length; i += chunkSize) {
      const chunk = infoArray.slice(i, i + chunkSize);
      const row = worksheet.addRow([]);

      let colIndex = 1;
      chunk.forEach(([label, value]) => {
        const labelCell = row.getCell(colIndex++);
        // const equalsCell = row.getCell(colIndex++);
        const valueCell = row.getCell(colIndex++);
        const gapCell = row.getCell(colIndex++);

        labelCell.value = label;
        labelCell.font = { bold: true };

        // equalsCell.value = "=";
        // equalsCell.alignment = { horizontal: "center" };

        valueCell.value = "= " + value;
        valueCell.alignment = { wrapText: true, shrinkToFit: true };
      });
    }

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
      let maxLength = 5;

      col.eachCell({ includeEmpty: true }, (cell) => {
        const val = cell.value ? cell.value.toString() : "";
        maxLength = Math.max(maxLength, val.length);

        // Apply wrap text + alignment to all cells
        cell.alignment = {
          wrapText: true,
          vertical: "middle",
          horizontal: "left",
        };
      });

      // Set column width with padding
      col.width = Math.min(maxLength + 2, 50); // Limit to max width
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

app.post("/api/export-report-customer", async (req, res) => {
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

    const sanitizeFields = (data) => {
      const sanitized = {};
      for (const key in data) {
        sanitized[key] =
          data[key] != null && data[key] !== "" ? data[key] : "-";
      }
      return sanitized;
    };

    // Map items to transaction
    const mergedData = data.map((trx) => {
      const safeTrx = sanitizeFields(trx);

      return {
        ...safeTrx,
        waktu_mulai: dayjs(trx.waktu_mulai).format("DD MMMM YYYY HH:mm"),
        waktu_selesai: dayjs(trx.waktu_selesai).format("DD/MM/YYYY HH:mm"),
        waktu_call: dayjs(trx.waktu_call).format("DD/MM/YYYY HH:mm"),
        waktu_dtg: dayjs(trx.waktu_dtg).format("DD/MM/YYYY HH:mm"),
        created_at: dayjs(trx.created_at).format("DD/MM/YYYY HH:mm"),
        type: trx.type === 1 ? "Dengan Barang" : "Tanpa Barang",
        barang: mapBarang[trx.id] || [],
      };
    });

    // ====== Start Excel Export ======
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Report");

    const customerDataResult = await pool.request().query(`
      SELECT cus.no_cus, cus.alias, cus.kode_area, cus.nama_cus, area.groups, teknisi.name AS teknisi, spv.name AS spv FROM dbo.${process.env.TABLE_CUSTOMER} AS cus JOIN dbo.${process.env.TABLE_AREA} AS area ON cus.kode_area = area.kode_area JOIN dbo.${process.env.TABLE_USER} AS teknisi ON area.id_teknisi = teknisi.id JOIN dbo.${process.env.TABLE_USER} AS spv ON area.id_supervisor = spv.id WHERE cus.no_cus = '${mergedData[0].no_cus}'
    `);

    console.log(customerDataResult);

    let dataInfoVal;
    if (customerDataResult.recordset) {
      dataInfoVal = customerDataResult.recordset[0];
    }

    // Title row
    worksheet.mergeCells("A1", "I1");
    worksheet.getCell("A1").value = reportTitle || "Export Report";
    worksheet.getCell("A1").font = { bold: true, size: 16 };
    worksheet.getCell("A1").alignment = { horizontal: "center" };
    worksheet.addRow([]);

    const infoArray = [
      ["Nama Customer", dataInfoVal.nama_cus || "-"],
      ["No. Customer", dataInfoVal.no_cus || "-"],
      ["Alias", dataInfoVal.alias || "-"],
      ["Kode Area", dataInfoVal.kode_area || "-"],
      ["Groups", dataInfoVal.groups || "-"],
      ["Teknisi", dataInfoVal.teknisi || "-"],
      ["Supervisor", dataInfoVal.spv || "-"],
    ];

    // Add a single row with this info (e.g., row 3)
    const infoRow = worksheet.addRow([]);

    // Split into chunks (3 items per row)
    const chunkSize = 3;
    for (let i = 0; i < infoArray.length; i += chunkSize) {
      const chunk = infoArray.slice(i, i + chunkSize);
      const row = worksheet.addRow([]);

      let colIndex = 1;
      chunk.forEach(([label, value]) => {
        const labelCell = row.getCell(colIndex++);
        // const equalsCell = row.getCell(colIndex++);
        const valueCell = row.getCell(colIndex++);
        const gapCell = row.getCell(colIndex++);

        labelCell.value = label;
        labelCell.font = { bold: true };

        // equalsCell.value = "=";
        // equalsCell.alignment = { horizontal: "center" };

        valueCell.value = "= " + value;
        valueCell.alignment = { wrapText: true, shrinkToFit: true };
      });
    }

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
      let maxLength = 5;

      col.eachCell({ includeEmpty: true }, (cell) => {
        const val = cell.value ? cell.value.toString() : "";
        maxLength = Math.max(maxLength, val.length);

        // Apply wrap text + alignment to all cells
        cell.alignment = {
          wrapText: true,
          vertical: "middle",
          horizontal: "left",
        };
      });

      // Set column width with padding
      col.width = Math.min(maxLength + 2, 50); // Limit to max width
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

app.post("/api/export-report-area", async (req, res) => {
  try {
    const { data: data, reportTitle, columns, groups, kode_area } = req.body;

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

    const sanitizeFields = (data) => {
      const sanitized = {};
      for (const key in data) {
        sanitized[key] =
          data[key] != null && data[key] !== "" ? data[key] : "-";
      }
      return sanitized;
    };

    // Map items to transaction
    const mergedData = data.map((trx) => {
      const safeTrx = sanitizeFields(trx);

      return {
        ...safeTrx,
        waktu_mulai: dayjs(trx.waktu_mulai).format("DD MMMM YYYY HH:mm"),
        waktu_selesai: dayjs(trx.waktu_selesai).format("DD/MM/YYYY HH:mm"),
        waktu_call: dayjs(trx.waktu_call).format("DD/MM/YYYY HH:mm"),
        waktu_dtg: dayjs(trx.waktu_dtg).format("DD/MM/YYYY HH:mm"),
        created_at: dayjs(trx.created_at).format("DD/MM/YYYY HH:mm"),
        type: trx.type === 1 ? "Dengan Barang" : "Tanpa Barang",
        barang: mapBarang[trx.id] || [],
      };
    });

    // ====== Start Excel Export ======
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Report");

    const condition = [];

    if (groups) {
      condition.push(`groups = '${groups}'`);
    }

    if (kode_area) {
      condition.push(`kode_area = '${kode_area}'`);
    }

    const whereClause =
      condition.length > 0 ? ` WHERE ${condition.join(" AND ")}` : "";

    const areaDataQuery = `SELECT area.kode_area, area.nama_area, area.groups, teknisi.name AS teknisi, spv.name AS spv FROM dbo.${process.env.TABLE_AREA} AS area JOIN dbo.${process.env.TABLE_USER} AS teknisi on area.id_teknisi = teknisi.id
JOIN dbo.${process.env.TABLE_USER} AS spv ON area.id_supervisor = spv.id ${whereClause}`;

    console.log(areaDataQuery);

    const areaDataResult = await pool.request().query(areaDataQuery);

    let dataInfoVal;
    if (areaDataResult.recordset) {
      dataInfoVal = areaDataResult.recordset[0];
    }

    // Title row
    worksheet.mergeCells("A1", "I1");
    worksheet.getCell("A1").value = reportTitle || "Export Report";
    worksheet.getCell("A1").font = { bold: true, size: 16 };
    worksheet.getCell("A1").alignment = { horizontal: "center" };
    worksheet.addRow([]);

    const infoArray = [
      ["Kode Area", dataInfoVal.kode_area || "-"],
      ["Nama Area", dataInfoVal.nama_area || "-"],
      ["Groups", dataInfoVal.groups || "-"],
      ["Teknisi", dataInfoVal.teknisi || "-"],
      ["Supervisor", dataInfoVal.spv || "-"],
    ];

    // Add a single row with this info (e.g., row 3)
    const infoRow = worksheet.addRow([]);

    // Split into chunks (3 items per row)
    const chunkSize = 3;
    for (let i = 0; i < infoArray.length; i += chunkSize) {
      const chunk = infoArray.slice(i, i + chunkSize);
      const row = worksheet.addRow([]);

      let colIndex = 1;
      chunk.forEach(([label, value]) => {
        const labelCell = row.getCell(colIndex++);
        // const equalsCell = row.getCell(colIndex++);
        const valueCell = row.getCell(colIndex++);
        const gapCell = row.getCell(colIndex++);

        labelCell.value = label;
        labelCell.font = { bold: true };

        // equalsCell.value = "=";
        // equalsCell.alignment = { horizontal: "center" };

        valueCell.value = "= " + value;
        valueCell.alignment = { wrapText: true, shrinkToFit: true };
      });
    }

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
      let maxLength = 5;

      col.eachCell({ includeEmpty: true }, (cell) => {
        const val = cell.value ? cell.value.toString() : "";
        maxLength = Math.max(maxLength, val.length);

        // Apply wrap text + alignment to all cells
        cell.alignment = {
          wrapText: true,
          vertical: "middle",
          horizontal: "left",
        };
      });

      // Set column width with padding
      col.width = Math.min(maxLength + 2, 50); // Limit to max width
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

app.post("/api/export-report-teknisi", async (req, res) => {
  try {
    const { data: data, reportTitle, columns, teknisi } = req.body;

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

    const sanitizeFields = (data) => {
      const sanitized = {};
      for (const key in data) {
        sanitized[key] =
          data[key] != null && data[key] !== "" ? data[key] : "-";
      }
      return sanitized;
    };

    // Map items to transaction
    const mergedData = data.map((trx) => {
      const safeTrx = sanitizeFields(trx);

      return {
        ...safeTrx,
        waktu_mulai: dayjs(trx.waktu_mulai).format("DD MMMM YYYY HH:mm"),
        waktu_selesai: dayjs(trx.waktu_selesai).format("DD/MM/YYYY HH:mm"),
        waktu_call: dayjs(trx.waktu_call).format("DD/MM/YYYY HH:mm"),
        waktu_dtg: dayjs(trx.waktu_dtg).format("DD/MM/YYYY HH:mm"),
        created_at: dayjs(trx.created_at).format("DD/MM/YYYY HH:mm"),
        type: trx.type === 1 ? "Dengan Barang" : "Tanpa Barang",
        barang: mapBarang[trx.id] || [],
      };
    });

    // ====== Start Excel Export ======
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Report");

    const areaDataQuery = `SELECT teknisi.name AS teknisi FROM dbo.${process.env.TABLE_AREA} AS area JOIN dbo.${process.env.TABLE_USER} AS teknisi on area.id_teknisi = teknisi.id
JOIN dbo.${process.env.TABLE_USER} AS spv ON area.id_supervisor = spv.id WHERE teknisi.id = '${teknisi}'`;

    console.log(areaDataQuery);

    const areaDataResult = await pool.request().query(areaDataQuery);

    let dataInfoVal;
    if (areaDataResult.recordset) {
      dataInfoVal = areaDataResult.recordset[0];
    }

    // Title row
    worksheet.mergeCells("A1", "I1");
    worksheet.getCell("A1").value = reportTitle || "Export Report";
    worksheet.getCell("A1").font = { bold: true, size: 16 };
    worksheet.getCell("A1").alignment = { horizontal: "center" };
    worksheet.addRow([]);

    const infoArray = [["Teknisi", dataInfoVal.teknisi || "-"]];

    // Add a single row with this info (e.g., row 3)
    const infoRow = worksheet.addRow([]);

    // Split into chunks (3 items per row)
    const chunkSize = 3;
    for (let i = 0; i < infoArray.length; i += chunkSize) {
      const chunk = infoArray.slice(i, i + chunkSize);
      const row = worksheet.addRow([]);

      let colIndex = 1;
      chunk.forEach(([label, value]) => {
        const labelCell = row.getCell(colIndex++);
        // const equalsCell = row.getCell(colIndex++);
        const valueCell = row.getCell(colIndex++);
        const gapCell = row.getCell(colIndex++);

        labelCell.value = label;
        labelCell.font = { bold: true };

        // equalsCell.value = "=";
        // equalsCell.alignment = { horizontal: "center" };

        valueCell.value = "= " + value;
        valueCell.alignment = { wrapText: true, shrinkToFit: true };
      });
    }

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
      let maxLength = 5;

      col.eachCell({ includeEmpty: true }, (cell) => {
        const val = cell.value ? cell.value.toString() : "";
        maxLength = Math.max(maxLength, val.length);

        // Apply wrap text + alignment to all cells
        cell.alignment = {
          wrapText: true,
          vertical: "middle",
          horizontal: "left",
        };
      });

      // Set column width with padding
      col.width = Math.min(maxLength + 2, 50); // Limit to max width
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

app.post("/api/export-lk-norep", async (req, res) => {
  try {
    const {
      data,
      reportTitle = "Single Export",
      signature = {
        columns: [
          { label: "Teknisi", name: "" },
          { label: "Supervisor", name: "" },
          { label: "Manager", name: "" },
        ],
      },
    } = req.body;

    const columns = [
      { field: "no_rep", headerName: "No. Report" },
      { field: "no_seri", headerName: "No. Seri" },
      { field: "no_lap", headerName: "No. Laporan" },
      { field: "no_cus", headerName: "No. Customer" },
      { field: "waktu_mulai", headerName: "Mulai" },
      { field: "waktu_selesai", headerName: "Selesai" },
      { field: "kat_problem", headerName: "Problem" },
      { field: "problem", headerName: "Keterangan Problem" },
      { field: "solusi", headerName: "Solusi" },
      { field: "count_bw", headerName: "Counter B/W" },
      { field: "count_cl", headerName: "Counter C/L" },
      { field: "status_call", headerName: "Status Call" },
      { field: "status_res", headerName: "Result" },
    ];

    if (!data || typeof data !== "object" || !data.id) {
      return res.status(400).send("Invalid or missing data");
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Single Report");

    const borderAll = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };

    // === Set fixed column widths for all A-C
    ["A", "B", "C"].forEach((col) => (worksheet.getColumn(col).width = 30));

    // === Title row
    worksheet.mergeCells("A1:C1");
    const titleCell = worksheet.getCell("A1");
    titleCell.value = reportTitle;
    titleCell.font = { bold: true, size: 20 };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };

    worksheet.addRow([]); // spacer

    // === Data Table Header
    const headerRow = worksheet.addRow(["Column", "Data"]);
    headerRow.font = { bold: true };
    headerRow.eachCell((cell) => {
      cell.border = borderAll;
      cell.alignment = { horizontal: "center", vertical: "middle" };
    });

    // === Data rows based on columns config
    columns.forEach(({ field, headerName }) => {
      let raw = data[field];

      // Format by type
      if (["waktu_mulai", "waktu_selesai"].includes(field) && raw) {
        raw = dayjs(raw).format("DD MMMM YYYY - HH:mm");
      }

      if (["count_bw", "count_cl"].includes(field)) {
        raw = formatNumber(raw);
      }

      const row = worksheet.addRow([
        headerName,
        raw != null && raw !== "" ? raw : "-",
      ]);

      row.eachCell((cell) => {
        cell.border = borderAll;
        cell.alignment = { vertical: "middle", wrapText: true };
      });
    });

    // === Separator Row
    worksheet.addRow([]);

    // === Fetch barang from DB
    const barangResult = await pool.request().query(`
      SELECT no_brg, nama_brg, qty
      FROM dbo.${process.env.TABLE_BRG}
      WHERE no_lk = '${data.id}'
    `);

    const barangList = barangResult.recordset || [];

    // === Barang Header
    const barangHeader = worksheet.addRow(["No Barang", "Nama Barang", "Qty"]);
    barangHeader.font = { bold: true };
    barangHeader.eachCell((cell) => {
      cell.border = borderAll;
      cell.alignment = { horizontal: "center", vertical: "middle" };
    });

    // === Barang Rows
    barangList.forEach((barang) => {
      const row = worksheet.addRow([
        barang.no_brg || "-",
        barang.nama_brg || "-",
        barang.qty || "-",
      ]);
      row.eachCell((cell) => {
        cell.border = borderAll;
        cell.alignment = {
          horizontal: "left",
          vertical: "middle",
          wrapText: true,
        };
      });
    });

    worksheet.addRow([]); // spacer before signature

    // === Signature Section
    const labels = signature.columns.map((col) => col.label || "-");
    const names = signature.columns.map((col) =>
      col.name ? `( ${col.name} )` : ""
    );

    const labelRow = worksheet.addRow(labels);
    labelRow.eachCell((cell) => {
      cell.border = borderAll;
      cell.font = { bold: true };
      cell.alignment = { horizontal: "center", vertical: "middle" };
    });

    const signRow = worksheet.addRow(["", "", ""]);
    signRow.height = 100;
    signRow.eachCell((cell) => {
      cell.border = borderAll;
    });

    const nameRow = worksheet.addRow(names);
    nameRow.eachCell((cell) => {
      cell.border = borderAll;
      cell.alignment = { horizontal: "center", vertical: "middle" };
    });

    // === Send file
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${reportTitle.replace(/\s+/g, "_")}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("Excel export error:", err);
    res.status(500).send("Failed to generate Excel file");
  }
});

app.post("/api/export-lk-noseri", async (req, res) => {
  try {
    const {
      data,
      reportTitle = "Single Export",
      signature = {
        columns: [
          { label: "Teknisi", name: "" },
          { label: "Supervisor", name: "" },
          { label: "Manager", name: "" },
        ],
      },
    } = req.body;

    const columns = [
      { field: "no_seri", headerName: "No. Seri" },
      { field: "no_lap", headerName: "No. Laporan" },
      { field: "no_cus", headerName: "No. Customer" },
      { field: "waktu_mulai", headerName: "Mulai" },
      { field: "waktu_selesai", headerName: "Selesai" },
      { field: "kat_problem", headerName: "Problem" },
      { field: "problem", headerName: "Keterangan Problem" },
      { field: "solusi", headerName: "Solusi" },
      { field: "count_bw", headerName: "Counter B/W" },
      { field: "count_cl", headerName: "Counter C/L" },
      { field: "status_call", headerName: "Status Call" },
      { field: "status_res", headerName: "Result" },
    ];

    if (!data || typeof data !== "object" || !data.id) {
      return res.status(400).send("Invalid or missing data");
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Single Report");

    const borderAll = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };

    // === Set fixed column widths for all A-C
    ["A", "B", "C"].forEach((col) => (worksheet.getColumn(col).width = 30));

    // === Title row
    worksheet.mergeCells("A1:C1");
    const titleCell = worksheet.getCell("A1");
    titleCell.value = reportTitle;
    titleCell.font = { bold: true, size: 20 };
    titleCell.alignment = { horizontal: "center", vertical: "middle" };

    worksheet.addRow([]); // spacer

    // === Data Table Header
    const headerRow = worksheet.addRow(["Column", "Data"]);
    headerRow.font = { bold: true };
    headerRow.eachCell((cell) => {
      cell.border = borderAll;
      cell.alignment = { horizontal: "center", vertical: "middle" };
    });

    // === Data rows based on columns config
    columns.forEach(({ field, headerName }) => {
      let raw = data[field];

      // Format by type
      if (["waktu_mulai", "waktu_selesai"].includes(field) && raw) {
        raw = dayjs(raw).format("DD MMMM YYYY - HH:mm");
      }

      if (["count_bw", "count_cl"].includes(field)) {
        raw = formatNumber(raw);
      }

      const row = worksheet.addRow([
        headerName,
        raw != null && raw !== "" ? raw : "-",
      ]);

      row.eachCell((cell) => {
        cell.border = borderAll;
        cell.alignment = { vertical: "middle", wrapText: true };
      });
    });

    worksheet.addRow([]); // spacer before signature

    // === Signature Section
    const labels = signature.columns.map((col) => col.label || "-");
    const names = signature.columns.map((col) =>
      col.name ? `( ${col.name} )` : ""
    );

    const labelRow = worksheet.addRow(labels);
    labelRow.eachCell((cell) => {
      cell.border = borderAll;
      cell.font = { bold: true };
      cell.alignment = { horizontal: "center", vertical: "middle" };
    });

    const signRow = worksheet.addRow(["", "", ""]);
    signRow.height = 100;
    signRow.eachCell((cell) => {
      cell.border = borderAll;
    });

    const nameRow = worksheet.addRow(names);
    nameRow.eachCell((cell) => {
      cell.border = borderAll;
      cell.alignment = { horizontal: "center", vertical: "middle" };
    });

    // === Send file
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${reportTitle.replace(/\s+/g, "_")}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("Excel export error:", err);
    res.status(500).send("Failed to generate Excel file");
  }
});

// ==== USER CRUD ====
app.post("/api/create-users", upload.none(), async (req, res) => {
  const { name, email, type, role } = req.body;

  try {
    const query = `
      INSERT INTO dbo.${process.env.TABLE_USER} (name, email, type, role)
      VALUES ('${name}', '${email}', '${type}', '${role}')
    `;

    const result = await pool.query(query);
    res.json({ ok: true, message: "User inserted" });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ ok: false, message: "Insert failed", error: err.message });
  }
});

app.post("/api/edit-users", upload.none(), async (req, res) => {
  const { id } = req.query;
  const { name, email, type, role } = req.body;
  // let filePath = null;

  // const file = req.file;
  // if (file) filePath = path.join(uploadPath, file.filename);

  try {
    const query = `
      UPDATE [dbo].${process.env.TABLE_USER}
      SET [email] = '${email}'
      ,[type] = '${type}'
      ,[role] = '${role}'
      ,[name] = '${name}'
      WHERE id = '${id}'
    `;

    const result = await pool.query(query);
    res.json({ ok: true, message: "User updated" });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ ok: false, message: "Update failed", error: err.message });
  }
});

app.get("/api/get-users", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM dbo.${process.env.TABLE_USER}`
    );
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/get-teknisi", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM dbo.${process.env.TABLE_USER} WHERE role = 1`
    );
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/get-spv", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM dbo.${process.env.TABLE_USER}  WHERE role = 3`
    );
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/get-users-by-id", async (req, res) => {
  const { id = "" } = req.query;

  try {
    const result = await pool.query(
      `SELECT * FROM dbo.${process.env.TABLE_USER} WHERE id = '${id}'`
    );
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/reset-pass", async (req, res) => {
  const { id = "" } = req.query;
  const now = formatDateForSQL(dayjs());

  try {
    const result = await pool.query(
      `UPDATE dbo.${process.env.TABLE_USER} SET reset_pass = '${now}' WHERE id = ${id}`
    );

    res.json({
      ok: true,
      message: "Berhasil",
    });
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// ==== CONTRACT CRUD ====
app.get("/api/get-last-contract", async (req, res) => {
  const { no_cus } = req.query;

  try {
    const result = await pool.query(
      `SELECT TOP 2 id, tgl_contract_exp FROM dbo.${process.env.TABLE_CONTRACT} WHERE no_cus = '${no_cus}' ORDER BY tgl_contract_exp DESC`
    );
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/get-contract-by-id", async (req, res) => {
  const { id } = req.query;

  try {
    const result = await pool.query(
      `SELECT * FROM dbo.${process.env.TABLE_CONTRACT} WHERE id = '${id}'`
    );
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/get-contract", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM dbo.${process.env.TABLE_CONTRACT}`
    );
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/get-contract-type", async (req, res) => {
  const { type } = req.query;

  try {
    const result = await pool.query(
      `SELECT * FROM dbo.${process.env.TABLE_CONTRACT_TYPE} WHERE type_name = '${type}'`
    );
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/get-contract-machine", async (req, res) => {
  const { id_contract } = req.query;
  try {
    const result = await pool.query(
      `SELECT
    id,
    id_contract,
    no_seri,
    tgl_instalasi,
    lokasi,
    created_by,
    created_at
FROM
    (
        SELECT
            *,
            ROW_NUMBER() OVER (PARTITION BY no_seri ORDER BY created_at DESC) as rn
        FROM
            dbo.${process.env.TABLE_CONTRACT_MACHINE}
        WHERE
            id_contract = '${id_contract}'
    ) AS SubQuery
WHERE
    rn = 1;
`
    );
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/get-contract-machine-origin", async (req, res) => {
  const { id_contract } = req.query;
  try {
    const result = await pool.query(
      `SELECT
    id,
    id_contract,
    no_seri,
    tgl_instalasi,
    lokasi,
    created_by,
    created_at
FROM
    (
        SELECT
            *,
            ROW_NUMBER() OVER (PARTITION BY no_seri ORDER BY created_at ASC) as rn
        FROM
            dbo.${process.env.TABLE_CONTRACT_MACHINE}
        WHERE
            id_contract = '${id_contract}'
    ) AS SubQuery
WHERE
    rn = 1;
`
    );
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/get-contract-machine-history-by-id", async (req, res) => {
  const { id_contract } = req.query;
  try {
    const result = await pool.query(
      `SELECT * FROM dbo.${process.env.TABLE_CONTRACT_MACHINE} WHERE id_contract = '${id_contract}' ORDER BY no_seri, tgl_instalasi DESC`
    );
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/api/create-contract", upload.none(), async (req, res) => {
  const { id, no_seri, tgl_contract, type_service, tgl_contract_exp, no_cus } =
    req.body;

  const serialNumbers = JSON.parse(no_seri);
  if (!Array.isArray(serialNumbers)) {
    throw new Error("no_seri must be an array");
  }
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();
    const request = new sql.Request(transaction);
    const contract = formatDateForSQL(tgl_contract);
    const contract_exp = formatDateForSQL(tgl_contract_exp);

    const query = `
    INSERT INTO dbo.${process.env.TABLE_CONTRACT} (no_contract, tgl_contract, tgl_contract_exp, type_service, no_cus, created_by) OUTPUT INSERTED.id 
    VALUES ('${id}', '${contract}', '${contract_exp}', '${type_service}', '${no_cus}', '1')
    `;

    const execute = await request.query(query);
    const contractId = execute.recordset[0].id;

    // 3. Insert serial numbers with rollback protection
    let allSerialsInserted = true;
    const failedSerials = [];

    for (const [index, item] of serialNumbers.entries()) {
      try {
        const inst = formatDatesForSQL(item.tgl_instalasi);

        const serialQuery = `
          INSERT INTO dbo.${process.env.TABLE_CONTRACT_MACHINE} 
            (id_contract, no_seri, lokasi, tgl_instalasi, created_by) 
          VALUES (
            '${contractId}', 
            '${item.no_seri}', 
            '${item.lokasi || ""}',
            '${inst || ""}',
            1
          )
        `;

        await request.query(serialQuery);
      } catch (serialError) {
        allSerialsInserted = false;
        failedSerials.push({
          index,
          no_seri: item.no_seri,
          error: serialError.message,
        });
        console.error(`Failed to insert serial ${item.no_seri}:`, serialError);
        break; // Exit loop on first failure
      }
    }

    // throw new Error("error");

    // 4. Verify complete success before commit
    if (!allSerialsInserted) {
      throw new Error(
        `Serial number insertion failed for items: ${JSON.stringify(
          failedSerials
        )}`
      );
    }

    await transaction.commit();
    res.json({ ok: true, message: "Contract inserted" });
  } catch (err) {
    console.error(err);
    try {
      await transaction.rollback();
      console.log("Transaction rolled back.");
    } catch (rollbackErr) {
      console.error("Error rolling back transaction:", rollbackErr);
    }

    if (err.name === "RequestError" && err.message.includes("Timeout")) {
      console.log("Detected a database request timeout.");
      // Use 408 Request Timeout for client-side handling
      res.status(408).json({
        ok: false,
        message: "Database operation timed out. Please try again.",
      });
    } else {
      // Handle all other types of database or logic errors
      console.log("Detected a general server error.");
      res.status(500).json({
        ok: false,
        message: "Failed to create contract due to a server error.",
        error: err.message,
      });
    }
  }
});

app.post("/api/edit-contract", upload.none(), async (req, res) => {
  const { id } = req.query;
  const { no_seri, tgl_contract, type_service, tgl_contract_exp } = req.body;

  let transaction;
  try {
    // Validate input
    if (!id) throw new Error("Contract ID is required");
    if (!no_seri) throw new Error("Serial numbers are required");

    let serialNumbers;
    try {
      serialNumbers = JSON.parse(no_seri);
      if (!Array.isArray(serialNumbers)) {
        throw new Error("no_seri must be an array");
      }
    } catch (parseError) {
      throw new Error("Invalid serial numbers format");
    }

    // Begin transaction
    transaction = new sql.Transaction(pool);
    await transaction.begin();
    const request = new sql.Request(transaction);

    // Format dates safely
    const contractDate = formatDateForSQL(tgl_contract);
    const contractExpDate = formatDateForSQL(tgl_contract_exp);

    // 1. Update contract - USING PARAMETERIZED QUERY
    const updateContractQuery = `
      UPDATE dbo.${process.env.TABLE_CONTRACT} 
      SET tgl_contract = @contractDate, 
          tgl_contract_exp = @contractExpDate, 
          type_service = @typeService
      WHERE id = @id
    `;

    await request
      .input("contractDate", sql.Date, contractDate)
      .input("contractExpDate", sql.Date, contractExpDate)
      .input("typeService", sql.VarChar, type_service)
      .input("id", sql.VarChar, id)
      .query(updateContractQuery);

    // 2. Process machines
    // Get current machines
    const currentResult = await request.query(
      `SELECT id, no_seri, lokasi, tgl_instalasi
       FROM dbo.${process.env.TABLE_CONTRACT_MACHINE} 
       WHERE id_contract = '${id}'`
    );
    const currentMachines = currentResult.recordset;

    // Process incoming machines
    for (const machine of serialNumbers) {
      const existing = currentMachines.find(
        (m) => m.no_seri === machine.no_seri
      );

      const formatedTglInst = formatDatesForSQL(machine.tgl_instalasi);

      if (existing) {
        // Update if changed - USING PARAMETERIZED QUERY
        if (
          existing.lokasi !== machine.lokasi ||
          existing.no_seri !== machine.no_seri ||
          existing.tgl_instalasi !== machine.tgl_instalasi
        ) {
          await request.query(`
              UPDATE dbo.${process.env.TABLE_CONTRACT_MACHINE} 
              SET no_seri = '${machine.no_seri}', lokasi = '${machine.lokasi}', tgl_instalasi = '${formatedTglInst}'
              WHERE id = '${existing.id}'
            `);
        }
      } else {
        // Add new machine - USING PARAMETERIZED QUERY
        await request.query(`
            INSERT INTO dbo.${process.env.TABLE_CONTRACT_MACHINE} 
            (no_seri, lokasi, id_contract, created_by, tgl_instalasi) 
            VALUES ('${machine.no_seri}', '${machine.lokasi}', '${id}', 1, '${formatedTglInst}')
          `);
      }
    }

    // Find machines to delete
    const machinesToDelete = currentMachines.filter(
      (dbMachine) =>
        !serialNumbers.some(
          (incoming) => incoming.no_seri === dbMachine.no_seri
        )
    );

    for (const machine of machinesToDelete) {
      await request.query(`
          DELETE FROM dbo.${process.env.TABLE_CONTRACT_MACHINE} 
          WHERE id = '${id}'
        `);
    }

    // Commit if all successful
    await transaction.commit();
    res.json({ ok: true, message: "Contract edited successfully" });
  } catch (err) {
    console.error("Error in edit-contract:", err);

    // Rollback transaction if it exists
    if (transaction) {
      try {
        await transaction.rollback();
        console.log("Transaction rolled back due to error");
      } catch (rollbackErr) {
        console.error("Error during rollback:", rollbackErr);
      }
    }

    // Determine appropriate error response
    let statusCode = 500;
    let errorMessage = "Failed to edit contract due to a server error";

    if (
      err.message.includes("must be an array") ||
      err.message.includes("Invalid serial numbers")
    ) {
      statusCode = 400;
      errorMessage = err.message;
    } else if (err.message.includes("Contract ID is required")) {
      statusCode = 400;
      errorMessage = err.message;
    }

    res.status(statusCode).json({
      ok: false,
      message: errorMessage,
      error: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
});

app.post("/api/update-contract-counter", upload.none(), async (req, res) => {
  const { type, last_count } = req.body;

  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();
    const request = new sql.Request(transaction);

    const query = `
   UPDATE dbo.${process.env.TABLE_CONTRACT_TYPE} SET last_count = ${last_count}  WHERE type_name = '${type}'
    `;

    const execute = await request.query(query);

    await transaction.commit();
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    try {
      await transaction.rollback();
      console.log("Transaction rolled back.");
    } catch (rollbackErr) {
      console.error("Error rolling back transaction:", rollbackErr);
    }

    if (err.name === "RequestError" && err.message.includes("Timeout")) {
      console.log("Detected a database request timeout.");
      // Use 408 Request Timeout for client-side handling
      res.status(408).json({
        ok: false,
        message: "Database operation timed out. Please try again.",
      });
    } else {
      // Handle all other types of database or logic errors
      console.log("Detected a general server error.");
      res.status(500).json({
        ok: false,
        message: "Failed to create contract due to a server error.",
        error: err.message,
      });
    }
  }
});

// ==== INSTALASI CRUD ====
app.get("/api/get-instalasi-by-id", async (req, res) => {
  const { id } = req.query;

  try {
    const result = await pool.query(
      `SELECT * FROM dbo.${process.env.TABLE_INSTALASI} WHERE id = '${id}'`
    );
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/get-instalasi-by-contract", async (req, res) => {
  const { id } = req.query;

  try {
    const result = await pool.query(
      `SELECT
    id,
    id_contract,
    no_seri,
    tgl_instalasi,
    lokasi,
    created_by,
    created_at
FROM
    (
        SELECT
            *,
            ROW_NUMBER() OVER (PARTITION BY no_seri ORDER BY created_at DESC) as rn
        FROM
            dbo.${process.env.TABLE_CONTRACT_MACHINE}
        WHERE
            id_contract = '${id}'
    ) AS SubQuery
WHERE
    rn = 1`
    );

    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/get-id-contract", async (req, res) => {
  const { id } = req.query;

  try {
    const result = await pool.query(
      `SELECT id FROM dbo.${process.env.TABLE_CONTRACT}`
    );

    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/get-instalasi", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM dbo.${process.env.TABLE_INSTALASI}`
    );
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/api/create-instalasi", upload.none(), async (req, res) => {
  const { id_kontrak, no_seri, tgl_instalasi } = req.body;

  const serialNumbers = JSON.parse(no_seri);
  if (!Array.isArray(serialNumbers)) {
    throw new Error("no_seri must be an array");
  }
  const transaction = new sql.Transaction(pool);
  try {
    await transaction.begin();
    const request = new sql.Request(transaction);
    const inst = formatDateForSQL(tgl_instalasi);

    let allSerialsInserted = true;
    const failedSerials = [];

    for (const [index, item] of serialNumbers.entries()) {
      try {
        const query = `
      INSERT INTO dbo.${process.env.TABLE_INSTALASI} (id_kontrak, no_seri, tgl_instalasi, lokasi, created_by)
      VALUES ('${id_kontrak}', '${item.no_seri}', '${inst}', '${item.lokasi}', '1')
    `;

        await request.query(query);
      } catch (instError) {
        allSerialsInserted = false;
        failedSerials.push({
          index,
          no_seri: item.no_seri,
          error: instError.message,
        });
        console.error(`Failed to insert serial ${item.no_seri}:`, instError);
        break; // Exit loop on first failure
      }
    }

    if (!allSerialsInserted) {
      throw new Error(
        `Serial number insertion failed for items: ${JSON.stringify(
          failedSerials
        )}`
      );
    }

    await transaction.commit();
    res.json({ ok: true, message: "Instalasi inserted" });
  } catch (err) {
    console.error(err);
    try {
      await transaction.rollback();
      console.log("Transaction rolled back.");
    } catch (rollbackErr) {
      console.error("Error rolling back transaction:", rollbackErr);
    }

    if (err.name === "RequestError" && err.message.includes("Timeout")) {
      console.log("Detected a database request timeout.");
      // Use 408 Request Timeout for client-side handling
      res.status(408).json({
        ok: false,
        message: "Database operation timed out. Please try again.",
      });
    } else {
      // Handle all other types of database or logic errors
      console.log("Detected a general server error.");
      res.status(500).json({
        ok: false,
        message: "Failed to create contract due to a server error.",
        error: err.message,
      });
    }
  }
});

app.post("/api/create-pindah-instalasi", upload.none(), async (req, res) => {
  const { no_seri } = req.body;

  const serialNumbers = JSON.parse(no_seri);
  if (!Array.isArray(serialNumbers)) {
    throw new Error("no_seri must be an array");
  }
  const transaction = new sql.Transaction(pool);
  try {
    await transaction.begin();
    const request = new sql.Request(transaction);

    let allSerialsInserted = true;
    const failedSerials = [];

    for (const [index, item] of serialNumbers.entries()) {
      try {
        const inst = formatDatesForSQL(item.tgl_instalasi);

        const query = `
      INSERT INTO dbo.${process.env.TABLE_CONTRACT_MACHINE} (id_contract, no_seri, tgl_instalasi, lokasi, created_by)
      VALUES ('${item.id_contract}', '${item.no_seri}', '${inst}', '${item.lokasi}', '1')
    `;

        await request.query(query);
      } catch (instError) {
        allSerialsInserted = false;
        failedSerials.push({
          index,
          no_seri: item.no_seri,
          error: instError.message,
        });
        console.error(`Failed to insert serial ${item.no_seri}:`, instError);
        break; // Exit loop on first failure
      }
    }

    if (!allSerialsInserted) {
      throw new Error(
        `Serial number insertion failed for items: ${JSON.stringify(
          failedSerials
        )}`
      );
    }

    await transaction.commit();
    res.json({ ok: true, message: "Instalasi inserted" });
  } catch (err) {
    console.error(err);
    try {
      await transaction.rollback();
      console.log("Transaction rolled back.");
    } catch (rollbackErr) {
      console.error("Error rolling back transaction:", rollbackErr);
    }

    if (err.name === "RequestError" && err.message.includes("Timeout")) {
      console.log("Detected a database request timeout.");
      // Use 408 Request Timeout for client-side handling
      res.status(408).json({
        ok: false,
        message: "Database operation timed out. Please try again.",
      });
    } else {
      // Handle all other types of database or logic errors
      console.log("Detected a general server error.");
      res.status(500).json({
        ok: false,
        message: "Failed to create contract due to a server error.",
        error: err.message,
      });
    }
  }
});

app.post("/api/edit-instalasi", upload.none(), async (req, res) => {
  const { id } = req.query;
  const { id_kontrak, tgl_instalasi, lokasi } = req.body;

  const transaction = new sql.Transaction(pool);
  try {
    await transaction.begin();
    const request = new sql.Request(transaction);
    const inst = formatDateForSQL(tgl_instalasi);

    const query = `
      UPDATE dbo.${process.env.TABLE_INSTALASI} SET id_kontrak = '${id_kontrak}', tgl_instalasi = '${inst}', lokasi = '${lokasi}' WHERE id = '${id}'
    `;

    await request.query(query);
    await transaction.commit();
    res.json({ ok: true, message: "Instalasi updated" });
  } catch (err) {
    console.error(err);
    try {
      await transaction.rollback();
      console.log("Transaction rolled back.");
    } catch (rollbackErr) {
      console.error("Error rolling back transaction:", rollbackErr);
    }

    if (err.name === "RequestError" && err.message.includes("Timeout")) {
      console.log("Detected a database request timeout.");
      // Use 408 Request Timeout for client-side handling
      res.status(408).json({
        ok: false,
        message: "Database operation timed out. Please try again.",
      });
    } else {
      // Handle all other types of database or logic errors
      console.log("Detected a general server error.");
      res.status(500).json({
        ok: false,
        message: "Failed to create contract due to a server error.",
        error: err.message,
      });
    }
  }
});

app.get("/api/get-noseri-contract", async (req, res) => {
  const { id_contract } = req.query;

  try {
    const result = await pool.query(
      `SELECT * FROM dbo.${process.env.TABLE_CONTRACT_MACHINE} WHERE id_contract = '${id_contract}'`
    );

    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

// ==== AREA DAN TEKNISI CRUD ====
app.get("/api/get-area", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM dbo.${process.env.TABLE_AREA}`
    );
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/get-area-groups", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT groups FROM dbo.${process.env.TABLE_AREA} GROUP BY groups`
    );
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/api/create-area", upload.none(), async (req, res) => {
  const { kode_area, nama_area, groups, id_supervisor, id_teknisi } = req.body;
  const now = dayjs();

  const transaction = new sql.Transaction(pool);
  try {
    await transaction.begin();
    const request = new sql.Request(transaction);

    const query = `
      INSERT INTO dbo.${
        process.env.TABLE_AREA
      } (kode_area, nama_area, groups, id_supervisor, updated_at, id_teknisi)
      VALUES ('${kode_area}', '${nama_area}', '${groups}', '${id_supervisor}', '${formatDateForSQL(
      now
    )}', '${id_teknisi}')
    `;

    await request.query(query);
    await transaction.commit();
    res.json({ ok: true, message: "Area inserted" });
  } catch (err) {
    console.error(err);
    try {
      await transaction.rollback();
      console.log("Transaction rolled back.");
    } catch (rollbackErr) {
      console.error("Error rolling back transaction:", rollbackErr);
    }

    if (err.name === "RequestError" && err.message.includes("Timeout")) {
      console.log("Detected a database request timeout.");
      // Use 408 Request Timeout for client-side handling
      res.status(408).json({
        ok: false,
        message: "Database operation timed out. Please try again.",
      });
    } else {
      // Handle all other types of database or logic errors
      console.log("Detected a general server error.");
      res.status(500).json({
        ok: false,
        message: "Failed to create contract due to a server error.",
        error: err.message,
      });
    }
  }
});

app.get("/api/get-area-by-id", async (req, res) => {
  const { id = "" } = req.query;

  try {
    const result = await pool.query(
      `SELECT * FROM dbo.${process.env.TABLE_AREA} WHERE id = '${id}'`
    );
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/api/edit-area", upload.none(), async (req, res) => {
  const { id = "" } = req.query;
  const { kode_area, nama_area, groups, id_supervisor, id_teknisi } = req.body;

  const now = dayjs();
  const transaction = new sql.Transaction(pool);
  try {
    await transaction.begin();
    const request = new sql.Request(transaction);

    const query = `
      UPDATE dbo.${
        process.env.TABLE_AREA
      } SET kode_area = '${kode_area}', nama_area = '${nama_area}', groups = '${groups}', id_supervisor = '${id_supervisor}', updated_at = '${formatDateForSQL(
      now
    )}', id_teknisi = '${id_teknisi}' WHERE id = '${id}'
    `;

    await request.query(query);
    await transaction.commit();
    res.json({ ok: true, message: "Area updated" });
  } catch (err) {
    console.error(err);
    try {
      await transaction.rollback();
      console.log("Transaction rolled back.");
    } catch (rollbackErr) {
      console.error("Error rolling back transaction:", rollbackErr);
    }

    if (err.name === "RequestError" && err.message.includes("Timeout")) {
      console.log("Detected a database request timeout.");
      // Use 408 Request Timeout for client-side handling
      res.status(408).json({
        ok: false,
        message: "Database operation timed out. Please try again.",
      });
    } else {
      // Handle all other types of database or logic errors
      console.log("Detected a general server error.");
      res.status(500).json({
        ok: false,
        message: "Failed to create contract due to a server error.",
        error: err.message,
      });
    }
  }
});

// ==== CUSTOMER ====
app.get("/api/get-customer", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM dbo.${process.env.TABLE_CUSTOMER}`
    );
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/get-customer-by-id", async (req, res) => {
  const { id } = req.query;

  try {
    const result = await pool.query(
      `SELECT * FROM dbo.${process.env.TABLE_CUSTOMER} WHERE id = '${id}'`
    );
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/get-no-customer", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT no_cus FROM dbo.${process.env.TABLE_CUSTOMER}`
    );
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/get-no-customer-edit", async (req, res) => {
  const { no_cus } = req.query;

  try {
    const result = await pool.query(
      `SELECT no_cus FROM dbo.${process.env.TABLE_CUSTOMER} WHERE no_cus != '${no_cus}'`
    );
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.get("/api/get-kode-area", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT kode_area FROM dbo.${process.env.TABLE_AREA}`
    );
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: "Database error" });
  }
});

app.post("/api/create-customer", upload.none(), async (req, res) => {
  const { no_cus, nama_cus, alias, no_seri, kode_area } = req.body;
  const now = dayjs();

  const transaction = new sql.Transaction(pool);
  try {
    await transaction.begin();
    const request = new sql.Request(transaction);

    const query = `
      INSERT INTO dbo.${
        process.env.TABLE_CUSTOMER
      } (no_cus, nama_cus, alias, no_seri, updated_at, created_by, kode_area)
      VALUES ('${no_cus}', '${nama_cus}', '${alias}', '${no_seri}', '${formatDateForSQL(
      now
    )}', '1', '${kode_area}')
    `;

    await request.query(query);
    await transaction.commit();
    res.json({ ok: true, message: "Customer inserted" });
  } catch (err) {
    console.error(err);
    try {
      await transaction.rollback();
      console.log("Transaction rolled back.");
    } catch (rollbackErr) {
      console.error("Error rolling back transaction:", rollbackErr);
    }

    if (err.name === "RequestError" && err.message.includes("Timeout")) {
      console.log("Detected a database request timeout.");
      // Use 408 Request Timeout for client-side handling
      res.status(408).json({
        ok: false,
        message: "Database operation timed out. Please try again.",
      });
    } else {
      // Handle all other types of database or logic errors
      console.log("Detected a general server error.");
      res.status(500).json({
        ok: false,
        message: "Failed to create contract due to a server error.",
        error: err.message,
      });
    }
  }
});

app.post("/api/edit-customer", upload.none(), async (req, res) => {
  const { id = "" } = req.query;
  const { no_cus, nama_cus, alias, no_seri, kode_area } = req.body;

  const now = dayjs();
  const transaction = new sql.Transaction(pool);
  try {
    await transaction.begin();
    const request = new sql.Request(transaction);

    const query = `
      UPDATE dbo.${
        process.env.TABLE_CUSTOMER
      } SET no_cus = '${no_cus}', nama_cus = '${nama_cus}', alias = '${alias}', no_seri = '${no_seri}', updated_at = '${formatDateForSQL(
      now
    )}', kode_area = '${kode_area}' WHERE id = '${id}'
    `;

    await request.query(query);
    await transaction.commit();
    res.json({ ok: true, message: "Customer updated" });
  } catch (err) {
    console.error(err);
    try {
      await transaction.rollback();
      console.log("Transaction rolled back.");
    } catch (rollbackErr) {
      console.error("Error rolling back transaction:", rollbackErr);
    }

    if (err.name === "RequestError" && err.message.includes("Timeout")) {
      console.log("Detected a database request timeout.");
      // Use 408 Request Timeout for client-side handling
      res.status(408).json({
        ok: false,
        message: "Database operation timed out. Please try again.",
      });
    } else {
      // Handle all other types of database or logic errors
      console.log("Detected a general server error.");
      res.status(500).json({
        ok: false,
        message: "Failed to create contract due to a server error.",
        error: err.message,
      });
    }
  }
});

// ==============================
// ==============================
app.use((req, res) => {
  res.status(404).json({ message: "Not found" });
});

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
  });
});
