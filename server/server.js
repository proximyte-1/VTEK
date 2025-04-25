import http from "http";
import sql from "mssql";
import { parse } from "url";
import { StringDecoder } from "string_decoder";
import { Buffer } from "buffer";
import { parseString } from "xml2js";

const config = {
  server: "applserver02.perdana.net.id",
  user: "vincent.marcelino",
  password: "Vincent1234", // your password
  database: "PJPNavisionExtension",
  options: {
    encrypt: false, // Set to true in production with SSL
    trustServerCertificate: true, // Only for development/testing
  },
};

// NAV OData config
const navOptions = {
  hostname: "192.168.3.3",
  // port: 5002,
  // path: "/TEST/WS/PT.%20Perdana%20Jatiputra/Page/customer_list",
  port: 5003,
  path: "/TEST/OData/Company('PT.%20Perdana%20Jatiputra')/customer_list",
  method: "GET",
  headers: {
    Accept: "application/json",
    Authorization:
      "Basic " +
      Buffer.from("vincent.marcelino:vincent1234").toString("base64"), // ← replace with real credentials
  },
};

// Create server
const server = http.createServer((req, res) => {
  // DB connection
  const parsedUrl = parse(req.url, true);
  const method = req.method;
  const path = parsedUrl.pathname.replace(/^\/+|\/+$/g, "");
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

    if (method === "GET" && path === "api/test") {
      const result =
        await sql.query`SELECT TOP (1000) [NoInvoice] ,[lokasiInvoice] ,[lokasiTaxInvoice] ,[lokasiBilling] ,[lokasiCounterList] ,[tglGabungTaxInvoice] ,[statusGabungTaxInvoice] ,[jumlahGabungTaxInvoice] FROM [PJPNavisionExtension].[dbo].[PenggabunganTaxInvoice]`;
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify(result.recordset));
    }

    // Route: NAV OData proxy
    if (method === "GET" && path === "api/nav-data") {
      // const proxyReq = http.request(navOptions, (proxyRes) => {
      //   res.writeHead(proxyRes.statusCode, {
      //     "Content-Type": "application/json",
      //     "Access-Control-Allow-Origin": "*", // CORS header again for safety
      //   });

      //   proxyRes.pipe(res);
      // });

      // proxyReq.on("error", (err) => {
      //   console.error("Error fetching NAV data:", err);
      //   res.writeHead(500);
      //   res.end(JSON.stringify({ error: "Failed to fetch NAV data" }));
      // });

      // return proxyReq.end();
      // // -------------------

      const proxyReq = http.request(navOptions, (proxyRes) => {
        let xml = "";

        proxyRes.on("data", (chunk) => {
          xml += chunk.toString();
        });

        proxyRes.on("end", () => {
          parseString(xml, { explicitArray: false }, (err, result) => {
            if (err) {
              console.error("XML parsing error:", err);
              res.writeHead(500);
              return res.end(
                JSON.stringify({ error: "Failed to parse NAV XML" })
              );
            }

            res.writeHead(200, { "Content-Type": "application/json" });
            console.log(JSON.stringify(result));
            res.end(JSON.stringify(result));
          });
        });
      });

      proxyReq.on("error", (err) => {
        console.error("Error fetching NAV data:", err);
        res.writeHead(500);
        res.end(JSON.stringify({ error: "Failed to fetch NAV data" }));
      });

      return proxyReq.end();
    }

    // Fallback: Not found
    res.writeHead(404);
    res.end(JSON.stringify({ message: "Not found" }));
  });
});

server.listen(3001, () => {
  console.log("Server running on http://localhost:3001");
});
