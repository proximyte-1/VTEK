import React, { useCallback, useEffect, useState } from "react";
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
  Box,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { ExpandMoreRounded } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import dayjs from "dayjs";
import { DataGrid } from "@mui/x-data-grid";
import NumberFormatTextField from "../components/NumberFormatTextField/NumberFormatTextField";
import debounce from "lodash.debounce";
import FileUpload from "../components/FileUpload/FileUpload";

const Edit = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    no_rep: "",
    no_cus: "",
    no_lap: "",
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
    pic: null,
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

  const columns = [
    {
      field: "no",
      headerName: "No.",
      sortable: false,
      renderCell: (params) => {
        return params.api.getAllRowIds().indexOf(params.id) + 1;
      },
    },
    {
      field: "kode_part",
      headerName: "Kode Part",
      flex: 1,
      renderCell: ({ row }) => <div>{row["d:ItemNo"]}</div>,
    },
    {
      field: "nama_part",
      headerName: "Nama Part",
      flex: 1,
      renderCell: ({ row }) => <div>{row["d:Description"]}</div>,
    },
    {
      field: "quantity",
      headerName: "Quantity",
      flex: 1,
      renderCell: ({ row }) => <div>{row["d:Quantity"]?._}</div>,
    },
  ];

  const [barang, setDataBarang] = useState([]);
  const [customer, setDataCustomer] = useState([]);
  const [searched, setSearched] = useState(true);
  const [loading, setLoading] = useState(false);
  const [expand, setExpand] = useState(true);
  const [statusRes, setStatusRes] = useState([]);
  const [alert, setAlert] = useState({
    open: false,
    message: "",
    severity: "success", // 'success', 'error', 'warning', 'info'
  });

  const displayValue = (data) => {
    if (typeof data === "string") return data.trim();
    if (typeof data === "object" && "_" in data) return String(data._).trim();
    if (data === null || data === undefined || data == "") return "-";
    return "-";
  };

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

  useEffect(() => {
    const fetchFlkData = async () => {
      try {
        const response = await fetch(
          import.meta.env.VITE_API_URL + `api/get-flk-one-by-id?${id}`
        );
        const data = await response.json();
        const datas = data[0];

        if (datas && datas.no_rep) {
          setFormData((prev) => ({
            ...prev,
            ...datas,
            waktu_call: datas.waktu_call ? dayjs(datas.waktu_call) : null,
            waktu_dtg: datas.waktu_dtg ? dayjs(datas.waktu_dtg) : null,
            waktu_mulai: datas.waktu_mulai ? dayjs(datas.waktu_mulai) : null,
            waktu_selesai: datas.waktu_selesai
              ? dayjs(datas.waktu_selesai)
              : null,
          }));

          // Fetch related data
          const cus = await fetchDataBarang(datas.no_rep);
          await fetchContRes(cus, datas.no_seri);
          setExpand(false);
        } else {
          console.error("No data found or no_rep is missing");
        }
      } catch (error) {
        console.error("Fetch failed:", error);
      }
    };

    fetchFlkData(id);
  }, [id]);

  const fetchDataBarang = async (id) => {
    try {
      const fetch_barang = await fetch(
        import.meta.env.VITE_API_URL + `api/nav-data?id=${id}`
      );
      const data = await fetch_barang.json();

      if (!data.length <= 0) {
        setDataBarang(data);
        setDataCustomer(data[0]);
      }

      return data[0]["d:Sell_to_Customer_No"];
    } catch (error) {
      console.error("Error fetching barang:", error);
    }
  };

  const fetchContRes = async (id_cus, no_seri) => {
    const response = await fetch(
      import.meta.env.VITE_API_URL +
        `api/get-rep-seri-by-cus?id_cus=${id_cus}&no_seri=${no_seri}&${id}`
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

  const debouncedUpdate = useCallback(
    debounce((name, value) => {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }, 10),
    []
  );

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Update debounced form state
    debouncedUpdate(name, value);

    if (e.target.name === "status_res") {
      setStatusRes(e.target.value);
    }
  };

  const handleFileSelect = (file) => {
    setFormData((prev) => ({ ...prev, pic: file }));
  };

  const handleFileError = (message) => {
    if (message) showAlert(message, "error");
  };

  const handleDateChange = (field, newDate) => {
    const now = dayjs();
    const diffInDays = now.diff(dayjs(newDate), "day");

    if (diffInDays > import.meta.env.VITE_BACKDATE_DAYS) {
      showAlert("Waktu tidak boleh lebih dari 30 hari di belakang!", "error");
    } else if (
      diffInDays < import.meta.env.VITE_FORWARD_PENJADWALAN_DAYS &&
      field == "waktu_dtg"
    ) {
      showAlert(
        "Waktu tidak boleh lebih dari 1 hari di depan! jadwal",
        "error"
      );
    } else if (diffInDays < import.meta.env.VITE_FORWARD_DAYS) {
      showAlert("Waktu tidak boleh lebih dari 2 hari di depan! date", "error");
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const data = new FormData();
    data.append("pic", formData.pic);
    data.append("created_by", 1);
    data.append("type", 1);
    data.append(
      "rep_ke",
      formData.status_res === "CONT" ? formData.rep_ke : null
    );

    // Append all other fields
    Object.keys(formData).forEach((key) => {
      if (!["pic", "created_by", "type", "rep_ke"].includes(key)) {
        data.append(key, formData[key]);
      } else if (
        ["waktu_call", "waktu_dtg", "waktu_mulai", "waktu_selesai"].includes(
          key
        )
      ) {
        const val = formData[key];
        data.append(key, val.toISOString());
      }
    });

    try {
      const response = await fetch(
        import.meta.env.VITE_API_URL + `api/edit-flk?${id}`,
        {
          method: "POST",
          body: data,
        }
      );

      const result = await response.json();
      setLoading(false);

      if (response.ok) {
        // Redirect to homepage after successful submission
        navigate("/flk", {
          state: {
            message: "Data Laporan Kerja Berhasil Diubah!",
            severity: "success",
          },
        });
      } else {
        showAlert("Failed to submit data!", "error");
      }
    } catch (error) {
      console.error("Error submitting data:", error);
      showAlert("Something went wrong!", "error");
      setLoading(false);
    }
  };

  // Theme and media query for responsiveness
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Paper sx={{ padding: 3 }} elevation={4}>
      <Typography variant="h5" marginBottom={"1.5em"} gutterBottom>
        Edit Form Laporan Kerja
      </Typography>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={5} marginY={"2em"} alignItems="center">
            {/* Input Report */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="No. Report / No. Navision"
                variant="outlined"
                fullWidth
                value={formData.no_rep}
                name="no_rep"
                type="number"
                aria-readonly
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">SPGFI</InputAdornment>
                    ),
                  },
                }}
              />
            </Grid>
            <Grid container spacing={5}>
              {/* Accordion 1 - Non Input */}
              <Grid size={12}>
                <Accordion
                  disabled={!searched || !formData.no_rep}
                  expanded={!expand}
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
                  disabled={!searched || !formData.no_rep}
                  expanded={!expand}
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
                <Accordion
                  disabled={!searched || !formData.no_rep}
                  expanded={!expand}
                >
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
                <Accordion
                  disabled={!searched || !formData.no_rep}
                  expanded={!expand}
                >
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
                          id="no_lap"
                        >
                          No. Laporan
                        </Typography>
                        <TextField
                          variant="outlined"
                          fullWidth
                          value={formData.no_lap}
                          name="no_lap"
                          type="number"
                          onChange={handleChange}
                        />
                      </Grid>

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

              {/* Accordion 5 - Table */}
              <Grid size={12}>
                <Accordion
                  disabled={!searched || !formData.no_rep}
                  expanded={!expand}
                >
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
                    <Box sx={{ width: "100%", overflowX: "auto" }}>
                      <Box sx={{ minWidth: 700 }}>
                        <DataGrid
                          rows={barang}
                          columns={columns}
                          getRowId={(row) => row["d:ItemNo"]}
                          initialState={{
                            pagination: {
                              paginationModel: {
                                pageSize: 5,
                              },
                            },
                          }}
                          pageSizeOptions={[5]}
                          disableRowSelectionOnClick
                        />
                      </Box>
                    </Box>
                  </AccordionDetails>
                </Accordion>
              </Grid>

              {/* Accordion 6 - Upload File */}
              <Grid size={12}>
                <Accordion
                  disabled={!searched || !formData.no_rep}
                  expanded={!expand}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreRounded />}
                    aria-controls="panel1-content"
                    id="panel1-header"
                  >
                    <Typography component="span" variant="h5">
                      Upload Bukti
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {/* Upload */}
                    <Box sx={{ width: "100%", overflowX: "auto" }}>
                      <Box>
                        <FileUpload
                          onFileSelect={handleFileSelect}
                          onError={handleFileError}
                        />
                      </Box>
                    </Box>
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
                {loading ? <CircularProgress size={24} /> : "Submit"}
              </Button>
            </Grid>
          </Grid>
        </form>
      </LocalizationProvider>
    </Paper>
  );
};

export default Edit;
