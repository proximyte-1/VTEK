import http from "http";
import sql from "mssql";
import { parse } from "url";
import { StringDecoder } from "string_decoder";
import xml2js from "xml2js";
import httpntlm from "httpntlm";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

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

// Create server
const server = http.createServer((req, res) => {
  // DB connection
  const parsedUrl = parse(req.url, true);
  const method = req.method;
  const path = parsedUrl.pathname.replace(/^\/+|\/+$/g, "");
  const query = parsedUrl.query;
  const decoder = new StringDecoder("utf-8");
  let buffer = "";

  req.on("data", (chunk) => (buffer += decoder.write(chunk)));
  req.on("end", async () => {
    await sql.connect(config);
    buffer += decoder.end();

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

    if (method === "GET" && path === "api/get-flk") {
      const result = await sql.query`SELECT * FROM dbo.WebVTK`;
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify(result.recordset));
    }

    if (method === "GET" && path === "api/get-rep-by-cus") {
      const id_cus = query.id_cus;
      const result =
        await sql.query`SELECT TOP 1 status_rep, rep_ke FROM dbo.WebVTK WHERE no_cus = '${id_cus}' ORDER BY id DESC`;
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify(result.recordset));
    }
    if (method === "GET" && path === "api/get-flk-one-by-id") {
      const id = query.id;
      const result = await sql.query`SELECT * FROM dbo.WebVTK WHERE id = ${id}`;
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify(result.recordset));
    }

    if (method === "GET" && path === "api/get-no-rep") {
      const result = await sql.query`SELECT * FROM dbo.WebVTK`;
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
      const id = query.id;
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
      const navURL = process.env.NAV_WS_URL + navFilterEncode("Serial_No", id);

      fetchNavData(navURL, (err, data) => {
        if (err) {
          res.writeHead(err.status, { "Content-Type": "application/json" });
          res.end(JSON.stringify(err));
          return;
        }

        console.log(data);

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
      try {
        const data = JSON.parse(buffer);

        // const { nama, no_report, jam_dtg } = data;

        // const result = await sql.query`
        // INSERT INTO PJPNavisionExtension.dbo.WbVtk (nama, no_report, jam_dtg)
        // VALUES (${nama}, ${no_report}, ${jam_dtg})
        // `;

        const {
          no_rep,
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

        const result = await sql.query`
                  INSERT INTO [dbo].[WebVTK] (
            no_rep, no_cus, no_call, pelapor, waktu_call, waktu_dtg, status_call,
            keluhan, kat_keluhan, problem, kat_problem, solusi, waktu_mulai,
            waktu_selesai, count_bw, count_cl, saran, status_res, rep_ke
        )
        VALUES (
            ${no_rep}, ${no_cus}, ${no_call}, ${pelapor}, ${waktu_call}, ${waktu_dtg}, ${status_call},
            ${keluhan}, ${kat_keluhan}, ${problem}, ${kat_problem}, ${solusi}, ${waktu_mulai},
            ${waktu_selesai}, ${count_bw}, ${count_cl}, ${saran}, ${status_res}, ${rep_ke}
        );

                `;

        res.writeHead(200);
        return res.end(
          JSON.stringify({
            ok: true,
            status: 1,
            data: result.recordset,
            message: "Data inserted successfully",
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
            message: "Insert failed",
          })
        );
      }
    }

    if (method === "POST" && path === "api/edit-flk") {
      const id = query.id;
      try {
        const data = JSON.parse(buffer);

        console.log(data);

        const {
          no_rep,
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

        const result = await sql.query`
            UPDATE [dbo].[WebVTK]
            SET 
                no_rep = ${no_rep},
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
    res.writeHead(404);
    res.end(JSON.stringify({ message: "Not found" }));
  });
});

server.listen(process.env.PORT, () => {
  const text = "Server running on http://localhost:" + String(process.env.PORT);
  console.log(text);
});
