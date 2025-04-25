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
} from "@mui/material";
import { ExpandMoreRounded, Grid4x4 } from "@mui/icons-material";

const Add = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    age: "",
    address: "",
    report: true,
  });

  const fetchDataAPI = async () => {
    const response = await fetch("http://localhost:3001/api/test", {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(`HTTP error: Status ${response.status}`);
    }

    const data = await response.json();

    return console.log(data[0]["NoInvoice"]);
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
          {/* Accordion 1 */}
          <Grid item size={12}>
            <Accordion>
              <AccordionSummary
                expandIcon={<ExpandMoreRounded />}
                aria-controls="panel1-content"
                id="panel1-header"
              >
                <Typography component="span" variant="h5">
                  Detail Pelanggan
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={5}>
                  {/* Row 1 */}
                  <Grid item size={{ xs: 6, md: 6 }}>
                    <InputLabel id="no_cus">No. Customer</InputLabel>
                    <TextField
                      labelId="no_cus"
                      variant="outlined"
                      fullWidth
                      value={formData.no_cus}
                      name="no_cus"
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item size={{ xs: 6, md: 6 }}>
                    <InputLabel id="no_seri">No. Seri</InputLabel>
                    <TextField
                      labelId="no_seri"
                      variant="outlined"
                      fullWidth
                      value={formData.no_seri}
                      name="no_seri"
                      onChange={handleChange}
                    />
                  </Grid>

                  {/* Row 2 */}
                  <Grid item size={{ xs: 12, md: 6 }}>
                    <InputLabel id="nama">Nama Pelanggan</InputLabel>
                    <TextField
                      labelId="nama"
                      variant="outlined"
                      fullWidth
                      value={formData.nama}
                      name="nama"
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item size={{ xs: 12, md: 6 }}>
                    <InputLabel id="alias">Alias</InputLabel>
                    <TextField
                      labelId="alias"
                      variant="outlined"
                      fullWidth
                      value={formData.alias}
                      name="alias"
                      onChange={handleChange}
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Grid>

          {/* Row 2 */}
          <Grid item size={{ xs: 12, md: 6 }}>
            <TextField
              label="Pelanggan"
              variant="outlined"
              fullWidth
              name="age"
              value={formData.age}
              onChange={handleChange}
            />
          </Grid>
          <Grid item size={{ xs: 12, md: 6 }}>
            {/* <InputLabel id="demo-simple-select-label">Batal Report</InputLabel> */}
            <Select
              labelId="demo-simple-select-label"
              label="Batal Report"
              name="report"
              variant="outlined"
              fullWidth
              value={formData.report}
              defaultValue={true}
              onChange={handleChange}
            >
              <MenuItem value={false}>Tidak</MenuItem>
              <MenuItem value={true}>Ya</MenuItem>
            </Select>
          </Grid>

          {/* Row 3 */}
          <Grid item size={{ xs: 12, md: 6 }}>
            <TextField
              label="Alias"
              variant="outlined"
              fullWidth
              name="age"
              value={formData.age}
              onChange={handleChange}
            />
          </Grid>
          <Grid item size={{ xs: 6, md: 3 }}>
            <TextField
              label="Kode Area"
              variant="outlined"
              fullWidth
              name="age"
              value={formData.age}
              onChange={handleChange}
            />
          </Grid>
          <Grid item size={{ xs: 6, md: 3 }}>
            <TextField
              label="Group"
              variant="outlined"
              fullWidth
              name="age"
              value={formData.age}
              onChange={handleChange}
            />
          </Grid>

          {/* Row 4 */}
          <Grid item size={{ xs: 12, md: 6 }}>
            <TextField
              label="Alamat"
              variant="outlined"
              fullWidth
              name="age"
              value={formData.age}
              onChange={handleChange}
            />
          </Grid>
          <Grid item size={{ xs: 12, md: 6 }}>
            <TextField
              label="Supervisor"
              variant="outlined"
              fullWidth
              name="age"
              value={formData.age}
              onChange={handleChange}
            />
          </Grid>

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
