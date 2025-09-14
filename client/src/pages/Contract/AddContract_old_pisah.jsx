import React, { useEffect, useMemo, useState } from "react";
import {
  TextField,
  Button,
  Grid,
  Typography,
  Paper,
  useTheme,
  useMediaQuery,
  Alert,
  Snackbar,
  CircularProgress,
  InputLabel,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
} from "@mui/material";
import { useAlert } from "../../utils/alert";
import { useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import axios from "axios";
import dayjs from "dayjs";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { maxDateTime, minDateTime, selectService } from "../../utils/constants";
import * as yup from "yup";
import { displayValue } from "../../utils/helpers";
import { ExpandMoreRounded } from "@mui/icons-material";
import MultipleItemTableInput from "../../components/MultipleTableInput/MultipleItemTableInput";
import e from "connect-timeout";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

const AddContract = () => {
  const navigate = useNavigate();

  const { alert, showAlert, closeAlert } = useAlert();
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expand, setExpand] = useState(true);
  const [customer, setDataCustomer] = useState([]);
  const [lastCont, setLastCont] = useState();
  const [retry, setRetry] = useState(false);

  const schema = useMemo(() => {
    return yup.object().shape({
      no_cus: yup.string().required(),
      no_seri: yup
        .array()
        // You MUST add .default([]) here
        .default([])
        // Optional: Add validation rules for individual items in the array
        .of(
          yup.object().shape({
            id: yup.string().required(), // IDs are generated, but schema should know
            no_seri: yup.string().required("No. Seri is required"),
            lokasi: yup.string().required("Lokasi is required"),
            tgl_instalasi: yup
              .string()
              .required("Tanggal Instalasi is required"),
          })
        )
        .min(1, "Minimal 1 mesin di masukkan."), // Example: minimum 1 item,
      type_service: yup.string().required(),
      tgl_contract_exp: yup.date().required(),
      tgl_contract: yup
        .date()
        .required("Required")
        .test(
          "after-last-contract",
          `Tanggal Harus Setelah Kontrak Terakhir: ${
            lastCont ? dayjs(lastCont).format("DD-MM-YYYY") : "N/A"
          }`,
          function (value) {
            if (!lastCont || !value) return true;
            return dayjs(value).isAfter(dayjs(lastCont), "day");
          }
        ),
    });
  }, [lastCont]);

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
      no_cus: "",
      no_seri: [],
      type_service: "",
      tgl_contract: null,
      tgl_contract_exp: null,
    },
  });

  // Optional: Watch the lineItems field to display its current value
  const watchedNoSeri = watch("no_seri");
  // const noSeri = watch("no_seri");

  // useEffect(() => {
  //   if (noSeri) {
  //     axios
  //       .get(
  //         `${
  //           import.meta.env.VITE_API_URL
  //         }api/get-last-contract?no_seri=${noSeri}`
  //       )
  //       .then((res) => {
  //         if (res.data.length === 0) {
  //           setLastCont(null);
  //         } else {
  //           const rawDate = res.data?.[0]?.tgl_contract;
  //           const parsed = dayjs(rawDate);
  //           setLastCont(parsed);
  //         }
  //       });
  //   }
  // }, [noSeri]);

  const handleSearch = async () => {
    setLoading(true);

    try {
      const noCus = getValues("no_cus");

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}api/nav-by-no-cus`,
        {
          params: {
            no_cus: noCus,
          },
          timeout: 5000,
        }
      );

      if (!response.data.ok) {
        showAlert("No customer tidak ditemukan dalam Navision.", "error");
        setSearched(false);
      }

      const data = response.data.data[0];
      setDataCustomer(data);
      await fetchLastContract(displayValue(data?.["d:Sell_to_Customer_No"]));

      setSearched(true);
      setExpand(false);
    } catch (error) {
      showAlert("Gagal mengambil data dari server" + error, "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchLastContract = async (no_cus) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}api/get-last-contract`,
        {
          params: {
            no_cus: no_cus,
          },
        }
      );

      const data = response.data;

      if (data.length <= 0) {
        setLastCont(null);
        return;
      }

      if (data?.[0]?.tgl_contract && data.length > 1) {
        setLastCont(data?.[0]?.tgl_contract);
      } else {
        setLastCont(null);
      }
    } catch (error) {
      console.error("Error fetching last contract:", error);
      showAlert("Gagal mengambil service sebelumnya", "error");
    }
  };

  const handleIdContract = async (type_service) => {
    try {
      let id = "";
      const today = dayjs(); // Creates a dayjs object for the current date

      const year = today.format("YY"); // Formats to two-digit year (e.g., "25")
      const month = today.format("MM"); // Formats to two-digit month with leading zero (e.g., "07")

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}api/get-contract-type`,
        {
          params: {
            type: type_service,
          },
        },
        { timeout: 5000 }
      );

      const data = response.data[0];

      if (data.type_name === "RT") {
        id = `${data.last_count}/R/${month}/R/${year}`;
      } else {
        id = `${data.last_count}/PW-${data.type_name}/${year}`;
      }

      const update_counter = await axios.post(
        `${import.meta.env.VITE_API_URL}api/update-contract-counter`,
        {
          type: data.type_name,
          last_count: data.last_count + 1,
        },
        { timeout: 5000 }
      );

      const update = update_counter.data;

      if (update.ok) {
        return id;
      }

      return Error("Gagal menghasilkan id kontrak.");
    } catch (error) {
      showAlert("Gagal menghasilkan id kontrak.", "error");
    }
  };

  const onSubmit = async (values) => {
    // setLoading(true);

    try {
      const data = new FormData();

      // Append all fields except special ones
      for (const [key, value] of Object.entries(values)) {
        // Use for...of
        if (key === "no_seri") {
          data.append(key, JSON.stringify(value));
        } else if (key === "type_service") {
          try {
            const no_contract = await handleIdContract(value); // Await here!
            if (no_contract instanceof Error) {
              // Handle the case where handleIdContract returned an Error object
              console.error(no_contract.message);
              // You might want to stop processing or append a default/error value
              data.append("id", "ERROR_GENERATING_ID");
            } else {
              data.append(key, value);
              data.append("id", no_contract); // Now 'no_contract' is the string
            }
          } catch (error) {
            // handleIdContract also has its own showAlert, but catch here for robust error handling
            console.error("Error generating contract ID:", error);
            data.append("id", "ERROR_GENERATING_ID"); // Append an error placeholder
            // Potentially re-throw or return to stop further processing
          }
        } else {
          data.append(key, value);
        }
      }

      // Submit main form
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}api/create-contract`,
        data,
        { timeout: 5000 }
      );

      if (!response.data.ok) {
        throw new Error("Gagal menyimpan data kontrak.");
      } else {
        setRetry(false);
        navigate("/contract", {
          state: {
            message: "Data Kontrak Berhasil Ditambahkan!",
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
        New Kontrak
      </Typography>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <form
          onSubmit={handleSubmit(onSubmit, onInvalid)}
          encType="multipart/form-data"
        >
          <Grid container spacing={5} marginY={"2em"} alignItems="center">
            {/* Input No Kontrak */}
            {/* Filter */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography sx={{ color: "rgba(0, 0, 0, 0.6)" }} id="no_cus">
                No. Customer
              </Typography>
              <TextField
                variant="outlined"
                fullWidth
                {...register("no_cus")}
                error={!!errors.no_cus}
                helperText={errors.no_cus?.message}
              />
            </Grid>
            {/* Button Search */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Button
                type="button"
                name="search"
                id="search"
                variant="contained"
                color="primary"
                onClick={handleSearch}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : "Search"}
              </Button>
            </Grid>
            <Grid container spacing={5}>
              {/* Accordion 1 - Non Input */}
              <Grid size={12}>
                <Accordion
                  disabled={!searched || !getValues("no_cus")}
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
                      <Grid size={{ xs: 12, md: 12 }}>
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
                      {/* <Grid size={{ xs: 12, md: 6 }}>
                        <Grid>
                          <Typography>Kode Area :</Typography>
                          <Typography>Group :</Typography>
                        </Grid>
                        <Typography>Supervisor :</Typography>
                        <Typography>Teknisi :</Typography>
                        <Typography>C.S.O :</Typography>
                      </Grid> */}
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              </Grid>

              {/* Accordion 2 - Input */}
              <Grid size={12}>
                <Accordion
                  disabled={!searched || !getValues("no_cus")}
                  expanded={!expand}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreRounded />}
                    aria-controls="panel1-content"
                    id="panel1-header"
                  >
                    <Typography component="span" variant="h5">
                      Detail Kontrak
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={5}>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Typography sx={{ color: "rgba(0, 0, 0, 0.6)" }}>
                          Tipe Service
                        </Typography>
                        <Controller
                          name="type_service"
                          control={control}
                          render={({ field }) => (
                            <Select
                              {...field}
                              variant="outlined"
                              fullWidth
                              displayEmpty
                            >
                              <MenuItem disabled value="">
                                <em>Pilih Tipe Service</em>
                              </MenuItem>
                              {Object.entries(selectService).map(
                                ([value, label]) => (
                                  <MenuItem key={value} value={value}>
                                    {label}
                                  </MenuItem>
                                )
                              )}
                            </Select>
                          )}
                        />
                      </Grid>

                      <Grid size={{ xs: 12, md: 6 }}>
                        <InputLabel id="tgl_contract">
                          Tanggal Awal Kontrak
                        </InputLabel>
                        <Controller
                          name="tgl_contract"
                          control={control}
                          render={({ field }) => (
                            <DatePicker
                              {...field}
                              format="dd-MM-yyyy"
                              // minDate={new Date(minDateTime)}
                              // maxDate={new Date(maxDateTime)}
                              onChange={(newValue) => {
                                if (!(newValue <= lastCont)) {
                                  setValue("tgl_contract", newValue);
                                } else {
                                  showAlert(
                                    `Tanggal Harus Setelah Kontrak Terakhir: ${
                                      lastCont
                                        ? dayjs(lastCont).format("DD-MM-YYYY")
                                        : "N/A"
                                    }`,
                                    "error"
                                  );
                                }
                              }}
                              slotProps={{
                                textField: {
                                  fullWidth: true,
                                  error: !!errors.tgl_contract,
                                  helperText: errors.tgl_contract?.message,
                                },
                              }}
                            />
                          )}
                        />
                      </Grid>

                      <Grid size={{ xs: 12, md: 6 }}>
                        <InputLabel id="tgl_contract_exp">
                          Tanggal Akhir Kontrak
                        </InputLabel>
                        <Controller
                          name="tgl_contract_exp"
                          control={control}
                          render={({ field }) => (
                            <DatePicker
                              {...field}
                              format="dd-MM-yyyy"
                              minDate={
                                new Date(watch("tgl_contract") || minDateTime)
                              }
                              // maxDate={new Date(maxDateTime)}
                              onChange={(newValue) => {
                                const awal = watch("tgl_contract");
                                if (
                                  awal &&
                                  dayjs(newValue).isBefore(dayjs(awal))
                                ) {
                                  showAlert(
                                    `Tanggal Akhir Kontrak Tidak Boleh Lebih Kecil Dari Tanggal Awal Kontrak.`,
                                    "error"
                                  );
                                  return;
                                }

                                field.onChange(newValue); // still update the form
                              }}
                              slotProps={{
                                textField: {
                                  fullWidth: true,
                                  error: !!errors.tgl_contract_exp,
                                  helperText: errors.tgl_contract_exp?.message,
                                },
                              }}
                            />
                          )}
                        />
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              </Grid>

              {/* Accordion 3 - No Seri */}
              <Grid size={12}>
                <Accordion
                  disabled={!searched || !getValues("no_cus")}
                  expanded={!expand}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreRounded />}
                    aria-controls="panel1-content"
                    id="panel1-header"
                  >
                    <Typography component="span" variant="h5">
                      Data Mesin
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container size={{ xs: 12, md: 12 }}>
                      <Controller
                        name="no_seri" // This name maps to the 'lineItems' in your Yup schema and form data
                        control={control}
                        render={({ field }) => (
                          <MultipleItemTableInput
                            value={field.value} // Pass the array of items from RHF's state to your component
                            onChange={field.onChange} // Pass RHF's onChange to your component for updates
                          />
                        )}
                      />
                      {/* Display error message for the entire lineItems array if validation fails */}
                    </Grid>
                    {errors.no_seri && (
                      <Typography
                        color="error"
                        variant="body1"
                        sx={{ mt: 0.5, ml: 2 }}
                      >
                        {errors.no_seri.message}
                      </Typography>
                    )}
                    {/* Optional: Display current form state for debugging */}
                    <Box
                      sx={{
                        mt: 4,
                        p: 2,
                        bgcolor: "#f0f0f0",
                        borderRadius: 1,
                        overflowX: "auto",
                      }}
                    >
                      <Typography variant="h6" gutterBottom>
                        Current Form Data (from `useForm` state):
                      </Typography>
                      <pre
                        style={{
                          whiteSpace: "pre-wrap",
                          wordWrap: "break-word",
                        }}
                      >
                        {JSON.stringify(watchedNoSeri, null, 2)}
                      </pre>
                      <Typography variant="h6" sx={{ mt: 2 }} gutterBottom>
                        Form Errors:
                      </Typography>
                      <pre
                        style={{
                          whiteSpace: "pre-wrap",
                          wordWrap: "break-word",
                          color: "red",
                        }}
                      >
                        {JSON.stringify(errors, null, 2)}
                      </pre>
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
                disabled={loading}
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

export default AddContract;
