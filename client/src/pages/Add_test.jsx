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
  FormControl,
  Alert,
  Snackbar,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { ExpandMoreRounded, Grid4x4 } from "@mui/icons-material";

const Add = () => {
  const [formData, setFormData] = useState({
    no: "",
    nama: "",
    no_report: "",
    jam_dtg: new Date(),
    status: "Active",
  });

  // Options where some values should show the additional field
  const showAdditionalFieldValues = ["Pending"];

  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState({
    open: false,
    message: "",
    severity: "success", // 'success', 'error', 'warning', 'info'
  });

  const showAlert = (message, severity) => {
    setAlert({
      open: true,
      message,
      severity,
    });
  };

  const handleCloseAlert = () => {
    setAlert((prev) => ({ ...prev, open: false }));
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSearch = () => {
    setLoading(true);

    if (formData.no === "" || formData.no === null) {
      showAlert("Nomor Report Tidak Diperbolehkan Kosong.", "error");
      setSearched(false);
      setLoading(false);
    } else if (formData.no === "123") {
      showAlert("Nomor Report Sudah Pernah Dipakai.", "error");
      setSearched(false);
      setLoading(false);
    } else {
      showAlert("Nomor Report Belum Dipakai.", "success");
      setLoading(false);
      setSearched(true);
    }
  };

  const handleDateChange = (newDate) => {
    setFormData({
      ...formData,
      jam_dtg: newDate,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const response = await fetch("http://localhost:3001/api/create-flk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          jam_dtg: formData.jam_dtg.toISOString(), // Send ISO format datetime
        }),
      });

      const result = await response.json();
      console.log(result);

      if (response.ok) {
        alert("Data submitted successfully!");
      } else {
        alert("Failed to submit data.");
      }
    } catch (error) {
      console.error("Error submitting data:", error);
      alert("Something went wrong.");
    }
  };

  // Theme and media query for responsiveness
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Paper sx={{ padding: 3 }} elevation={4}>
      <Typography variant="h5" marginBottom={"1.5em"} gutterBottom>
        Form Laporan Kerja
      </Typography>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={5} marginY={"2em"} alignItems="center">
            {/* Input Report */}
            <Grid item size={{ xs: 12, md: 6 }}>
              <TextField
                label="No. Report"
                variant="outlined"
                fullWidth
                value={formData.no}
                name="no"
                onChange={handleChange}
              />
            </Grid>
            <Grid item size={{ xs: 12, md: 6 }}>
              <Button
                type="button"
                name="search"
                id="search"
                variant="contained"
                color="primary"
                onClick={handleSearch}
              >
                {loading ? <CircularProgress size={24} /> : "Search"}
              </Button>
            </Grid>
            <Grid container spacing={5}>
              {/* Accordion 1 */}
              <Grid item size={12}>
                <Accordion disabled={!searched || !formData.no}>
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
                        <InputLabel id="no_report">No. Customer</InputLabel>
                        <TextField
                          labelId="no_report"
                          variant="outlined"
                          fullWidth
                          value={formData.no_report}
                          name="no_report"
                          onChange={handleChange}
                        />
                      </Grid>
                      <Grid item size={{ xs: 6, md: 6 }}>
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

                      {/* Row 2 */}
                      <Grid item size={{ xs: 12, md: 6 }} fullWidth>
                        <InputLabel id="jam_dtg">Jam Datang</InputLabel>
                        <DateTimePicker
                          labelId="jam_dtg"
                          value={formData.jam_dtg}
                          slotProps={{ textField: { fullWidth: true } }}
                          onChange={handleDateChange}
                          ampm={false}
                          renderInput={(params) => (
                            <TextField {...params} required />
                          )}
                        />
                      </Grid>

                      <Grid item size={{ xs: 12, md: 6 }}>
                        <FormControl fullWidth required>
                          <Typography sx={{ color: "rgba(0, 0, 0, 0.6)" }}>
                            Status
                          </Typography>
                          <Select
                            name="status"
                            value={formData.status}
                            onChange={handleChange}
                            variant="outlined"
                          >
                            <MenuItem value="Active">Active</MenuItem>
                            <MenuItem value="Inactive">Inactive</MenuItem>
                            <MenuItem value="Pending">Pending</MenuItem>
                          </Select>
                        </FormControl>
                      </Grid>

                      {/* Row 3 */}
                      {showAdditionalFieldValues.includes(formData.status) && (
                        <Grid item size={{ xs: 6, md: 6 }}>
                          <InputLabel id="test_dis">Test Hidden Com</InputLabel>
                          <TextField
                            labelId="test_dis"
                            variant="outlined"
                            fullWidth
                            value={formData.test_dis}
                            name="test_dis"
                            hidden="true"
                            onChange={handleChange}
                            required={showAdditionalFieldValues.includes(
                              formData.status
                            )}
                          />
                        </Grid>
                      )}
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              </Grid>

              {/* Accordion 2 */}
              <Grid item size={12}>
                <Accordion>
                  <AccordionSummary
                    expandIcon={<ExpandMoreRounded />}
                    aria-controls="panel1-content"
                    id="panel1-header"
                  >
                    <Typography component="span" variant="h5">
                      Detail Mesin
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails></AccordionDetails>
                </Accordion>
              </Grid>
            </Grid>
          </Grid>

          {/* Alert notifications */}
          <Snackbar
            open={alert.open}
            autoHideDuration={5000}
            onClose={handleCloseAlert}
            anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
          >
            <Alert
              onClose={handleCloseAlert}
              variant="filled"
              severity={alert.severity}
              fontSize="inherit"
              sx={{ width: "100%" }}
            >
              {alert.message}
            </Alert>
          </Snackbar>

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
      </LocalizationProvider>
    </Paper>
  );
};

export default Add;
