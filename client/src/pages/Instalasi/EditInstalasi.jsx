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
} from "@mui/material";
import { useAlert } from "../../utils/alert";
import { useNavigate, useParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import axios from "axios";
import * as yup from "yup";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { selectService } from "../../utils/constants";
import dayjs from "dayjs";

const EditInstalasi = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { alert, showAlert, closeAlert } = useAlert();
  const [loading, setLoading] = useState(false);
  const [idCont, setIdCont] = useState();

  const schema = useMemo(() => {
    return yup.object().shape({
      id_kontrak: yup
        .string()
        .required()
        .test("id-exists", "No Kontrak Tidak Ditemukan", function (value) {
          if (!value || !idCont) return false;
          return idCont.some((item) => item.id === value);
        }),
      tgl_instalasi: yup.date().required(),
      lokasi: yup.string().required(),
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
      tgl_instalasi: null,
      lokasi: "",
    },
  });

  useEffect(() => {
    const fetchInstalasiById = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}api/get-instalasi-by-id?id=${id}`
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

    const getIdCont = async () => {
      try {
        axios
          .get(`${import.meta.env.VITE_API_URL}api/get-id-contract`)
          .then((res) => {
            console.log(res);
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
    };

    fetchInstalasiById();
    getIdCont();
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
        `${import.meta.env.VITE_API_URL}api/edit-instalasi?id=${id}`,
        data
      );

      if (!response.data.ok) {
        throw new Error("Gagal mengubah data instalasi.");
      } else {
        setLoading(false);
        navigate("/instalasi", {
          state: {
            message: "Data Instalasi Berhasil Diubah!",
            severity: "success",
          },
        });
      }
    } catch (error) {
      console.error("Error submitting data:", error);
      showAlert("Terjadi kesalahan saat mengirim data.", "error");
    }
  };

  const onInvalid = (errors) => {
    // console.log("Form has errors:", errors);
  };

  // Theme and media query for responsiveness
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Paper sx={{ padding: 3 }} elevation={4}>
      <Typography variant="h5" marginBottom={"1.5em"} gutterBottom>
        Edit Instalasi
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

            <Grid size={{ xs: 12, md: 6 }}>
              <Typography sx={{ color: "rgba(0, 0, 0, 0.6)" }} id="lokasi">
                Lokasi
              </Typography>
              <TextField
                variant="outlined"
                fullWidth
                multiline
                rows={3}
                {...register("lokasi")}
                error={!!errors.lokasi}
                helperText={errors.lokasi?.message}
              />
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

export default EditInstalasi;
