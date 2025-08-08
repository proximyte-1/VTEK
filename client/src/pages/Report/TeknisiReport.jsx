import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Typography,
  Snackbar,
  Alert,
  Box,
  Grid,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  TextField,
  FormControl,
  FormHelperText,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import dayjs from "dayjs";
import { DataGrid } from "@mui/x-data-grid";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import * as yup from "yup";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useAlert } from "../../utils/alert";
import { displayValue } from "../../utils/helpers";
import axios from "axios";

const TeknisiReport = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const schema = useMemo(() => {
    return yup.object().shape({
      waktu_dari: yup.date().required(),
      waktu_sampai: yup.date().required(),
      type: yup.string().required(),
      id_teknisi: yup.string().required(),
    });
  }, []);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    getValues,
    reset,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    context: { isEdit: false },
    defaultValues: {
      waktu_dari: null,
      waktu_sampai: null,
      type: "",
      id_teknisi: "",
    },
  });

  const [exp_columns, setExpColumns] = useState([
    {
      field: "no",
      headerName: "No.",
    },
    {
      field: "no_seri",
      headerName: "No. Seri",
    },
    {
      field: "waktu_mulai",
      headerName: "Mulai",
    },
    {
      field: "waktu_selesai",
      headerName: "Selesai",
    },
    {
      field: "kat_problem",
      headerName: "Problem",
    },
    {
      field: "problem",
      headerName: "Keterangan Problem",
    },
    {
      field: "solusi",
      headerName: "Solusi",
    },
    {
      field: "count_bw",
      headerName: "Counter B/W",
    },
    {
      field: "count_cl",
      headerName: "Counter C/L",
    },
    {
      field: "no_rep",
      headerName: "No. Report",
    },
    {
      field: "no_lap",
      headerName: "No. Laporan",
    },
    {
      field: "status_res",
      headerName: "Result",
    },
  ]);

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
      field: "no_lap",
      headerName: "No Laporan",
      flex: 1,
      width: 100,
      renderCell: (params) => `${params.value}`,
    },
    { field: "pelapor", headerName: "Nama Pelapor", flex: 1 },
    {
      field: "waktu_mulai",
      headerName: "Waktu Mulai",
      flex: 1,
      renderCell: (params) =>
        params.value ? dayjs(params.value).format("YYYY-MM-DD HH:mm") : "-",
    },
    {
      field: "waktu_selesai",
      headerName: "Waktu Selesai",
      flex: 1,
      renderCell: (params) =>
        params.value ? dayjs(params.value).format("YYYY-MM-DD HH:mm") : "-",
    },
    {
      field: "created_at",
      headerName: "Waktu Dibuat",
      flex: 1,
      renderCell: (params) =>
        params.value ? dayjs(params.value).format("YYYY-MM-DD HH:mm") : "-",
    },
  ];

  const typeData = {
    all: "Semua Type",
    no_rep: "Dengan Barang",
    no_seri: "Tanpa Barang",
  };

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [datas, setDatas] = useState([]);
  const [teknisi, setTeknisi] = useState([]);
  const [customer, setCustomer] = useState([]);
  const { alert, showAlert, closeAlert } = useAlert();

  useEffect(() => {
    if (location.state?.message) {
      setAlertData({
        message: location.state.message,
        severity: location.state.severity || "info",
      });
      setOpen(true);
    }

    fetchTeknisi();
    fetchCustomer();
  }, [location.state]);

  const fetchTeknisi = async () => {
    try {
      axios
        .get(`${import.meta.env.VITE_API_URL}api/get-teknisi`)
        .then((res) => {
          if (res.data && Array.isArray(res.data) && res.data.length > 0) {
            // Store the array of objects directly
            setTeknisi(res.data);
          } else {
            setTeknisi([]);
            showAlert("Data teknisi belum ada.", "error");
          }
        });
    } catch (err) {
      console.error("Terjadi kesalahan saat memanggil data: ", err);
      showAlert("Terjadi kesalahan saat memanggil data", "error");
    }
  };

  const fetchCustomer = async () => {
    try {
      axios
        .get(`${import.meta.env.VITE_API_URL}api/get-customer`)
        .then((res) => {
          if (res.data && Array.isArray(res.data) && res.data.length > 0) {
            // Store the array of objects directly
            setCustomer(res.data);
          } else {
            setCustomer([]);
            showAlert("Data Customer belum ada.", "error");
          }
        });
    } catch (err) {
      console.error("Terjadi kesalahan saat memanggil data: ", err);
      showAlert("Terjadi kesalahan saat memanggil data", "error");
    }
  };

  // Export handler
  const handleExport = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        import.meta.env.VITE_API_URL + `api/export-report-teknisi`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            data: datas,
            columns: exp_columns,
            reportTitle: `Report ${dayjs().format("DD-MM-YYYY")}`,
            teknisi: getValues("id_teknisi"),
          }),
        }
      );

      if (!response.ok) throw new Error("Export failed");

      // Convert response to Blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Report Teknisi ${dayjs().format("DD-MM-YYYY")}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setLoading(false);
    } catch (err) {
      console.error("Export error:", err);
      showAlert("Failed to export Excel");
    }
  };

  const onSubmit = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        import.meta.env.VITE_API_URL + `api/export-data-teknisi`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            dari: getValues("waktu_dari"),
            sampai: getValues("waktu_sampai"),
            jenis: getValues("type"),
            teknisi: getValues("id_teknisi"),
          }),
        }
      );

      if (!response.ok) throw new Error("Filter Failed");

      const data = await response.json();
      setDatas(data.data); // <-- set the array into state
      setLoading(false);
    } catch (err) {
      console.error("Filter error : ", err);
      showAlert("Filter Failed !!", "error");
      setLoading(false);
    }
  };

  const onInvalid = (errors) => {
    showAlert(
      "Terjadi kesalahan pada input data mohon check kembali.",
      "error"
    );
  };

  // Theme and media query for responsiveness
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Container sx={{ padding: 3 }}>
      <Typography variant="h4" gutterBottom>
        Report Per Teknisi
      </Typography>

      <Box>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <form
            onSubmit={handleSubmit(onSubmit, onInvalid)}
            encType="multipart/form-data"
          >
            <Grid container spacing={5} marginY={"2em"} alignItems="center">
              {/* Periode Dari */}
              <Grid size={{ xs: 12, md: 6 }}>
                <InputLabel id="waktu_dari">Waktu Dari</InputLabel>
                <Controller
                  name="waktu_dari"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      {...field}
                      format="DD-MM-YYYY"
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: !!errors.waktu_dari,
                          helperText: errors.waktu_dari?.message,
                        },
                      }}
                    />
                  )}
                />
              </Grid>

              {/* Periode Sampai */}
              <Grid size={{ xs: 12, md: 6 }}>
                <InputLabel id="waktu_sampai">Waktu Sampai</InputLabel>
                <Controller
                  name="waktu_sampai"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      {...field}
                      format="DD-MM-YYYY"
                      onChange={(newValue) => {
                        const waktuDari = watch("waktu_dari");

                        if (
                          waktuDari &&
                          dayjs(newValue).isBefore(dayjs(waktuDari))
                        ) {
                          showAlert(
                            "Waktu Selesai tidak boleh sebelum Waktu Mulai.",
                            "error"
                          );
                          return;
                        }

                        field.onChange(newValue); // still update the form
                      }}
                      slotProps={{
                        textField: {
                          fullWidth: true,
                          error: !!errors.waktu_sampai,
                          helperText: errors.waktu_sampai?.message,
                        },
                      }}
                    />
                  )}
                />
              </Grid>

              {/* Jenis LK */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="type"
                  control={control}
                  rules={{ required: "Type is required" }} // Add your validation rules here
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.type}>
                      <Typography sx={{ color: "rgba(0, 0, 0, 0.6)" }}>
                        Pilih Type
                      </Typography>
                      <Select
                        id="type-select"
                        variant="outlined"
                        {...field}
                        displayEmpty
                      >
                        {Object.keys(typeData).map((key) => (
                          <MenuItem value={key} key={key}>
                            {displayValue(typeData[key])}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.type && (
                        <FormHelperText>{errors.type?.message}</FormHelperText>
                      )}
                    </FormControl>
                  )}
                />
              </Grid>

              {/* No. Seri */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Typography sx={{ color: "rgba(0, 0, 0, 0.6)" }} id="no_seri">
                  No. Seri
                </Typography>
                <TextField
                  variant="outlined"
                  fullWidth
                  {...register("no_seri")}
                  error={!!errors.no_seri}
                  helperText={errors.no_seri?.message}
                />
              </Grid>

              {/* Customer */}
              {customer && (
                <Grid size={{ xs: 12, md: 6 }}>
                  <Controller
                    name="no_cus"
                    control={control}
                    rules={{ required: "No Customer is required" }} // Add your validation rules here
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.no_cus}>
                        <Typography sx={{ color: "rgba(0, 0, 0, 0.6)" }}>
                          Pilih Customer
                        </Typography>
                        <Select
                          id="customer-select"
                          variant="outlined"
                          {...field}
                          displayEmpty
                        >
                          {customer.map((item) => (
                            <MenuItem key={item.id} value={item.no_cus}>
                              {`${item.nama_cus} (${item.alias})`}
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.no_cus && (
                          <FormHelperText>
                            {errors.no_cus?.message}
                          </FormHelperText>
                        )}
                      </FormControl>
                    )}
                  />
                </Grid>
              )}

              {/* Area Groups */}
              {/* Area Kode Area */}

              {/* Teknisi */}
              {teknisi && (
                <Grid size={{ xs: 12, md: 6 }}>
                  <Controller
                    name="id_teknisi"
                    control={control}
                    rules={{ required: "Teknisi is required" }} // Add your validation rules here
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.id_teknisi}>
                        <Typography sx={{ color: "rgba(0, 0, 0, 0.6)" }}>
                          Pilih Teknisi
                        </Typography>
                        <Select
                          id="teknisi-select"
                          variant="outlined"
                          {...field}
                          displayEmpty
                        >
                          {teknisi.map((item) => (
                            <MenuItem key={item.id} value={item.id}>
                              {item.name}
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.id_teknisi && (
                          <FormHelperText>
                            {errors.id_teknisi?.message}
                          </FormHelperText>
                        )}
                      </FormControl>
                    )}
                  />
                </Grid>
              )}

              <Grid size={{ xs: 12, md: 6 }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  sx={{
                    width: isSmallScreen ? "100%" : "auto",
                    marginTop: "20px",
                  }}
                  disabled={loading}
                >
                  {loading ? (
                    <CircularProgress size={24} color="info" />
                  ) : (
                    "Search Data"
                  )}
                </Button>
              </Grid>
            </Grid>
          </form>
        </LocalizationProvider>
      </Box>
      <Box sx={{ width: "100%", overflowX: "auto" }}>
        <Box sx={{ minWidth: 700 }}>
          <DataGrid
            rows={datas}
            columns={columns}
            getRowId={(row) => row.id}
            initialState={{
              pagination: {
                paginationModel: {
                  pageSize: 5,
                },
              },
            }}
            pageSizeOptions={[5]}
          />
        </Box>
      </Box>

      {/* Link to Form Page */}
      <Button
        variant="contained"
        color="primary"
        style={{ marginTop: "20px" }}
        onClick={handleExport}
      >
        {loading ? <CircularProgress size={24} color="info" /> : "Export Excel"}
      </Button>

      {/* Alert notifications */}
      <Snackbar
        open={alert.open}
        autoHideDuration={5000}
        onClose={closeAlert}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Alert
          onClose={closeAlert}
          variant="filled"
          severity={alert.severity}
          fontSize="inherit"
          sx={{ width: "100%" }}
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default TeknisiReport;
