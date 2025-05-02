import React, { useEffect, useState } from "react";
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
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Link,
  CircularProgress,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { ExpandMoreRounded } from "@mui/icons-material";
import { format } from "date-fns";

const Add = () => {
  const [formData, setFormData] = useState({
    no_rep: "",
    no_call: "",
    pelapor: "",
    waktu_call: null,
    waktu_dtg: null,
    status_call: "",
    keluhan: "",
    kat_keluhan: "",
    problem: "",
    kat_problem: "",
    solusi: "",
    waktu_mulai: null,
    waktu_selesai: null,
    count_bw: "",
    saran: "",
    status_res: "",
    rep_ke: "",
  });

  const selectStatusCall = {
    GR: "Garansi",
    KS: "Kontrak Servis",
    TST: "Tunjangan Servis Total",
    RT: "Rental",
    Chg: "Charge",
  };

  const selectKeluhan = {
    P_JAM: "Paper Jam",
    COPY_Q: "Copy Quality",
    M_ADJUST: "Machine Adjustment",
    ELECT: "Electrical",
    MACH: "Machine",
  };

  const selectProblem = {
    REPLACE: "Replace",
    CLEAN: "Clean",
    LUB: "Lubric",
    ADJUST: "Adjustment",
    REPAIR: "Repair",
  };

  const selectStatusResult = {
    OK: "OK",
    CONT: "Continue",
    TS: "Technical Support",
    SS: "Software Support",
  };

  const [barang, setDataBarang] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data_no_rep, setDataNoRep] = useState([]);
  const [statusRes, setStatusRes] = useState([]);
  const [alert, setAlert] = useState({
    open: false,
    message: "",
    severity: "success", // 'success', 'error', 'warning', 'info'
  });

  useEffect(() => {
    async function fetchNoRep() {
      try {
        const response = await fetch("http://localhost:3001/api/get-no-rep");
        const data = await response.json();
        setDataNoRep(data); // <-- set the array into state
      } catch (error) {
        console.error("Error fetching No Report:", error);
      }
    }

    fetchNoRep();
  }, []);

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

    if (e.target.name === "status_res") {
      setStatusRes(e.target.value);
    }
  };

  async function fetchDataBarang() {
    try {
      const response = await fetch("http://localhost:3001/api/get-flk");
      const data = await response.json();
      setDataBarang(data); // <-- set the array into state
    } catch (error) {
      console.error("Error fetching barang:", error);
    }
  }

  const handleSearch = () => {
    setLoading(true);

    if (formData.no_rep === "" || formData.no_rep === null) {
      showAlert("Nomor Report Tidak Diperbolehkan Kosong.", "error");
      setSearched(false);
      setLoading(false);
    } else if (data_no_rep.some((item) => item.no_report === formData.no_rep)) {
      showAlert("Nomor Report Sudah Pernah Dipakai.", "error");
      setSearched(false);
      setLoading(false);
    } else {
      fetchDataBarang();
      showAlert("Nomor Report Belum Dipakai.", "success");
      setLoading(false);
      setSearched(true);
    }
  };

  const handleDateChange = (field, newDate) => {
    setFormData({
      ...formData,
      [field]: newDate,
    });
  };

  function displayValue(value) {
    return value === null || value === undefined || value == "" ? "-" : value;
  }

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
          waktu_call: formData.waktu_call.toISOString(),
          waktu_dtg: formData.waktu_dtg.toISOString(),
          waktu_mulai: formData.waktu_mulai.toISOString(),
          waktu_selesai: formData.waktu_selesai.toISOString(),
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
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="No. Report"
                variant="outlined"
                fullWidth
                value={formData.no_rep}
                name="no_rep"
                onChange={handleChange}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
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
              {/* Accordion 1 - Non Input */}
              <Grid size={12}>
                <Accordion disabled={!searched || !formData.no_rep}>
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
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Typography>No. Pelanggan :</Typography>
                        <Typography>Nama Pelanggan :</Typography>
                        <Typography>Alias :</Typography>
                        <Typography>Alamat :</Typography>
                        <Typography>Penanggung Jawab :</Typography>
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Typography>No. Seri :</Typography>
                        <Grid>
                          <Typography>Kode Area :</Typography>
                          <Typography>Group :</Typography>
                        </Grid>
                        <Typography>Supervisor :</Typography>
                        <Typography>Teknisi :</Typography>
                        <Typography>C.S.O :</Typography>
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              </Grid>

              {/* Accordion 2 - Non Input */}
              <Grid size={12}>
                <Accordion disabled={!searched || !formData.no_rep}>
                  <AccordionSummary
                    expandIcon={<ExpandMoreRounded />}
                    aria-controls="panel1-content"
                    id="panel1-header"
                  >
                    <Typography component="span" variant="h5">
                      Detail Mesin
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={5}>
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Typography>Kode Mesin :</Typography>
                        <Typography>Seri :</Typography>
                        <Typography>Rangka :</Typography>
                      </Grid>

                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Typography>Type :</Typography>
                        <Typography>Tanggal Instalasi :</Typography>
                        <Typography>Tanggal Kontrak :</Typography>
                      </Grid>

                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Typography>Type Service :</Typography>
                        <Typography>Masa :</Typography>
                        <Typography>Tanggal Akhir Service :</Typography>
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              </Grid>

              {/* Accordion 3 */}
              <Grid size={12}>
                <Accordion disabled={!searched || !formData.no_rep}>
                  <AccordionSummary
                    expandIcon={<ExpandMoreRounded />}
                    aria-controls="panel1-content"
                    id="panel1-header"
                  >
                    <Typography component="span" variant="h5">
                      Detail Call
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={5}>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Typography
                          sx={{ color: "rgba(0, 0, 0, 0.6)" }}
                          id="no_call"
                        >
                          No. Call
                        </Typography>
                        <TextField
                          variant="outlined"
                          fullWidth
                          value={formData.no_call}
                          name="no_call"
                          onChange={handleChange}
                        />
                      </Grid>

                      <Grid size={{ xs: 12, md: 6 }}>
                        <Typography
                          sx={{ color: "rgba(0, 0, 0, 0.6)" }}
                          id="pelapor"
                        >
                          Nama Pelapor
                        </Typography>
                        <TextField
                          variant="outlined"
                          fullWidth
                          value={formData.pelapor}
                          name="pelapor"
                          onChange={handleChange}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <InputLabel id="waktu_call">Waktu Call</InputLabel>
                        <DateTimePicker
                          labelId="waktu_call"
                          value={formData.waktu_call}
                          slotProps={{ textField: { fullWidth: true } }}
                          onChange={(newValue) =>
                            handleDateChange("waktu_call", newValue)
                          }
                          ampm={false}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <InputLabel id="waktu_dtg">Waktu Datang</InputLabel>
                        <DateTimePicker
                          labelId="waktu_dtg"
                          value={formData.waktu_dtg}
                          slotProps={{ textField: { fullWidth: true } }}
                          onChange={(newValue) =>
                            handleDateChange("waktu_dtg", newValue)
                          }
                          ampm={false}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <FormControl fullWidth required>
                          <Typography sx={{ color: "rgba(0, 0, 0, 0.6)" }}>
                            Status Call
                          </Typography>
                          <Select
                            name="status_call"
                            value={formData.status_call}
                            onChange={handleChange}
                            variant="outlined"
                            // displayEmpty
                            // renderValue={(selected) => {
                            //   if (selected.length === 0) {
                            //     return <em>Pilih Kategori Status Call</em>;
                            //   }

                            //   return selected. ;
                            // }}
                          >
                            <MenuItem disabled value="">
                              <em>Pilih Kategori Status Call</em>
                            </MenuItem>
                            {Object.keys(selectStatusCall).map((key) => (
                              <MenuItem value={key} key={key}>
                                {displayValue(key)} -{" "}
                                {displayValue(selectStatusCall[key])}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Typography
                          sx={{ color: "rgba(0, 0, 0, 0.6)" }}
                          id="keluhan"
                        >
                          Keluhan
                        </Typography>
                        <TextField
                          variant="outlined"
                          fullWidth
                          value={formData.keluhan}
                          name="keluhan"
                          onChange={handleChange}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <FormControl fullWidth required>
                          <Typography sx={{ color: "rgba(0, 0, 0, 0.6)" }}>
                            Kategori Keluhan
                          </Typography>
                          <Select
                            name="kat_keluhan"
                            value={formData.kat_keluhan}
                            onChange={handleChange}
                            variant="outlined"
                          >
                            <MenuItem disabled value="">
                              <em>Pilih Kategori Keluhan</em>
                            </MenuItem>
                            {Object.keys(selectKeluhan).map((key) => (
                              <MenuItem value={key} key={key}>
                                {displayValue(selectKeluhan[key])}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              </Grid>

              {/* Accordion 4 */}
              <Grid size={12}>
                <Accordion disabled={!searched || !formData.no_rep}>
                  <AccordionSummary
                    expandIcon={<ExpandMoreRounded />}
                    aria-controls="panel1-content"
                    id="panel1-header"
                  >
                    <Typography component="span" variant="h5">
                      Detail Report
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={5}>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Typography
                          sx={{ color: "rgba(0, 0, 0, 0.6)" }}
                          id="problem"
                        >
                          Problem
                        </Typography>
                        <TextField
                          variant="outlined"
                          fullWidth
                          value={formData.problem}
                          name="problem"
                          onChange={handleChange}
                        />
                      </Grid>

                      <Grid size={{ xs: 12, md: 6 }}>
                        <FormControl fullWidth required>
                          <Typography sx={{ color: "rgba(0, 0, 0, 0.6)" }}>
                            Kategori Problem
                          </Typography>
                          <Select
                            name="kat_problem"
                            value={formData.kat_problem}
                            onChange={handleChange}
                            variant="outlined"
                          >
                            <MenuItem disabled value="">
                              <em>Pilih Kategori Problem</em>
                            </MenuItem>
                            {Object.keys(selectProblem).map((key) => (
                              <MenuItem value={key} key={key}>
                                {displayValue(selectProblem[key])}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>

                      <Grid size={{ xs: 12, md: 6 }}>
                        <Typography
                          sx={{ color: "rgba(0, 0, 0, 0.6)" }}
                          id="solusi"
                        >
                          Solusi
                        </Typography>
                        <TextField
                          variant="outlined"
                          fullWidth
                          value={formData.solusi}
                          name="solusi"
                          onChange={handleChange}
                        />
                      </Grid>

                      <Grid size={{ xs: 12, md: 6 }}>
                        <InputLabel id="waktu_mulai">Waktu Mulai</InputLabel>
                        <DateTimePicker
                          labelId="waktu_mulai"
                          value={formData.waktu_mulai}
                          slotProps={{ textField: { fullWidth: true } }}
                          onChange={(newValue) =>
                            handleDateChange("waktu_mulai", newValue)
                          }
                          ampm={false}
                        />
                      </Grid>

                      <Grid size={{ xs: 12, md: 6 }}>
                        <InputLabel id="waktu_selesai">
                          Waktu Selesai
                        </InputLabel>
                        <DateTimePicker
                          labelId="waktu_selesai"
                          value={formData.waktu_selesai}
                          slotProps={{ textField: { fullWidth: true } }}
                          onChange={(newValue) =>
                            handleDateChange("waktu_selesai", newValue)
                          }
                          ampm={false}
                        />
                      </Grid>

                      <Grid size={{ xs: 12, md: 6 }}>
                        <Typography
                          sx={{ color: "rgba(0, 0, 0, 0.6)" }}
                          id="count_bw"
                        >
                          Counter B/W
                        </Typography>
                        <TextField
                          variant="outlined"
                          fullWidth
                          value={formData.count_bw}
                          name="count_bw"
                          onChange={handleChange}
                        />
                      </Grid>

                      <Grid size={{ xs: 12, md: 6 }}>
                        <Typography
                          sx={{ color: "rgba(0, 0, 0, 0.6)" }}
                          id="count_cl"
                        >
                          Counter CL
                        </Typography>
                        <TextField
                          variant="outlined"
                          fullWidth
                          value={formData.count_cl}
                          name="count_cl"
                          onChange={handleChange}
                        />
                      </Grid>

                      <Grid size={{ xs: 12, md: 6 }}>
                        <Typography
                          sx={{ color: "rgba(0, 0, 0, 0.6)" }}
                          id="saran"
                        >
                          Saran
                        </Typography>
                        <TextField
                          variant="outlined"
                          fullWidth
                          value={formData.saran}
                          name="saran"
                          onChange={handleChange}
                        />
                      </Grid>

                      <Grid size={{ xs: 12, md: 6 }}>
                        <FormControl fullWidth required>
                          <Typography sx={{ color: "rgba(0, 0, 0, 0.6)" }}>
                            Status Result
                          </Typography>
                          <Select
                            name="status_res"
                            value={formData.status_res}
                            onChange={handleChange}
                            variant="outlined"
                          >
                            <MenuItem disabled value="">
                              <em>Pilih Status Result</em>
                            </MenuItem>
                            {Object.keys(selectStatusResult).map((key) => (
                              <MenuItem value={key} key={key}>
                                {displayValue(selectStatusResult[key])}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>

                      {statusRes === "CONT" && (
                        <Grid size={{ xs: 12, md: 6 }}>
                          <Typography
                            sx={{ color: "rgba(0, 0, 0, 0.6)" }}
                            id="rep_ke"
                          >
                            Report Ke-
                          </Typography>
                          <TextField
                            variant="outlined"
                            fullWidth
                            value={formData.rep_ke}
                            name="rep_ke"
                            onChange={handleChange}
                          />
                        </Grid>
                      )}
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              </Grid>

              {/* Accordion 5 */}
              <Grid size={12}>
                <Accordion disabled={!searched || !formData.no_rep}>
                  <AccordionSummary
                    expandIcon={<ExpandMoreRounded />}
                    aria-controls="panel1-content"
                    id="panel1-header"
                  >
                    <Typography component="span" variant="h5">
                      Detail Barang
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {/* Table */}
                    <TableContainer sx={{ padding: 3 }} component={Paper}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>No.</TableCell>
                            <TableCell>Kode Part</TableCell>
                            <TableCell>Nama Part/ Cosumable</TableCell>
                            <TableCell>C</TableCell>
                            <TableCell>Quantity</TableCell>
                            <TableCell>Harga</TableCell>
                            <TableCell>Total</TableCell>
                            <TableCell>Action</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {barang.length > 0 ? (
                            barang.map((item, index) => (
                              <TableRow key={index}>
                                <TableCell>{index + 1}</TableCell>
                                <TableCell>{displayValue(item.id)}</TableCell>
                                <TableCell>{displayValue(item.nama)}</TableCell>
                                <TableCell>
                                  {displayValue(item.no_report)}
                                </TableCell>
                                <TableCell>
                                  {displayValue(
                                    item.jam_dtg
                                      ? format(
                                          new Date(item.jam_dtg),
                                          "yyyy-MM-dd HH:mm"
                                        )
                                      : "-"
                                  )}
                                </TableCell>
                                <TableCell>Harga</TableCell>
                                <TableCell>Total</TableCell>
                                <TableCell>
                                  <Link to="/add">
                                    <Button
                                      variant="contained"
                                      color="error"
                                      style={{ marginTop: "20px" }}
                                    >
                                      Delete
                                    </Button>
                                  </Link>
                                </TableCell>
                              </TableRow>
                            ))
                          ) : (
                            <TableRow>
                              <TableCell colSpan={5} align="center">
                                No data found.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </AccordionDetails>
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
            <Grid size={{ xs: 12, md: 12 }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={!searched || !formData.no_rep}
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
