import React, { useState } from "react";
import {
  TextField,
  Button,
  Grid,
  Typography,
  Paper,
  useTheme,
  useMediaQuery,
  Select,
  MenuItem,
  InputLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Input,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";
import { ExpandMoreRounded, Grid4x4 } from "@mui/icons-material";

import { Buffer } from "buffer";

const Add = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    age: "",
    address: "",
    report: false,
  });

  function createData(kode_part, nama_part, c, qty, harga, total) {
    return { kode_part, nama_part, c, qty, harga, total };
  }

  const rows = [
    createData("A5AW728500", "FU BELT", "A", 1, 200.0, 200.0),
    createData("A5AW728500", "FU BELT", "A", 2, 200.0, 400.0),
    createData("A5AW728500", "FU BELT", "A", 1, 400.0, 400.0),
    createData("A5AW728500", "FU BELT", "A", 2, 150.0, 300.0),
    createData("A5AW728500", "FU BELT", "A", 1, 200.0, 200.0),
  ];

  const fetchDataAPI = async () => {
    const response = await fetch("http://localhost:5173/api/nav-data", {
      method: "GET",
      // headers: {
      //   Authorization:
      //     "Basic " +
      //     Buffer.from(`vincent.marcelino:vincent1234`).toString("base64"), // Replace with your credentials
      //   Accept: "application/json",
      // },
    })
      .then((data) => console.log("NAV Data:", data))
      .catch((err) => console.error("Proxy error:", err));

    if (!response.ok) {
      throw new Error(`HTTP error: Status ${response.status}`);
    }

    // const data = await response.json();

    return console.log(response);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchDataAPI();
    setFormData({ name: "", email: "", age: "", address: "" }); // Clear form after submit
  };

  // Theme and media query for responsiveness
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Paper sx={{ padding: 3 }} elevation={4}>
      <Typography variant="h5" marginBottom={"1.5em"} gutterBottom>
        Form Laporan Kerja
      </Typography>
      <form onSubmit={handleSubmit}>
        <Grid container spacing={5} marginY={"2em"} alignItems="center">
          {/* Input Report */}
          <Grid item size={{ xs: 12, md: 6 }}>
            <TextField
              label="No. Report"
              variant="outlined"
              fullWidth
              value={formData.no_report}
              name="no_report"
              onChange={handleChange}
            />
          </Grid>
          <Grid item size={{ xs: 12, md: 6 }}>
            <Button type="button" variant="contained" color="primary">
              Search
            </Button>
          </Grid>
        </Grid>
        <Grid container spacing={5}>
          {/* Submit Button */}
          <Grid item size={{ xs: 12, md: 12 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              sx={{ width: isSmallScreen ? "100%" : "auto" }}
            >
              Submit
            </Button>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
};

export default Add;
