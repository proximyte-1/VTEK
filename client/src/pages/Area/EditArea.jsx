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
  FormHelperText,
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
import { FormatAlignCenter } from "@mui/icons-material";

const EditArea = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { alert, showAlert, closeAlert } = useAlert();
  const [loading, setLoading] = useState(false);
  const [dataUser, setDataUser] = useState([]);
  const [retry, setRetry] = useState(false);

  const schema = useMemo(() => {
    return yup.object().shape({
      kode_area: yup.string().required(),
      nama_area: yup.string().required(),
      groups: yup.string().required(),
      id_supervisor: yup.number().required(),
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
      kode_area: "",
      nama_area: "",
      groups: "",
      id_supervisor: "",
    },
  });

  useEffect(() => {
    const fetchAreaById = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}api/get-area-by-id?id=${id}`
        );

        const data = response.data[0];

        Object.entries(data).forEach(([key, value]) => {
          let parsedValue = value;

          if (["tgl_instalasi"].includes(key)) {
            parsedValue = value ? dayjs(value) : null;
          }

          setValue(key, parsedValue, { shouldDirty: true });
        });
      } catch (err) {
        console.error("No data found or is missing");
        showAlert("Gagal mendapat data instalasi tidak ditemukan.", "error");
      }
    };

    const fetchUserData = async () => {
      try {
        axios
          .get(`${import.meta.env.VITE_API_URL}api/get-users`)
          .then((res) => {
            if (res.data.length >= 0) {
              const data = res.data;
              setDataUser(data);
            }
          });
      } catch (err) {
        console.error("Terjadi kesalahan saat memanggil data: ", err);
        showAlert("Terjadi kesalahan saat memanggil data", "error");
      }
    };

    fetchAreaById();
    fetchUserData();
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
        `${import.meta.env.VITE_API_URL}api/edit-area?id=${id}`,
        data,
        { timeout: 5000 }
      );

      if (!response.data.ok) {
        throw new Error("Gagal mengubah data Area.");
      } else {
        setRetry(false);
        navigate("/area", {
          state: {
            message: "Data Area Berhasil Diubah!",
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
        Edit Area
      </Typography>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <form
          onSubmit={handleSubmit(onSubmit, onInvalid)}
          encType="multipart/form-data"
        >
          <Grid container spacing={5} marginY={"2em"} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography sx={{ color: "rgba(0, 0, 0, 0.6)" }} id="kode_area">
                Kode Area
              </Typography>
              <TextField
                variant="outlined"
                fullWidth
                {...register("kode_area")}
                error={!!errors.kode_area}
                helperText={errors.kode_area?.message}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Typography sx={{ color: "rgba(0, 0, 0, 0.6)" }} id="nama_area">
                Nama Area
              </Typography>
              <TextField
                variant="outlined"
                fullWidth
                {...register("nama_area")}
                error={!!errors.nama_area}
                helperText={errors.nama_area?.message}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Typography sx={{ color: "rgba(0, 0, 0, 0.6)" }} id="groups">
                Group
              </Typography>
              <TextField
                variant="outlined"
                maxLength="5"
                fullWidth
                {...register("groups")}
                error={!!errors.groups}
                helperText={errors.groups?.message}
              />
            </Grid>

            {dataUser && (
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="id_supervisor"
                  control={control}
                  rules={{ required: "Supervisor is required" }} // Add your validation rules here
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.id_supervisor}>
                      <Typography sx={{ color: "rgba(0, 0, 0, 0.6)" }}>
                        Pilih Supervisor
                      </Typography>
                      <Select
                        id="supervisor-select"
                        variant="outlined"
                        {...field}
                        displayEmpty
                      >
                        {dataUser.map((item) => (
                          <MenuItem key={item.id} value={item.id}>
                            {item.name}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.id_supervisor && (
                        <FormHelperText>
                          {errors.id_supervisor?.message}
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

export default EditArea;
