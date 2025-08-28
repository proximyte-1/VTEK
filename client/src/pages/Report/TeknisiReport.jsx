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
import { useAlert } from "../../utils/alert";
import { displayFormatDateTime, displayValue } from "../../utils/helpers";
import axios from "axios";

const TeknisiReport = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const schema = useMemo(() => {
    return yup.object().shape({
      waktu_dari: yup.date().required(),
      waktu_sampai: yup.date().required(),
      type: yup.string().required().default("all"),
      id_teknisi: yup.string(),
      kode_area: yup.string(),
      groups: yup.string(),
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
      type: "all",
      id_teknisi: "",
      kode_area: "",
      groups: "",
      no_cus: "",
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
      maxWidth: 50,
      renderCell: (params) => {
        return params.api.getAllRowIds().indexOf(params.id) + 1;
      },
    },
    {
      field: "no_lap",
      headerName: "No Laporan",
      flex: 0,
      width: 100,
      renderCell: (params) => `${params.value}`,
    },
    {
      field: "no_cus",
      headerName: "No Customer",
      flex: 1,
      minWidth: 150,
    },
    {
      field: "no_seri",
      headerName: "No Seri",
      flex: 0,
      minWidth: 150,
    },
    { field: "pelapor", headerName: "Nama Pelapor", flex: 0 },
    { field: "count_bw", headerName: "Count B/W", flex: 0 },
    { field: "count_cl", headerName: "Count C/L", flex: 0 },
    { field: "status_res", headerName: "Result Status", flex: 0 },
    {
      field: "waktu_mulai",
      headerName: "Waktu Mulai",
      flex: 0,
      minWidth: 150,
      renderCell: (params) => displayFormatDateTime(params.value),
    },
    {
      field: "waktu_selesai",
      headerName: "Waktu Selesai",
      flex: 0,
      minWidth: 150,
      renderCell: (params) => displayFormatDateTime(params.value),
    },
    {
      field: "created_at",
      headerName: "Waktu Dibuat",
      flex: 0,
      minWidth: 150,
      renderCell: (params) => displayFormatDateTime(params.value),
    },
  ];

  const typeData = {
    all: "Semua Type",
    no_rep: "Dengan Barang",
    no_seri: "Tanpa Barang",
  };

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [datas, setDatas] = useState([]);
  const [teknisi, setTeknisi] = useState([]);
  const [customer, setCustomer] = useState([]);
  const [kodeArea, setKodeArea] = useState([]);
  const [areaGroups, setAreaGroups] = useState([]);
  const { alert, showAlert, closeAlert } = useAlert();

  const watchGroups = watch("groups");

  const filteredKodeAreas = kodeArea.filter(
    (area) => area.groups === watchGroups
  );

  useEffect(() => {
    const currentKodeAreaId = getValues("kode_area");
    const isKodeAreaStillValid = filteredKodeAreas.some(
      (area) => area.id === currentKodeAreaId
    );

    if (!isKodeAreaStillValid) {
      setValue("kode_area", "");
    }
  }, [watchGroups, filteredKodeAreas, getValues, setValue]);

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
    fetchArea();
    fetchGroup();
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
            kode_area: getValues("kode_area"),
            groups: getValues("groups"),
            no_cus: getValues("no_cus")?.value,
            no_seri: getValues("no_seri"),
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
        Report Laporan Kerja
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
                  placeholder="No. Seri"
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
                    render={(
                      { field, fieldState: { error } } // Render prop provides field and error info
                    ) => (
                      <FormControl fullWidth error={!!errors.no_customer}>
                        <Typography sx={{ color: "rgba(0, 0, 0, 0.6)" }}>
                          Pilih Customer
                        </Typography>
                        <Autocomplete
                          {...field}
                          id="customer-autocomplete"
                          options={customer}
                          // This is crucial for making Autocomplete work with Controller.
                          // It ensures the value passed to onChange is the entire option object.
                          onChange={(event, newValue) =>
                            field.onChange(newValue)
                          }
                          isOptionEqualToValue={(option, value) =>
                            option.value === value.value
                          }
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              // Display error message if validation fails
                              error={!!error}
                              helperText={error?.message}
                            />
                          )}
                        />
                      </FormControl>
                    )}
                  />
                </Grid>
              )}

              {/* Area Groups */}
              {areaGroups && (
                <Grid size={{ xs: 12, md: 6 }}>
                  <Controller
                    name="groups"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.groups}>
                        <Typography sx={{ color: "rgba(0, 0, 0, 0.6)" }}>
                          Pilih Groups
                        </Typography>
                        <Select
                          id="groups-select"
                          variant="outlined"
                          {...field}
                          displayEmpty
                        >
                          <MenuItem value="" key="groups-disabled">
                            {/* <Typography
                              sx={{
                                color: "rgba(0, 0, 0, 0.35)",
                                fontStyle: "italic",
                              }}
                            >
                              Pilih Groups
                            </Typography> */}
                            <em>Pilih Groups</em>
                          </MenuItem>
                          {areaGroups.map((item) => (
                            <MenuItem key={item.groups} value={item.groups}>
                              {`${item.groups}`}
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.groups && (
                          <FormHelperText>
                            {errors.groups?.message}
                          </FormHelperText>
                        )}
                      </FormControl>
                    )}
                  />
                </Grid>
              )}

              {/* Area Kode Area */}
              {kodeArea && watchGroups && (
                <Grid size={{ xs: 12, md: 6 }}>
                  <Controller
                    name="kode_area"
                    control={control}
                    render={({ field }) => (
                      <FormControl fullWidth error={!!errors.kode_area}>
                        <Typography sx={{ color: "rgba(0, 0, 0, 0.6)" }}>
                          Pilih Kode Area
                        </Typography>
                        <Select
                          id="area-select"
                          variant="outlined"
                          {...field}
                          displayEmpty
                        >
                          <MenuItem value="" key="area-disabled">
                            <em>Pilih Kode Area</em>
                          </MenuItem>

                          {filteredKodeAreas.map((item) => (
                            <MenuItem key={item.id} value={item.id}>
                              {`${item.kode_area} (${item.nama_area})`}
                            </MenuItem>
                          ))}
                        </Select>
                        {errors.kode_area && (
                          <FormHelperText>
                            {errors.kode_area?.message}
                          </FormHelperText>
                        )}
                      </FormControl>
                    )}
                  />
                </Grid>
              )}

              {/* Teknisi */}
              {teknisi && (
                <Grid size={{ xs: 12, md: 6 }}>
                  <Controller
                    name="id_teknisi"
                    control={control}
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
                          <MenuItem value="" key="teknisi-disabled">
                            <em>Pilih Teknisi</em>
                          </MenuItem>
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
      {searched && (
        <Box sx={{ width: "100%", overflowX: "auto" }}>
          <Box sx={{ minWidth: 700 }}>
            <DataGrid
              rows={datas}
              columns={columns}
              getRowId={(row) => row.id}
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
      )}

      {/* Link to Form Page */}
      {searched && (
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
      )}

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
