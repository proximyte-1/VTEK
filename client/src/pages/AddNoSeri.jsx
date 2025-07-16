import React, { useEffect, useMemo, useState } from "react";
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
import { useLocation, useNavigate } from "react-router-dom";
import NumberFormatTextField from "../components/NumberFormatTextField/NumberFormatTextField";
import FileUpload from "../components/FileUpload/FileUpload";
import { Controller, useForm } from "react-hook-form";
import * as yup from "yup";
import { yupResolver } from "@hookform/resolvers/yup";
import { useAlert } from "../utils/alert";
import { displayFormatDate, displayValue } from "../utils/helpers";
import axios from "axios";
import {
  maxDateTime,
  minDateTime,
  selectKeluhan,
  selectProblem,
  selectStatusCall,
  selectStatusResult,
} from "../utils/constants";

const AddNoSeri = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Initialize useLocation hook
  const { initialNoSeri } = location.state || {}; // Get initialNoSeri from location state

  const { alert, showAlert, closeAlert } = useAlert();
  const [customer, setDataCustomer] = useState([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastService, setLastService] = useState([]);
  const [contract, setContract] = useState([]);
  const [instalasi, setInstalasi] = useState([]);
  const [expand, setExpand] = useState(true);
  const [retry, setRetry] = useState(false);

  const schemaNoSeri = useMemo(() => {
    return yup.object().shape({
      no_seri: yup.string().required(),
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
      count_bw: yup
        .string()
        .required()
        .test(
          "not-less-than-previous-bw",
          `Tidak boleh kurang dari data sebelumnya (${lastService.count_bw}).`,
          function (value) {
            const { count_bw } = lastService;
            const n_count = Number(count_bw);
            const n_val = Number(value);

            if (n_val === undefined || n_val === null) return false;
            return n_val >= n_count;
          }
        ),
      count_cl: yup
        .string()
        .required()
        .test(
          "not-less-than-previous-cl",
          `Tidak boleh kurang dari data sebelumnya (${lastService.count_cl}).`,
          function (value) {
            const { count_cl } = lastService;
            const n_count = Number(count_cl);
            const n_val = Number(value);

            if (n_val === undefined || n_val === null) return false;
            return n_val >= n_count;
          }
        ),
      saran: yup.string().required(),
      status_res: yup.string().required(),
      rep_ke: yup.number().nullable(),
      pic: yup.mixed().when("$isEdit", {
        is: false, // when not editing, i.e., adding
        then: (schema) =>
          schema
            .required("File bukti harus diunggah.")
            .test(
              "fileType",
              "Hanya file gambar (jpg, png, jpeg, pdf) yang diperbolehkan.",
              (value) => {
                return (
                  value &&
                  [
                    "image/jpeg",
                    "image/png",
                    "image/jpg",
                    "application/pdf",
                  ].includes(value.type)
                );
              }
            )
            .test(
              "fileSize",
              `Ukuran file maksimal ${import.meta.env.VITE_MAX_FILE_MB}MB.`,
              (value) => {
                const max_byte = import.meta.env.VITE_MAX_FILE_MB * 1024 * 1024;
                return value && value.size <= max_byte;
              }
            ),
        otherwise: (schema) => schema.nullable().notRequired(),
      }),
    });
  }, [lastService]);

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
    resolver: yupResolver(schemaNoSeri),
    context: { isEdit: false },
    defaultValues: {
      no_seri: "",
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
      no_fd: "",
      rep_ke: 0,
      pic: null,
    },
  });

  useEffect(() => {
    const loadInitialData = async () => {
      if (initialNoSeri) {
        setLoading(true);
        setValue("no_seri", initialNoSeri);
        try {
          const customer = await fetchDataCustomer(initialNoSeri);
          if (customer) {
            await fetchLastService(displayValue(customer["d:Serial_No"]));
            await fetchDataContract(
              displayValue(customer["d:Sell_to_Customer_No"])
            );
            await fetchDataInstalasi(displayValue(customer["d:Serial_No"]));
            await fetchContRes(
              customer["d:Sell_to_Customer_No"],
              customer["d:Serial_No"]
            );
          }
          setExpand(false);
          setSearched(true); // Set searched to true as data is loaded
        } catch (error) {
          console.error("Error loading initial data:", error);
          showAlert("Terjadi kesalahan saat memuat data awal.", "error");
        } finally {
          setLoading(false);
        }
      }
    };
    loadInitialData();
  }, [initialNoSeri]); // Rerun when initialNoSeri changes

  let statusRes = watch("status_res");

  const fetchDataCustomer = async (id) => {
    try {
      const fetch_customer = await axios.get(
        import.meta.env.VITE_API_URL + `api/nav-data-noseri?id=${id}`
      );
      const data = fetch_customer.data;

      if (data.length <= 0) {
        showAlert("Nomor Seri Belum Ada Pada Navision !", "error");
        setSearched(false);
        return null;
      }

      const customerData = data[0];

      showAlert("Nomor Seri Tersedia", "success");
      setSearched(true);
      setDataCustomer(customerData);

      // Update form values using react-hook-form's setValue
      setValue("no_seri", customerData["d:Serial_No"]);
      setValue("no_cus", customerData["d:Sell_to_Customer_No"]);

      return customerData;
    } catch (error) {
      console.error("Error fetching customer:", error);
      showAlert("Gagal mengambil data dari server", "error");
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

      if (data.length <= 0) {
        setValue("rep_ke", 0);
        return;
      }

      const increment = data[0]["rep_ke"] + 1;

      if (data[0]["status_res"] === "CONT") {
        setValue("rep_ke", increment);
      }
    } catch (error) {
      console.error("Error fetching continuation status:", error);
      showAlert("Gagal mengambil status report sebelumnya", "error");
    }
  };

  const fetchLastService = async (no_seri) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}api/get-last-service`,
        {
          params: {
            no_seri: no_seri,
          },
        }
      );

      const data = response.data;

      if (data.length <= 0) {
        setLastService(null);
        return;
      }

      setLastService(data[0]);
    } catch (error) {
      console.error("Error fetching last service:", error);
      showAlert("Gagal mengambil service sebelumnya", "error");
    }
  };

  const fetchDataContract = async (no_cus) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}api/get-contract-lk`,
        {
          params: {
            no_cus: no_cus,
          },
        }
      );

      const data = response.data;

      if (data.length <= 0) {
        setContract(null);
        return;
      }

      setContract(data[0]);
    } catch (error) {
      console.error("Error fetching contract:", error);
      showAlert("Gagal mengambil data kontrak", "error");
    }
  };

  const fetchDataInstalasi = async (no_seri) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}api/get-instalasi-lk`,
        {
          params: {
            no_seri: no_seri,
          },
        }
      );

      const data = response.data;

      if (data.length <= 0) {
        setInstalasi(null);
        return;
      }

      setInstalasi(data[0]);
    } catch (error) {
      console.error("Error fetching instalation:", error);
      showAlert("Gagal mengambil data instalasi", "error");
    }
  };

  const handleSearch = async () => {
    setLoading(true);

    const noSeri = getValues("no_seri");

    if (!noSeri) {
      showAlert("Terjadi kesalahan saat mencari data.", "error");
      setSearched(false);
      setLoading(false);
      return;
    }

    reset({ no_seri: noSeri });

    try {
      // Fetch customer data
      const customer = await fetchDataCustomer(noSeri);
      if (customer) {
        const dataLastService = await fetchLastService(
          displayValue(customer["d:Serial_No"])
        );

        const dataContract = await fetchDataContract(
          displayValue(customer["d:Sell_to_Customer_No"])
        );

        const dataInstalasi = await fetchDataInstalasi(
          displayValue(customer["d:Serial_No"])
        );

        await fetchContRes(
          customer["d:Sell_to_Customer_No"],
          customer["d:Serial_No"]
        );
      }

      setExpand(false);
      setLoading(false);
    } catch (error) {
      console.error("Error in handleSearch:", error);
      showAlert("Terjadi kesalahan saat mencari data.", "error");
      setLoading(false);
    }
  };

  const handleFileSelect = (file) => {
    setValue("pic", file, { shouldValidate: true });
  };

  const onSubmit = async (values) => {
    setLoading(true);

    try {
      const data = new FormData();

      // Always append the file
      data.append("created_by", 1);
      data.append("type", 2);

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

      const response = await axios.post(
        import.meta.env.VITE_API_URL + `api/create-flk`,
        data
      );

      const { data: result } = response;

      if (!response.data || !result.data?.id) {
        throw new Error("Gagal menyimpan data utama.");
      } else {
        setRetry(false);
        navigate("/flk-no-barang", {
          state: {
            message: "Data Laporan Kerja Berhasil Ditambahkan!",
            severity: "success",
          },
        });
      }
    } catch (error) {
      console.error("Error submitting data:", error);
      if (error.status === 408 || error.code === "ECONNABORTED") {
        showAlert("Request timed out. Tolong coba kembali.", "error");
        setRetry(true);
      } else {
        showAlert("Terjadi kesalahan dalam proses input.", "error");
      }
    } finally {
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
    <Paper sx={{ padding: 3, marginBottom: 5 }} elevation={4}>
      <Typography variant="h5" marginBottom={"1.5em"} gutterBottom>
        New Form Laporan Kerja -- Tanpa Barang --
      </Typography>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <form
          onSubmit={handleSubmit(onSubmit, onInvalid)}
          encType="multipart/form-data"
        >
          <Grid container spacing={5} marginY={"2em"} alignItems="center">
            {/* Input Report */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="No. Seri"
                variant="outlined"
                fullWidth
                {...register("no_seri")}
                error={!!errors.no_seri}
                helperText={errors.no_seri?.message}
                disabled={initialNoSeri ? true : false}
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
                sx={{ marginX: 3 }}
                disabled={loading || (initialNoSeri ? true : false)}
              >
                {loading ? <CircularProgress size={24} /> : "Search"}
              </Button>
              <Button
                type="button"
                name="search"
                id="search"
                variant="contained"
                color="primary"
                onClick={() => navigate("/flk-no-barang/search")}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : "Search By Name"}
              </Button>
            </Grid>
            <Grid container spacing={5}>
              {/* Accordion 1 - Non Input */}
              <Grid size={12}>
                <Accordion
                  disabled={!searched || !getValues("no_seri")}
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
                      {/* Row 2 */}
                      <Grid size={{ xs: 12, md: 6 }}>
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
                  disabled={!searched || !getValues("no_seri")}
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
                      {/* Row 1 */}
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Typography>
                          No Seri : {displayValue(customer?.["d:Serial_No"])}
                        </Typography>
                        <Typography>
                          Nama Mesin :{" "}
                          {displayValue(customer?.["d:Machine_Name"])}
                        </Typography>
                        <Typography>
                          Type : {displayValue(customer?.["d:Machine_Code"])}
                        </Typography>
                      </Grid>

                      {/* Row 2 */}
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Typography>Tanggal Instalasi :</Typography>
                        {displayFormatDate(instalasi?.tgl_instalasi)}
                        <Typography>
                          Tanggal Kontrak :{" "}
                          {displayFormatDate(contract?.tgl_contract_exp)}
                        </Typography>
                        <Typography>
                          Tipe Service :{" "}
                          {displayFormatDate(contract?.type_service)}
                        </Typography>
                      </Grid>

                      {/* Row 3 */}
                      <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                        <Typography>
                          Tanggal Akhir Service :{" "}
                          {displayFormatDate(lastService?.waktu_selesai)}
                        </Typography>
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              </Grid>

              {/* Accordion 2.5  */}
              <Grid size={12}>
                <Accordion
                  expanded={!expand}
                  disabled={!searched || !getValues("no_seri")}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreRounded />}
                    aria-controls="panel1-content"
                    id="panel1-header"
                  >
                    <Typography component="span" variant="h5">
                      Detail Laporan
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
                          type="number"
                          fullWidth
                          {...register("no_lap")}
                          error={!!errors.no_lap}
                          helperText={errors.no_lap?.message}
                        />
                      </Grid>

                      <Grid size={{ xs: 12, md: 6 }}>
                        <Typography
                          sx={{ color: "rgba(0, 0, 0, 0.6)" }}
                          id="no_fd"
                        >
                          No. FreshDesk
                        </Typography>
                        <TextField
                          variant="outlined"
                          type="number"
                          fullWidth
                          {...register("no_fd")}
                          error={!!errors.no_fd}
                          helperText={errors.no_fd?.message}
                        />
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              </Grid>

              {/* Accordion 3 */}
              <Grid size={12}>
                <Accordion
                  disabled={!searched || !getValues("no_seri")}
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
                              minDateTime={new Date(minDateTime)}
                              maxDateTime={new Date(maxDateTime)}
                              format="dd-MM-yy HH:mm"
                              {...field}
                              // onChange={(newValue) => {
                              //   const now = dayjs();
                              //   const diffInDays = now.diff(
                              //     dayjs(newValue),
                              //     "day"
                              //   );

                              //   if (
                              //     diffInDays <
                              //     import.meta.env.VITE_FORWARD_PENJADWALAN_DAYS
                              //   ) {
                              //     showAlert(
                              //       `Waktu tidak boleh lebih dari ${
                              //         import.meta.env
                              //           .VITE_FORWARD_PENJADWALAN_DAYS
                              //       } hari ke depan.`,
                              //       "error"
                              //     );
                              //     return;
                              //   }

                              //   if (
                              //     diffInDays >
                              //     import.meta.env.VITE_BACKDATE_DAYS
                              //   ) {
                              //     showAlert(
                              //       `Waktu tidak boleh lebih dari ${
                              //         import.meta.env.VITE_BACKDATE_DAYS
                              //       } hari ke belakang.`,
                              //       "error"
                              //     );
                              //     return;
                              //   }

                              //   field.onChange(newValue); // still update the form
                              // }}
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
                              minDateTime={new Date(minDateTime)}
                              maxDateTime={new Date(maxDateTime)}
                              format="dd-MM-yy HH:mm"
                              onChange={(newValue) => {
                                const callTime = watch("waktu_call");
                                if (
                                  callTime &&
                                  dayjs(newValue).isBefore(dayjs(callTime))
                                ) {
                                  showAlert(
                                    "Waktu Penjadwalan tidak boleh sebelum Waktu Call.",
                                    "error"
                                  );
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
                  disabled={!searched || !getValues("no_seri")}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreRounded />}
                    aria-controls="panel1-content"
                    id="panel1-header"
                  >
                    <Typography component="span" variant="h5">
                      Detail Hasil Service
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
                              minDateTime={new Date(minDateTime)}
                              maxDateTime={new Date(maxDateTime)}
                              format="dd-MM-yy HH:mm"
                              {...field}
                              // onChange={(newValue) => {
                              //   const now = dayjs();
                              //   const diffInDays = now.diff(
                              //     dayjs(newValue),
                              //     "day"
                              //   );

                              //   if (diffInDays < -maxForwardDays) {
                              //     showAlert(
                              //       `Waktu tidak boleh lebih dari ${maxForwardDays} hari ke depan.`,
                              //       "error"
                              //     );
                              //     return;
                              //   }

                              //   if (diffInDays > maxBackdateDays) {
                              //     showAlert(
                              //       `Waktu tidak boleh lebih dari ${maxBackdateDays} hari ke belakang.`,
                              //       "error"
                              //     );
                              //     return;
                              //   }

                              //   field.onChange(newValue);
                              // }}
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
                              minDateTime={new Date(minDateTime)}
                              maxDateTime={new Date(maxDateTime)}
                              format="dd-MM-yy HH:mm"
                              onChange={(newValue) => {
                                const mulaiTime = watch("waktu_mulai");

                                if (
                                  mulaiTime &&
                                  dayjs(newValue).isBefore(dayjs(mulaiTime))
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
                        <Controller
                          name="count_bw"
                          control={control}
                          render={({ field }) => (
                            <NumberFormatTextField
                              variant="outlined"
                              fullWidth
                              {...field}
                              error={!!errors.count_bw}
                              helperText={errors.count_bw?.message}
                            />
                          )}
                        />
                      </Grid>

                      <Grid size={{ xs: 12, md: 6 }}>
                        <Typography
                          sx={{ color: "rgba(0, 0, 0, 0.6)" }}
                          id="count_cl"
                        >
                          Counter C/L
                        </Typography>
                        <Controller
                          name="count_cl"
                          control={control}
                          render={({ field }) => (
                            <NumberFormatTextField
                              variant="outlined"
                              fullWidth
                              {...field}
                              error={!!errors.count_cl}
                              helperText={errors.count_cl?.message}
                            />
                          )}
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
                            disabled
                          />
                        </Grid>
                      )}
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              </Grid>

              {/* Accordion 5 - Upload File */}
              <Grid size={12}>
                <Accordion
                  disabled={!searched || !getValues("no_seri")}
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
                            msg ? showAlert(msg, "error") : null
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

          <Grid container spacing={5}>
            {/* Submit Button */}
            <Grid size={{ xs: 12, md: 12 }}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={!searched || !getValues("no_seri")}
                sx={{ width: isSmallScreen ? "100%" : "auto" }}
              >
                {loading ? (
                  <CircularProgress size={20} color="inherit" />
                ) : retry ? (
                  "Retry"
                ) : (
                  "Submit"
                )}
              </Button>
            </Grid>
          </Grid>
        </form>
      </LocalizationProvider>
    </Paper>
  );
};

export default AddNoSeri;
