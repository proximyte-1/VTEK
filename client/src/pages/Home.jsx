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
  Autocomplete,
} from "@mui/material";
import dayjs from "dayjs";
import { DataGrid } from "@mui/x-data-grid";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import * as yup from "yup";
import { Controller, useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { useAlert } from "../utils/alert";
import {
  displayFormatDate,
  displayFormatDateTime,
  displayValue,
} from "../utils/helpers";
import axios from "axios";

const Home = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const schema = useMemo(() => {
    return yup.object().shape({
      search_val: yup.string().required(),
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
      search_val: null,
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
      field: "nama_cus",
      headerName: "Nama Customer",
      flex: 0,
      width: 100,
      renderCell: (params) => `${params.value}`,
    },
    {
      field: "cp",
      headerName: "Contact Person",
      flex: 1,
      minWidth: 150,
      renderCell: (params) => displayValue(params.value),
    },
    {
      field: "no_contract",
      headerName: "No Contract",
      flex: 0,
      minWidth: 150,
    },
    { field: "alias", headerName: "Alias", flex: 0 },
    { field: "alamat", headerName: "Alamat", flex: 0 },
    { field: "no_seri", headerName: "No Seri", flex: 0 },
    {
      field: "tgl_instalasi",
      headerName: "Tanggal Instalasi",
      flex: 0,
      minWidth: 150,
      renderCell: (params) => displayFormatDate(params.value),
    },
    {
      field: "map_teknisi",
      headerName: "Teknisi",
      flex: 0,
      minWidth: 150,
      renderCell: (params) => displayValue(params.value),
    },
    {
      field: "map_supervisor",
      headerName: "Supervisor",
      flex: 0,
      minWidth: 150,
      renderCell: (params) => displayValue(params.value),
    },
    {
      field: "type_service",
      headerName: "Tipe Service",
      flex: 0,
      minWidth: 150,
      renderCell: (params) => displayValue(params.value),
    },
    {
      field: "sisa_contract",
      headerName: "Sisa Masa Contract",
      flex: 0,
      minWidth: 150,
      renderCell: (params) => displayValue(params.value) + " Hari",
    },
    {
      field: "tgl_contract_exp",
      headerName: "Tanggal Expire Contract",
      flex: 0,
      minWidth: 150,
      renderCell: (params) => displayFormatDate(params.value),
    },
  ];

  // const typeData = {
  //   all: "Semua Type",
  //   no_rep: "Dengan Barang",
  //   no_seri: "Tanpa Barang",
  // };

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [datas, setDatas] = useState([]);
  const [teknisi, setTeknisi] = useState([]);
  const [customer, setCustomer] = useState([]);
  const [kodeArea, setKodeArea] = useState([]);
  const [areaGroups, setAreaGroups] = useState([]);
  const { alert, showAlert, closeAlert } = useAlert();

  // const watchGroups = watch("groups");

  // const filteredKodeAreas = kodeArea.filter(
  //   (area) => area.groups === watchGroups
  // );

  // useEffect(() => {
  //   const currentKodeAreaId = getValues("kode_area");
  //   const isKodeAreaStillValid = filteredKodeAreas.some(
  //     (area) => area.id === currentKodeAreaId
  //   );

  //   if (!isKodeAreaStillValid) {
  //     setValue("kode_area", "");
  //   }
  // }, [watchGroups, filteredKodeAreas, getValues, setValue]);

  useEffect(() => {
    if (location.state?.message) {
      setAlertData({
        message: location.state.message,
        severity: location.state.severity || "info",
      });
      setOpen(true);
    }

    // fetchTeknisi();
    // fetchCustomer();
    // fetchArea();
    // fetchGroup();
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
            const formattedOptions = res.data.map((item) => ({
              label: `${item.nama_cus} (${item.alias})`,
              value: item.no_cus,
            }));
            console.log(JSON.stringify(formattedOptions));
            setCustomer(formattedOptions);
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

  const fetchArea = async () => {
    try {
      axios
        .get(`${import.meta.env.VITE_API_URL}api/get-area-kode`)
        .then((res) => {
          if (res.data && Array.isArray(res.data) && res.data.length > 0) {
            // Store the array of objects directly
            setKodeArea(res.data);
          } else {
            setTeknisi([]);
            showAsetKodeArealert("Data kode area belum ada.", "error");
          }
        });
    } catch (err) {
      console.error("Terjadi kesalahan saat memanggil data: ", err);
      showAlert("Terjadi kesalahan saat memanggil data", "error");
    }
  };

  const fetchGroup = async () => {
    try {
      axios
        .get(`${import.meta.env.VITE_API_URL}api/get-area-groups`)
        .then((res) => {
          if (res.data && Array.isArray(res.data) && res.data.length > 0) {
            // Store the array of objects directly
            setAreaGroups(res.data);
          } else {
            setAreaGroups([]);
            showAsetKodeArealert("Data ara group belum ada.", "error");
          }
        });
    } catch (err) {
      console.error("Terjadi kesalahan saat memanggil data: ", err);
      showAlert("Terjadi kesalahan saat memanggil data", "error");
    }
  };

  // Export handler
  const handleExport = async () => {
    // setLoading(true);
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
      link.download = `Report ${dayjs().format("DD-MM-YYYY")}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setLoading(false);
    } catch (err) {
      console.error("Export error:", err);
      showAlert("Failed to export Excel", "error");
    }
  };

  const onSubmit = async () => {
    setLoading(true);

    console.log(
      JSON.stringify({
        search_data: getValues("search_val"),
      })
    );
    try {
      const response = await fetch(
        import.meta.env.VITE_API_URL + `api/search-data`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            search_data: getValues("search_val"),
          }),
        }
      );

      if (!response.ok) throw new Error("Filter Failed");

      const data = await response.json();
      setDatas(data.data); // <-- set the array into state
      setSearched(true);
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
        Home
      </Typography>

      <Box>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <form
            onSubmit={handleSubmit(onSubmit, onInvalid)}
            encType="multipart/form-data"
          >
            <Grid container spacing={5} marginY={"2em"} alignItems="center">
              {/* Search Data */}
              <Grid size={{ xs: 12, md: 8 }}>
                <TextField
                  variant="outlined"
                  fullWidth
                  {...register("search_val")}
                  placeholder="Search"
                  error={!!errors.search_val}
                  helperText={errors.search_val?.message}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  sx={{
                    width: isSmallScreen ? "100%" : "auto",
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
            getRowId={(row) => row.id_customer}
            initialState={{
              pagination: {
                paginationModel: {
                  pageSize: 15,
                },
              },
            }}
            pageSizeOptions={[15]}
          />
        </Box>
      </Box>

      {/* Link to Form Page */}
      {/* {searched && (
        <Button
          variant="contained"
          color="primary"
          style={{ marginTop: "20px" }}
          onClick={handleExport}
        >
          {loading ? (
            <CircularProgress size={24} color="info" />
          ) : (
            "Export Excel"
          )}
        </Button>
      )} */}

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

export default Home;
