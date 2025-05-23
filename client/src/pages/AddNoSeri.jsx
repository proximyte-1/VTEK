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
  InputAdornment,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { ExpandMoreRounded } from "@mui/icons-material";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import NumberFormatTextField from "../components/NumberFormatTextField/NumberFormatTextField";

const AddNoSeri = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    no_seri: "",
    no_cus: "",
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
    count_cl: "",
    saran: "",
    status_res: "",
    rep_ke: 0,
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

  const [customer, setDataCustomer] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusRes, setStatusRes] = useState([]);
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

  // useEffect(() => {
  //   async function fetchNoSeri() {
  //     try {
  //       const response = await fetch(
  //         import.meta.env.VITE_API_URL + `api/get-no-rep`
  //       );
  //       const data = await response.json();
  //       setDataNoRep(data);
  //     } catch (error) {
  //       console.error("Error fetching No Seri:", error);
  //     }
  //   }

  //   fetchNoSeri();
  // }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    if (e.target.name === "status_res") {
      setStatusRes(e.target.value);
    }
  };

  async function fetchDataCustomer(id) {
    try {
      const fetch_customer = await fetch(
        import.meta.env.VITE_API_URL + `api/nav-data-noseri?id=${id}`
      );
      const data = await fetch_customer.json();

      if (data.length <= 0) {
        showAlert("Nomor Seri Belum Ada Pada Navision !", "error");
        setSearched(false);
        return null;
      } else {
        showAlert("Nomor Seri Tersedia", "success");
        setSearched(true);
        setDataCustomer(data[0]);
        return data[0]; // return the customer data
      }
    } catch (error) {
      console.error("Error fetching customer:", error);
      return null;
    }
  }

  const fetchContRes = async (id_cus, value) => {
    const response = await fetch(
      import.meta.env.VITE_API_URL +
        `api/get-rep-seri-by-cus?id_cus=${id_cus}&field=no_seri&value=${value}`
    );
    const data = await response.json();

    if (data.length <= 0) {
      return;
    }

    const incre = data[0]["rep_ke"] + 1;

    if (data[0]["status_res"] === "CONT") {
      setFormData({
        ...formData,
        rep_ke: incre,
      });
    }
  };

  const handleSearch = async () => {
    setLoading(true);

    if (!formData.no_seri) {
      showAlert("Nomor Seri Tidak Diperbolehkan Kosong.", "error");
      setSearched(false);
      setLoading(false);
    } else {
      try {
        const customer = await fetchDataCustomer(formData.no_seri); // await and get the result directly

        if (customer) {
          await fetchContRes(
            customer["d:Sell_to_Customer_No"],
            formData.no_seri
          );
        }
      } catch (error) {
        console.error("Error in handleSearch:", error);
      }

      setLoading(false);
    }
  };

  const handleDateChange = (field, newDate) => {
    const now = dayjs();
    const diffInDays = now.diff(dayjs(newDate), "day");

    if (diffInDays > import.meta.env.BACKDATE_DAYS) {
      showAlert("Waktu tidak boleh lebih dari 30 hari di belakang!", "error");
    } else {
      if (field == "waktu_selesai" && formData.waktu_mulai) {
        const datang = dayjs(formData.waktu_mulai);
        const selesai = dayjs(newDate);

        if (selesai.isBefore(datang)) {
          showAlert(
            "Waktu selesai tidak boleh lebih awal dari waktu mulai.",
            "error"
          );
          return;
        }
      }

      if (field == "waktu_dtg" && formData.waktu_call) {
        const call = dayjs(formData.waktu_call);
        const dtg = dayjs(newDate);

        if (dtg.isBefore(call)) {
          showAlert(
            "Waktu Penjadwalan tidak boleh lebih awal dari waktu call.",
            "error"
          );
          return;
        }
      }

      setFormData({
        ...formData,
        [field]: newDate,
      });
    }
  };

  const displayValue = (data) => {
    if (typeof data === "string") return data.trim();
    if (typeof data === "object" && "_" in data) return String(data._).trim();
    if (data === null || data === undefined || data == "") return "-";
    return "-";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const now = dayjs();

    try {
      const response = await fetch(
        import.meta.env.VITE_API_URL + `api/create-flk`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...formData,
            rep_ke: formData.status_res === "CONT" ? formData.rep_ke : null,
            waktu_call: formData.waktu_call.toISOString(),
            waktu_dtg: formData.waktu_dtg.toISOString(),
            waktu_mulai: formData.waktu_mulai.toISOString(),
            waktu_selesai: formData.waktu_selesai.toISOString(),
            no_cus: customer["d:Sell_to_Customer_No"],
            type: "2",
            created_by: "1",
            created_at: now.toISOString(),
          }),
        }
      );

      const result = await response.json();

      if (response.ok) {
        // Redirect to homepage after successful submission
        navigate("/flk-no-barang", {
          state: {
            message: "Data Form Laporan Kerja Berhasil Ditambahkan!",
            severity: "success",
          },
        });
      } else {
        showAlert("Failed to submit data!", "error");
      }
    } catch (error) {
      console.error("Error submitting data:", error);
      showAlert("Something went wrong!", "error");
    }
  };

  // Theme and media query for responsiveness
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Paper sx={{ padding: 3 }} elevation={4}>
      <Typography variant="h5" marginBottom={"1.5em"} gutterBottom>
        New Form Laporan Kerja -- Tanpa Barang --
      </Typography>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={5} marginY={"2em"} alignItems="center">
            {/* Input Report */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="No. Seri"
                variant="outlined"
                fullWidth
                value={formData.no_seri}
                name="no_seri"
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
                <Accordion
                  disabled={!searched || !formData.no_seri}
                  defaultExpanded
                >
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
                        <Typography>
                          No. Pelanggan :{" "}
                          {displayValue(customer?.["d:Sell_to_Customer_No"])}
                        </Typography>
                        <Typography>
                          Nama Pelanggan :{" "}
                          {displayValue(customer?.["d:Sell_to_Customer_Name"])}
                        </Typography>
                        <Typography>
                          Alias :{" "}
                          {displayValue(customer?.["d:Sell_to_Customer_Name"])}
                        </Typography>
                        <Typography>
                          Alamat :{" "}
                          {displayValue(customer?.["d:Sell_to_Address"])}
                        </Typography>
                        <Typography>
                          Penanggung Jawab :{" "}
                          {displayValue(customer?.["d:Penanggung_jawab"])}
                        </Typography>
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
                <Accordion
                  disabled={!searched || !formData.no_seri}
                  defaultExpanded
                >
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
                        <Typography>
                          Seri : {displayValue(customer?.["d:Serial_No"])}
                        </Typography>
                        <Typography>
                          Nama Mesin :{" "}
                          {displayValue(customer?.["d:Machine_Name"])}
                        </Typography>
                      </Grid>

                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Typography>
                          Type : {displayValue(customer?.["d:Machine_Code"])}
                        </Typography>
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
                <Accordion disabled={!searched || !formData.no_seri}>
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
                          No. Pelapor
                        </Typography>
                        <TextField
                          variant="outlined"
                          fullWidth
                          value={formData.no_call}
                          name="no_call"
                          onChange={handleChange}
                          type="number"
                          slotProps={{
                            input: {
                              startAdornment: (
                                <InputAdornment position="start">
                                  +62
                                </InputAdornment>
                              ),
                            },
                          }}
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
                        <InputLabel id="waktu_dtg">
                          Waktu Penjadwalan
                        </InputLabel>
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
                          multiline
                          rows={3}
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
                <Accordion disabled={!searched || !formData.no_seri}>
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
                          multiline
                          rows={3}
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
                          multiline
                          rows={3}
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
                        <NumberFormatTextField
                          label=""
                          name="count_bw"
                          value={formData.count_bw}
                          onChange={handleChange}
                          fullWidth
                        />
                      </Grid>

                      <Grid size={{ xs: 12, md: 6 }}>
                        <Typography
                          sx={{ color: "rgba(0, 0, 0, 0.6)" }}
                          id="count_cl"
                        >
                          Counter CL
                        </Typography>
                        <NumberFormatTextField
                          label=""
                          name="count_cl"
                          value={formData.count_cl}
                          onChange={handleChange}
                          fullWidth
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
                          multiline
                          rows={3}
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
                            disabled
                            onChange={handleChange}
                          />
                        </Grid>
                      )}
                    </Grid>
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
                disabled={!searched || !formData.no_seri}
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

export default AddNoSeri;
