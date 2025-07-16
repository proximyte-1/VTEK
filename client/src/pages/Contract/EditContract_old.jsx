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
import { useNavigate, useParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import axios from "axios";
import * as yup from "yup";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { maxDateTime, minDateTime, selectService } from "../../utils/constants";
import dayjs from "dayjs";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { ExpandMoreRounded } from "@mui/icons-material";
import { displayValue } from "../../utils/helpers";
import MultipleItemTableInput from "../../components/MultipleTableInput/MultipleItemTableInput";

const EditContract = () => {
  const { id } = useParams();
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

  useEffect(() => {
    const fetchContractById = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}api/get-contract-by-id?id=${id}`
        );

        const data = response.data[0];

        Object.entries(data).forEach(([key, value]) => {
          let parsedValue = value;

          if (["tgl_contract", "tgl_contract_exp"].includes(key)) {
            parsedValue = value ? new Date(value) : null;
          }
          setValue(key, parsedValue, { shouldDirty: true });
        });

        fecthDataMesin();
        fetchCustomerData(data.no_cus);
      } catch (err) {
        console.error("No data found or is missing");
        showAlert("Gagal mendapat data kontrak tidak ditemukan.", "error");
      }
    };

    fetchContractById();
  }, [id]);

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

      if (data?.[0]?.tgl_contract_exp && data.length > 1) {
        setLastCont(data?.[0]?.tgl_contract);
      } else {
        setLastCont(null);
      }
    } catch (error) {
      console.error("Error fetching last contract:", error);
      showAlert("Gagal mengambil service sebelumnya", "error");
    }
  };

  const fetchCustomerData = async (no_cus) => {
    try {
      const noCus = no_cus;

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
      showAlert("Gagal mengambil data dari server", "error");
    } finally {
      setLoading(false);
    }
  };

  const fecthDataMesin = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}api/get-contract-machine`,
        {
          params: {
            id_contract: id,
          },
          timeout: 5000,
        }
      );

      const data = response.data;

      if (data.length <= 0) {
        return;
      } else {
        setValue("no_seri", data);
      }
    } catch (error) {
      console.error("Fetch data mesin : ", error);
    }
  };

  const onSubmit = async (values) => {
    setLoading(true);

    try {
      const data = new FormData();

      // Append all fields except special ones
      Object.entries(values).forEach(([key, value]) => {
        if (key === "no_seri") {
          data.append(key, JSON.stringify(value));
        } else {
          data.append(key, value);
        }
      });

      // Submit main form
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}api/edit-contract`,
        data,
        {
          params: {
            id: id,
          },
          timeout: 5000,
        }
      );

      if (!response.data.ok) {
        throw new Error("Gagal mengubah data kontrak.");
      } else {
        setLoading(false);
        setRetry(false);
        navigate("/contract", {
          state: {
            message: "Data Kontrak Berhasil Diubah!",
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
        Edit Kontrak
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
                disabled
                error={!!errors.no_cus}
                helperText={errors.no_cus?.message}
              />
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
                            <Select {...field} variant="outlined" fullWidth>
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
                              minDate={new Date(minDateTime)}
                              maxDate={new Date(maxDateTime)}
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
                              maxDate={new Date(maxDateTime)}
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

export default EditContract;
