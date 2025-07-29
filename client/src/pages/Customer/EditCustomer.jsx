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
  FormControl,
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

const EditCustomer = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { alert, showAlert, closeAlert } = useAlert();
  const [loading, setLoading] = useState(false);
  const [idCustomer, setIdCustomer] = useState([]);
  const [kodeArea, setKodeArea] = useState([]);
  const [retry, setRetry] = useState(false);

  const schema = useMemo(() => {
    return yup.object().shape({
      no_cus: yup
        .string()
        .required()
        .test("id-exists", "No Customer Telah Digunakan", function (value) {
          if (!value || !idCustomer) return false;
          const isDuplicate = idCustomer.some((item) => item.no_cus === value);
          return !isDuplicate;
        }),
      no_seri: yup.string().required(),
      nama_cus: yup.string().required(),
      alias: yup.string().required(),
      kode_area: yup.string().required(),
    });
  }, [idCustomer]);

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
      no_seri: "",
      nama_cus: "",
      alias: "",
      kode_area: "",
    },
  });

  useEffect(() => {
    const fetchCustomerById = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}api/get-customer-by-id?id=${id}`
        );

        const data = response.data[0];

        Object.entries(data).forEach(([key, value]) => {
          let parsedValue = value;

          setValue(key, parsedValue, { shouldDirty: true });
        });

        getNoCus(data.no_cus);
      } catch (err) {
        console.error("No data found or is missing");
        showAlert("Gagal mendapat data customer tidak ditemukan.", "error");
      }
    };

    const getNoCus = async (no_cus) => {
      try {
        axios
          .get(
            `${
              import.meta.env.VITE_API_URL
            }api/get-no-customer-edit?no_cus=${no_cus}`
          )
          .then((res) => {
            if (res.data && Array.isArray(res.data) && res.data.length > 0) {
              // Store the array of objects directly
              setIdCustomer(res.data);
            } else {
              setIdCustomer([]);
            }
          });
      } catch (err) {
        console.error("Terjadi kesalahan saat memanggil data customer: ", err);
        showAlert("Terjadi kesalahan saat memanggil data customer", "error");
      }
    };

    const getKodeArea = async () => {
      try {
        axios
          .get(`${import.meta.env.VITE_API_URL}api/get-kode-area`)
          .then((res) => {
            if (res.data && Array.isArray(res.data) && res.data.length > 0) {
              // Store the array of objects directly
              setKodeArea(res.data);
            } else {
              setKodeArea([]);
              showAlert("Data user supervisor belum ada.", "error");
            }
          });
      } catch (err) {
        console.error("Terjadi kesalahan saat memanggil data: ", err);
        showAlert("Terjadi kesalahan saat memanggil data", "error");
      }
    };

    fetchCustomerById();
    getNoCus();
    getKodeArea();
  }, []);

  const onSubmit = async (values) => {
    setLoading(true);
    try {
      const data = new FormData();

      // Append all fields except special ones
      Object.entries(values).forEach(([key, value]) => {
        data.append(key, value);
      });

      // Submit main form
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}api/edit-customer?id=${id}`,
        data,
        { timeout: 5000 }
      );

      if (!response.data.ok) {
        throw new Error("Gagal mengubah data customer.");
      } else {
        setRetry(false);
        navigate("/customer", {
          state: {
            message: "Data customer Berhasil Diubah!",
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
        Edit Customer
      </Typography>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <form
          onSubmit={handleSubmit(onSubmit, onInvalid)}
          encType="multipart/form-data"
        >
          <Grid container spacing={5} marginY={"2em"} alignItems="center">
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
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography sx={{ color: "rgba(0, 0, 0, 0.6)" }} id="nama_cus">
                Nama Customer
              </Typography>
              <TextField
                variant="outlined"
                fullWidth
                {...register("nama_cus")}
                error={!!errors.nama_cus}
                helperText={errors.nama_cus?.message}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography sx={{ color: "rgba(0, 0, 0, 0.6)" }} id="alias">
                Alias
              </Typography>
              <TextField
                variant="outlined"
                fullWidth
                {...register("alias")}
                error={!!errors.alias}
                helperText={errors.alias?.message}
              />
            </Grid>
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

            {kodeArea && (
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="kode_area"
                  control={control}
                  rules={{ required: "Kode Area is required" }} // Add your validation rules here
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
                        {kodeArea.map((item) => (
                          <MenuItem key={item.kode_area} value={item.kode_area}>
                            {item.kode_area}
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

export default EditCustomer;
