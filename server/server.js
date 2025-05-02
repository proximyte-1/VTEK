import http from "http";
import sql from "mssql";
import { parse } from "url";
import { StringDecoder } from "string_decoder";
import axios from "axios";
import xml2js from "xml2js";
import { Buffer } from "buffer";

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

const url =
  "http://applserver02.perdana.net.id:5002/TEST/WS/PT.%20Perdana%20Jatiputra/Page/customer_list";

// Your SOAP envelope
const soapEnvelope = `
<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
               xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
               xmlns:xsd="http://www.w3.org/2001/XMLSchema">
  <soap:Body>
    <ReadMultiple xmlns="urn:microsoft-dynamics-schemas/page/customer_list">
    </ReadMultiple>
  </soap:Body>
</soap:Envelope>
`;

const fetchSOAPData = async () => {
  axios
    .post(url, soapEnvelope, {
      headers: {
        "Content-Type": "text/xml",
        SOAPAction:
          "urn:microsoft-dynamics-schemas/page/customer_list:ReadMultiple",
      },
      auth: {
        username: "your_username", // Use full domain\username if needed
        password: "your_password",
      },
    })
    .then((res) => {
      xml2js.parseString(res.data, { explicitArray: false }, (err, result) => {
        if (err) return console.error("Parse error:", err);
        console.log(JSON.stringify(result, null, 2));
      });
    })
    .catch((err) => {
      console.error("Request error:", err.message);
    });
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

    if (method === "GET" && path === "api/get-flk") {
      const result =
        await sql.query`SELECT * FROM PJPNavisionExtension.dbo.WbVtk`;
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify(result.recordset));
    }

    if (method === "GET" && path === "api/get-no-rep") {
      const result =
        await sql.query`SELECT no_report FROM PJPNavisionExtension.dbo.WbVtk`;
      res.writeHead(200, { "Content-Type": "application/json" });
      fetchSOAPData();
      return res.end(JSON.stringify(result.recordset));
    }

    if (method === "POST" && path === "api/create-flk") {
      try {
        const data = JSON.parse(buffer);

        console.log(data);

        const { nama, no_report, jam_dtg } = data;

        const result = await sql.query`
          INSERT INTO PJPNavisionExtension.dbo.WbVtk (nama, no_report, jam_dtg)
          VALUES (${nama}, ${no_report}, ${jam_dtg})
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

    // Fallback: Not found
    res.writeHead(404);
    res.end(JSON.stringify({ message: "Not found" }));
  });
});

server.listen(3001, () => {
  console.log("Server running on http://localhost:3001");
});
