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
import MultipleItemTableInput from "../../components/MultipleTableInput/MultipleItemTableInput";

const AddInstalasi = () => {
  const navigate = useNavigate();

  const { alert, showAlert, closeAlert } = useAlert();
  const [loading, setLoading] = useState(false);
  const [idCont, setIdCont] = useState();
  const [retry, setRetry] = useState(false);

  const schema = useMemo(() => {
    return yup.object().shape({
      id_kontrak: yup
        .string()
        .required()
        .test("id-exists", "No Kontrak Tidak Ditemukan", function (value) {
          if (!value || !idCont) return false;
          return idCont.some((item) => item.id === value);
        }),
      no_seri: yup.array().required(),
      tgl_instalasi: yup.date().required(),
      // lokasi: yup.string().required(),
    });
  }, [idCont]);

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
      id_kontrak: "",
      no_seri: [],
      tgl_instalasi: null,
      // lokasi: "",
    },
  });

  const watchedNoSeri = watch("no_seri");

  useEffect(() => {
    try {
      axios
        .get(`${import.meta.env.VITE_API_URL}api/get-id-contract`)
        .then((res) => {
          if (res.data.length === 0) {
            setIdCont(null);
          } else {
            const data = res.data;
            setIdCont(data);
          }
        });
    } catch (err) {
      console.error("Terjadi kesalahan saat memanggil data: ", err);
      showAlert("Terjadi kesalahan saat memanggil data", "error");
    }
  }, []);

  const checkNoSeri = async (id_kontrak, seri) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}api/get-noseri-contract`,
        {
          params: {
            id_contract: id_kontrak,
          },
        }
      );

      const data = response.data;

      const noSeriInput = seri.map((item) => item.no_seri);
      const noSeriContract = data.map((item) => item.no_seri);

      // Check if every no_seri in noSeriArray exists in targetNoSeri
      const exist = noSeriInput.every((noSeri) =>
        noSeriContract.includes(noSeri)
      );

      return exist;
    } catch (error) {
      console.error("Error for checking the no seri:", error);
      showAlert("Terjadi kesalahan saat memeriksa no seri.", "error");
    }
  };

  const onSubmit = async (values) => {
    setLoading(true);
    try {
      const data = new FormData();

      const contract = getValues("id_kontrak");
      const seri = getValues("no_seri");

      const checked = await checkNoSeri(contract, seri);
      if (!checked) {
        showAlert(
          "No Kontrak dan No Seri tidak cocok. Tolong cek kembali.",
          "error"
        );
        return;
      }

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
        `${import.meta.env.VITE_API_URL}api/create-instalasi`,
        data,
        { timeout: 5000 }
      );

      if (!response.data.ok) {
        throw new Error("Gagal menyimpan data instalasi.");
      } else {
        setRetry(false);
        navigate("/instalasi", {
          state: {
            message: "Data instalasi Berhasil Ditambahkan!",
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
    <Paper sx={{ padding: 3 }} elevation={4}>
      <Typography variant="h5" marginBottom={"1.5em"} gutterBottom>
        New Instalasi
      </Typography>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <form
          onSubmit={handleSubmit(onSubmit, onInvalid)}
          encType="multipart/form-data"
        >
          <Grid container spacing={5} marginY={"2em"} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography sx={{ color: "rgba(0, 0, 0, 0.6)" }} id="id_kontrak">
                No. Kontrak
              </Typography>
              <TextField
                variant="outlined"
                fullWidth
                {...register("id_kontrak")}
                error={!!errors.id_kontrak}
                helperText={errors.id_kontrak?.message}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <InputLabel id="tgl_instalasi">Tanggal Instalasi</InputLabel>
              <Controller
                name="tgl_instalasi"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    {...field}
                    // minDate={new Date(minDateTime)}
                    // onChange={(newValue) =>
                    //   handleDateChange("waktu_sampai", newValue)
                    // }
                    format="DD-MM-YYYY"
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!errors.tgl_instalasi,
                        helperText: errors.tgl_instalasi?.message,
                      },
                    }}
                  />
                )}
              />
            </Grid>

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
              <Typography color="error" variant="body1" sx={{ mt: 0.5, ml: 2 }}>
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

export default AddInstalasi;
