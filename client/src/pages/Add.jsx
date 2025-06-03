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
  CircularProgress,
  InputAdornment,
  Box,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { ExpandMoreRounded } from "@mui/icons-material";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { DataGrid } from "@mui/x-data-grid";
import NumberFormatTextField from "../components/NumberFormatTextField/NumberFormatTextField";
import FileUpload from "../components/FileUpload/FileUpload";
import debounce from "lodash.debounce";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import axios from "axios";

const Add = () => {
  const navigate = useNavigate();

  const schema = yup.object().shape({
    no_rep: yup.string().required(),
    no_call: yup.string().required(),
    no_lap: yup.string().required(),
    pelapor: yup.string().required(),
    waktu_call: yup.date().required(),
    waktu_dtg: yup.date().required(),
    status_call: yup.string().required(),
    keluhan: yup.string().required(),
    kat_keluhan: yup.string().required(),
    problem: yup.string().required(),
    kat_problem: yup.string().required(),
    solusi: yup.string().required(),
    waktu_mulai: yup.date().required(),
    waktu_selesai: yup
      .date()
      .min(
        yup.ref("waktu_mulai"),
        "Waktu selesai tidak boleh sebelum waktu mulai"
      ),
    count_bw: yup.number().required(),
    count_cl: yup.number().required(),
    saran: yup.string().required(),
    status_res: yup.string().required(),
    pic: yup
      .mixed()
      .required("File bukti harus diunggah.")
      .test(
        "fileType",
        "Hanya file gambar (jpg, png, jpeg) yang diperbolehkan.",
        (value) => {
          return (
            value &&
            ["image/jpeg", "image/png", "image/jpg"].includes(value.type)
          );
        }
      )
      .test("fileSize", "Ukuran file maksimal 2MB.", (value) => {
        return value && value.size <= import.meta.env.VITE_MAX_FILE_MB;
      }),
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

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      no_rep: "",
      no_call: "",
      no_lap: "",
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
      rep_ke: 1,
    },
  });

  const [barang, setDataBarang] = useState([]);
  const [customer, setDataCustomer] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data_no_rep, setDataNoRep] = useState([]);
  const [expand, setExpand] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);

  let statusRes = watch("status_res");
  const handleFileSelect = (file) => {
    setValue("pic", file, { shouldValidate: true });
  };

  const [alert, setAlert] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const handleCloseAlert = () => setAlert((prev) => ({ ...prev, open: false }));

  useEffect(() => {
    async function fetchNoRep() {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}api/get-no-rep`
        );
        setDataNoRep(response.data);
      } catch (error) {
        console.error("Error fetching No Report:", error);
      }
    }

    fetchNoRep();
  }, []);

  const fetchDataBarang = async (id) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}api/nav-data?id=${id}`
      );
      const data = response.data;

      if (data.length <= 0) {
        setAlert({
          open: true,
          message: "Nomor Report Belum Ada Pada Navision!",
          severity: "error",
        });
        setSearched(false);
        return null;
      }

      const customerData = data[0];

      setAlert({
        open: true,
        message: "Nomor Report Belum Dipakai.",
        severity: "success",
      });
      setSearched(true);
      setDataBarang(data);
      setDataCustomer(customerData);

      // Update form values using react-hook-form's setValue
      setValue("no_seri", customerData["d:Serial_No"]);
      setValue("no_cus", customerData["d:Sell_to_Customer_No"]);

      return customerData;
    } catch (error) {
      console.error("Error fetching barang:", error);
      setAlert({
        open: true,
        message: "Gagal mengambil data dari server",
        severity: "error",
      });
      setSearched(false);
    }
  };

  const fetchContRes = async (id_cus, serialNo) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}api/get-rep-seri-by-cus`,
        {
          params: {
            id_cus: id_cus,
            value: serialNo,
          },
        }
      );

      const data = response.data;

      if (data.length <= 0) return;

      const increment = data[0]["rep_ke"] + 1;

      if (data[0]["status_res"] === "CONT") {
        setValue("rep_ke", increment);
      }
    } catch (error) {
      console.error("Error fetching continuation status:", error);
      setAlert({
        open: true,
        message: "Gagal mengambil status report sebelumnya",
        severity: "error",
      });
    }
  };

  const handleSearch = async () => {
    setLoading(true);

    const noRep = getValues("no_rep");

    if (!noRep) {
      setAlert({
        open: true,
        message: "Nomor Report Tidak Boleh Kosong.",
        severity: "error",
      });
      setSearched(false);
      setLoading(false);
      return;
    }

    // Check if no_rep is already used
    if (data_no_rep.some((item) => item.no_rep === noRep)) {
      setAlert({
        open: true,
        message: "Nomor Report Sudah Pernah Dipakai.",
        severity: "error",
      });
      setSearched(false);
      setLoading(false);
      return;
    }

    try {
      // Fetch customer data
      const customer = await fetchDataBarang(noRep);
      if (customer) {
        await fetchContRes(
          customer["d:Sell_to_Customer_No"],
          customer["d:Serial_No"]
        );
      }

      setExpand(false);
      setLoading(false);
    } catch (error) {
      console.error("Error in handleSearch:", error);
      setAlert({
        open: true,
        message: "Terjadi kesalahan saat mencari data.",
        severity: "error",
      });
      setLoading(false);
    }
  };

  const displayValue = (data) => {
    if (typeof data === "string") return data.trim();
    if (typeof data === "object" && "_" in data) return String(data._).trim();
    if (data === null || data === undefined || data == "") return "-";
    return "-";
  };

  const submitBarang = () => {
    const data = [];
    barang.map((item) => {
      const field = {
        no_brg: item["d:ItemNo"],
        nama: item["d:Machine_Name"],
        qty: item["d:Quantity"]["_"],
      };

      data.push(field);
    });

    return data;
  };

  const submit = async (values) => {
    console.log("test");
    if (!selectedFile) {
      setAlert({
        open: true,
        message: "File bukti harus diunggah.",
        severity: "error",
      });
      return;
    }

    try {
      const data = new FormData();

      // Always append the file
      data.append("pic", selectedFile);
      data.append("created_by", 1);
      data.append("type", 1);

      // Append all fields except special ones
      Object.entries(values).forEach(([key, value]) => {
        if (
          ["waktu_call", "waktu_dtg", "waktu_mulai", "waktu_selesai"].includes(
            key
          ) &&
          value instanceof Date
        ) {
          data.append(key, value.toISOString());
        } else if (key === "rep_ke" && values.status_res !== "CONT") {
          data.append(key, "");
        } else {
          data.append(key, value);
        }
      });

      // Submit main form
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}api/create-flk`,
        data
      );
      const { data: result } = response;

      if (!response.data || !result.data?.id) {
        throw new Error("Gagal menyimpan data utama.");
      }

      const reportId = result.data.id;

      // Submit barang list
      const barangPayload = {
        no_lk: reportId,
        items: submitBarang(), // Assuming submitBarang() returns array of items
      };

      const barangResponse = await axios.post(
        `${import.meta.env.VITE_API_URL}api/create-brg`,
        barangPayload
      );

      if (barangResponse.status === 200) {
        navigate("/flk", {
          state: {
            message: "Data Laporan Kerja Berhasil Ditambahkan!",
            severity: "success",
          },
        });
      } else {
        setAlert({
          open: true,
          message: "Add Data Barang Failed !!",
          severity: "error",
        });
      }
    } catch (error) {
      console.error("Error submitting data:", error);
      setAlert({
        open: true,
        message: "Terjadi kesalahan saat mengirim data.",
        severity: "error",
      });
    }
  };

  // Theme and media query for responsiveness
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Paper sx={{ padding: 3 }} elevation={4}>
      <Typography variant="h5" marginBottom={"1.5em"} gutterBottom>
        New Laporan Kerja
      </Typography>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <form onSubmit={handleSubmit(submit)} encType="multipart/form-data">
          <Grid container spacing={5} marginY={"2em"} alignItems="center">
            {/* Input Report */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="No. Report / No. Navision"
                fullWidth
                {...register("no_rep")}
                error={!!errors.no_rep}
                helperText={errors.no_rep?.message}
                variant="outlined"
                type="number"
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">SPGFI</InputAdornment>
                    ),
                  },
                }}
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
                  disabled={!searched || !getValues("no_rep")}
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
                  disabled={!searched || !getValues("no_rep")}
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
                  expanded={!expand}
                  disabled={!searched || !getValues("no_rep")}
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
                          {...register("no_call")}
                          error={!!errors.no_call}
                          helperText={errors.no_call?.message}
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
                          {...register("pelapor")}
                          error={!!errors.pelapor}
                          helperText={errors.pelapor?.message}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <InputLabel id="waktu_call">Waktu Call</InputLabel>
                        <Controller
                          name="waktu_call"
                          control={control}
                          render={({ field }) => (
                            <DateTimePicker
                              ampm={false}
                              {...field}
                              slotProps={{
                                textField: {
                                  fullWidth: true,
                                  error: !!errors.waktu_call,
                                  helperText: errors.waktu_call?.message,
                                },
                              }}
                            />
                          )}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <InputLabel id="waktu_dtg">
                          Waktu Penjadwalan
                        </InputLabel>
                        <Controller
                          name="waktu_dtg"
                          control={control}
                          render={({ field }) => (
                            <DateTimePicker
                              ampm={false}
                              {...field}
                              onChange={(newValue) => {
                                const now = dayjs();
                                const diffInDays = now.diff(
                                  dayjs(newValue),
                                  "day"
                                );
                                const callTime = watch("waktu_call");

                                if (
                                  diffInDays <
                                  import.meta.env.VITE_FORWARD_PENJADWALAN_DAYS
                                ) {
                                  setAlert({
                                    open: true,
                                    message: `Waktu tidak boleh lebih dari ${
                                      import.meta.env
                                        .VITE_FORWARD_PENJADWALAN_DAYS
                                    } hari ke depan.`,
                                    severity: "error",
                                  });
                                  return;
                                }

                                if (
                                  diffInDays >
                                  import.meta.env.VITE_BACKDATE_DAYS
                                ) {
                                  setAlert({
                                    open: true,
                                    message: `Waktu tidak boleh lebih dari ${
                                      import.meta.env.VITE_BACKDATE_DAYS
                                    } hari ke belakang.`,
                                    severity: "error",
                                  });
                                  return;
                                }

                                if (
                                  callTime &&
                                  dayjs(newValue).isBefore(dayjs(callTime))
                                ) {
                                  setAlert({
                                    open: true,
                                    message:
                                      "Waktu Penjadwalan tidak boleh sebelum Waktu Call.",
                                    severity: "error",
                                  });
                                  return;
                                }

                                field.onChange(newValue); // still update the form
                              }}
                              slotProps={{
                                textField: {
                                  fullWidth: true,
                                  error: !!errors.waktu_dtg,
                                  helperText: errors.waktu_dtg?.message,
                                },
                              }}
                            />
                          )}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <FormControl fullWidth required>
                          <Typography sx={{ color: "rgba(0, 0, 0, 0.6)" }}>
                            Status Call
                          </Typography>
                          <Controller
                            name="status_call"
                            control={control}
                            render={({ field }) => (
                              <Select {...field} variant="outlined">
                                <MenuItem disabled value="">
                                  <em>Pilih Kategori Status Call</em>
                                </MenuItem>
                                {Object.entries(selectStatusCall).map(
                                  ([value, label]) => (
                                    <MenuItem key={value} value={value}>
                                      {label}
                                    </MenuItem>
                                  )
                                )}
                              </Select>
                            )}
                          />
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
                          multiline
                          rows={3}
                          {...register("keluhan")}
                          error={!!errors.keluhan}
                          helperText={errors.keluhan?.message}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <FormControl fullWidth required>
                          <Typography sx={{ color: "rgba(0, 0, 0, 0.6)" }}>
                            Kategori Keluhan
                          </Typography>
                          <Controller
                            name="kat_keluhan"
                            control={control}
                            variant="outlined"
                            render={({ field }) => (
                              <Select {...field}>
                                <MenuItem disabled value="">
                                  <em>Pilih Kategori Keluhan</em>
                                </MenuItem>
                                {Object.entries(selectKeluhan).map(
                                  ([value, label]) => (
                                    <MenuItem key={value} value={value}>
                                      {label}
                                    </MenuItem>
                                  )
                                )}
                              </Select>
                            )}
                          />
                        </FormControl>
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              </Grid>

              {/* Accordion 4 */}
              <Grid size={12}>
                <Accordion
                  expanded={!expand}
                  disabled={!searched || !getValues("no_rep")}
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
                          multiline
                          rows={3}
                          {...register("no_lap")}
                          error={!!errors.no_lap}
                          helperText={errors.no_lap?.message}
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
                          multiline
                          rows={3}
                          {...register("problem")}
                          error={!!errors.problem}
                          helperText={errors.problem?.message}
                        />
                      </Grid>

                      <Grid size={{ xs: 12, md: 6 }}>
                        <FormControl fullWidth required>
                          <Typography sx={{ color: "rgba(0, 0, 0, 0.6)" }}>
                            Kategori Problem
                          </Typography>
                          <Controller
                            name="kat_problem"
                            control={control}
                            variant="outlined"
                            render={({ field }) => (
                              <Select {...field}>
                                <MenuItem disabled value="">
                                  <em>Pilih Kategori Problem</em>
                                </MenuItem>
                                {Object.entries(selectProblem).map(
                                  ([value, label]) => (
                                    <MenuItem key={value} value={value}>
                                      {label}
                                    </MenuItem>
                                  )
                                )}
                              </Select>
                            )}
                          />
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
                          multiline
                          rows={3}
                          {...register("solusi")}
                          error={!!errors.solusi}
                          helperText={errors.solusi?.message}
                        />
                      </Grid>

                      <Grid size={{ xs: 12, md: 6 }}>
                        <InputLabel id="waktu_mulai">Waktu Mulai</InputLabel>
                        <Controller
                          name="waktu_mulai"
                          control={control}
                          render={({ field }) => (
                            <DateTimePicker
                              ampm={false}
                              {...field}
                              slotProps={{
                                textField: {
                                  fullWidth: true,
                                  error: !!errors.waktu_mulai,
                                  helperText: errors.waktu_mulai?.message,
                                },
                              }}
                            />
                          )}
                        />
                      </Grid>

                      <Grid size={{ xs: 12, md: 6 }}>
                        <InputLabel id="waktu_selesai">
                          Waktu Selesai
                        </InputLabel>
                        <Controller
                          name="waktu_selesai"
                          control={control}
                          render={({ field }) => (
                            <DateTimePicker
                              ampm={false}
                              {...field}
                              onChange={(newValue) => {
                                const now = dayjs();
                                const diffInDays = now.diff(
                                  dayjs(newValue),
                                  "day"
                                );
                                const mulaiTime = watch("waktu_mulai");

                                if (
                                  diffInDays < import.meta.env.VITE_FORWARD_DAYS
                                ) {
                                  setAlert({
                                    open: true,
                                    message: `Waktu tidak boleh lebih dari ${
                                      import.meta.env.VITE_FORWARD_DAYS
                                    } hari ke depan.`,
                                    severity: "error",
                                  });
                                  return;
                                }

                                if (
                                  diffInDays >
                                  import.meta.env.VITE_BACKDATE_DAYS
                                ) {
                                  setAlert({
                                    open: true,
                                    message: `Waktu tidak boleh lebih dari ${
                                      import.meta.env.VITE_BACKDATE_DAYS
                                    } hari ke belakang.`,
                                    severity: "error",
                                  });
                                  return;
                                }

                                if (
                                  mulaiTime &&
                                  dayjs(newValue).isBefore(dayjs(mulaiTime))
                                ) {
                                  setAlert({
                                    open: true,
                                    message:
                                      "Waktu Selesai tidak boleh sebelum Waktu Mulai.",
                                    severity: "error",
                                  });
                                  return;
                                }

                                field.onChange(newValue); // still update the form
                              }}
                              slotProps={{
                                textField: {
                                  fullWidth: true,
                                  error: !!errors.waktu_selesai,
                                  helperText: errors.waktu_selesai?.message,
                                },
                              }}
                            />
                          )}
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
                          variant="outlined"
                          fullWidth
                          {...register("count_bw")}
                          error={!!errors.count_bw}
                          helperText={errors.count_bw?.message}
                        />
                      </Grid>

                      <Grid size={{ xs: 12, md: 6 }}>
                        <Typography
                          sx={{ color: "rgba(0, 0, 0, 0.6)" }}
                          id="count_cl"
                        >
                          Counter C/L
                        </Typography>
                        <NumberFormatTextField
                          variant="outlined"
                          fullWidth
                          {...register("count_cl")}
                          error={!!errors.count_cl}
                          helperText={errors.count_cl?.message}
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
                          multiline
                          rows={3}
                          {...register("saran")}
                          error={!!errors.saran}
                          helperText={errors.saran?.message}
                        />
                      </Grid>

                      <Grid size={{ xs: 12, md: 6 }}>
                        <FormControl fullWidth required>
                          <Typography sx={{ color: "rgba(0, 0, 0, 0.6)" }}>
                            Status Result
                          </Typography>
                          <Controller
                            name="status_res"
                            control={control}
                            render={({ field }) => (
                              <Select {...field} variant="outlined">
                                <MenuItem disabled value="">
                                  <em>Pilih Status Result</em>
                                </MenuItem>
                                {Object.entries(selectStatusResult).map(
                                  ([value, label]) => (
                                    <MenuItem key={value} value={value}>
                                      {label}
                                    </MenuItem>
                                  )
                                )}
                              </Select>
                            )}
                          />
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
                            {...register("rep_ke")}
                            aria-readonly
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
                  expanded={!expand}
                  disabled={!searched || !getValues("no_rep")}
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
                    {/* Table */}
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
                  disabled={!searched || !getValues("no_rep")}
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
                          onError={(msg) =>
                            msg
                              ? setAlert({
                                  open: true,
                                  message: msg,
                                  severity: "error",
                                })
                              : null
                          }
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
                disabled={!searched || !getValues("no_rep")}
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
