import React, { useEffect, useState } from "react";
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
} from "@mui/material";
import dayjs from "dayjs";
import { DataGrid } from "@mui/x-data-grid";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

const Report = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const [dataFilter, setDataFilter] = useState({
    waktu_dari: null,
    waktu_sampai: null,
    type: "",
    no_cus: "",
    no_seri: "",
  });

  const [exp_columns, setExpColumns] = useState([
    {
      field: "no",
      headerName: "No.",
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

  const typeData = {
    all: "Semua Type",
    no_rep: "Dengan Barang",
    no_seri: "Tanpa Barang",
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

  const [open, setOpen] = useState(false);
  const [alertData, setAlertData] = useState({ message: "", severity: "info" });
  const [loading, setLoading] = useState(false);
  const [datas, setDatas] = useState([]);
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

  useEffect(() => {
    async function fetchDataFLK() {
      try {
        const response = await fetch(
          import.meta.env.VITE_API_URL + `api/get-flk-norep`
        );

        const data = await response.json();
        setDatas(data); // <-- set the array into state
      } catch (error) {
        console.error("Error fetching items:", error);
      }
    }

    if (location.state?.message) {
      setAlertData({
        message: location.state.message,
        severity: location.state.severity || "info",
      });
      setOpen(true);
    }

    // fetchDataFLK();
  }, [location.state]);

  function displayValue(value) {
    return value === null || value === undefined || value == "" ? "-" : value;
  }

  const handleChange = (e) => {
    setDataFilter({
      ...dataFilter,
      [e.target.name]: e.target.value,
    });
  };

  const handleDateChange = (field, newDate) => {
    if (field === "waktu_dari") {
      setDataFilter((prev) => {
        // Clear waktu_sampai if it's before waktu_dari
        const waktu_sampai =
          prev.waktu_sampai && dayjs(newDate).isAfter(prev.waktu_sampai)
            ? null
            : prev.waktu_sampai;

        return {
          ...prev,
          waktu_dari: newDate,
          waktu_sampai,
        };
      });
    } else if (field === "waktu_sampai") {
      setDataFilter((prev) => {
        if (prev.waktu_dari && dayjs(newDate).isBefore(prev.waktu_dari)) {
          return { ...prev, waktu_sampai: null }; // Invalid range
        }

        return { ...prev, waktu_sampai: newDate };
      });
    }
  };

  // Export handler
  const handleExport = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        import.meta.env.VITE_API_URL + `api/export-excel`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            data: datas,
            columns: exp_columns,
            reportTitle: `Report ${dayjs().format("DD-MM-YYYY")}`,
          }),
        }
      );

      if (!response.ok) throw new Error("Export failed");

      // Convert response to Blob and download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Report ${dayjs().format("DD-MM-YYYY")}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setLoading(false);
    } catch (err) {
      console.error("Export error:", err);
      showAlert("Failed to export Excel");
    }
  };

  const handleSeachFilter = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        import.meta.env.VITE_API_URL + `api/export-data`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            dari: dataFilter.waktu_dari,
            sampai: dataFilter.waktu_sampai,
            jenis: dataFilter.type,
            no_cus: dataFilter.no_cus,
            no_seri: dataFilter.no_seri,
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

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Report
      </Typography>

      <Box>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Grid container spacing={5} marginY={"2em"} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <InputLabel id="waktu_dari">Waktu Dari</InputLabel>
              <DatePicker
                labelId="waktu_dari"
                value={dataFilter.waktu_dari}
                slotProps={{ textField: { fullWidth: true } }}
                onChange={(newValue) =>
                  handleDateChange("waktu_dari", newValue)
                }
                maxDate={dayjs()}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <InputLabel id="waktu_sampai">Waktu Sampai</InputLabel>
              <DatePicker
                labelId="waktu_sampai"
                value={dataFilter.waktu_sampai}
                slotProps={{ textField: { fullWidth: true } }}
                onChange={(newValue) =>
                  handleDateChange("waktu_sampai", newValue)
                }
                minDate={dataFilter.waktu_dari || undefined}
                maxDate={dayjs()}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <InputLabel id="type">Type</InputLabel>
              <Select
                name="type"
                value={dataFilter.type}
                onChange={handleChange}
                variant="outlined"
                fullWidth
              >
                <MenuItem disabled value="">
                  <em>Pilih Type Data</em>
                </MenuItem>
                {Object.keys(typeData).map((key) => (
                  <MenuItem value={key} key={key}>
                    {displayValue(typeData[key])}
                  </MenuItem>
                ))}
              </Select>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <InputLabel id="no_cus">No. Customer</InputLabel>
              <TextField
                variant="outlined"
                fullWidth
                value={dataFilter.no_cus}
                name="no_cus"
                onChange={handleChange}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <InputLabel id="no_seri">No. Seri</InputLabel>
              <TextField
                variant="outlined"
                fullWidth
                value={dataFilter.no_seri}
                name="no_seri"
                onChange={handleChange}
                disabled={dataFilter.no_cus == "" ? true : false}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Button
                variant="contained"
                color="primary"
                style={{ marginTop: "20px" }}
                onClick={handleSeachFilter}
              >
                {loading ? (
                  <CircularProgress size={24} color="info" />
                ) : (
                  "Search Data"
                )}
              </Button>
            </Grid>
          </Grid>
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
    </Container>
  );
};

export default Report;
