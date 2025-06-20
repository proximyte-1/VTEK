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

const EditContract = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { alert, showAlert, closeAlert } = useAlert();
  const [loading, setLoading] = useState(false);
  const [lastCont, setLastCont] = useState();

  const schema = useMemo(() => {
    return yup.object().shape({
      no_seri: yup.string().required(),
      type_service: yup.string().required(),
      masa: yup.number().required(),
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
      no_seri: "",
      type_service: "",
      masa: "",
      tgl_contract: null,
    },
  });

  const noSeri = watch("no_seri");

  useEffect(() => {
    if (noSeri) {
      axios
        .get(
          `${
            import.meta.env.VITE_API_URL
          }api/get-last-contract?no_seri=${noSeri}`
        )
        .then((res) => {
          if (res.data.length === 0) {
            setLastCont(null);
          } else {
            if (res.data.length === 2) {
              const rawDate = res.data?.[0]?.tgl_contract;
              const parsed = dayjs(rawDate);
              setLastCont(parsed);
            }
          }
        });
    }
  }, [noSeri]);

  useEffect(() => {
    const fetchContractById = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}api/get-contract-by-id?id=${id}`
        );

        const data = response.data[0];

        Object.entries(data).forEach(([key, value]) => {
          let parsedValue = value;

          if (["tgl_contract"].includes(key)) {
            parsedValue = value ? dayjs(value) : null;
          }

          setValue(key, parsedValue, { shouldDirty: true });
        });
      } catch (err) {
        console.error("No data found or is missing");
        showAlert("Gagal mendapat data kontrak tidak ditemukan.", "error");
      }
    };

    fetchContractById();
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
        `${import.meta.env.VITE_API_URL}api/edit-contract?id=${id}`,
        data
      );

      if (!response.data.ok) {
        throw new Error("Gagal mengubah data kontrak.");
      } else {
        setLoading(false);
        navigate("/contract", {
          state: {
            message: "Data Kontrak Berhasil Diubah!",
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
        Edit Kontrak
      </Typography>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <form
          onSubmit={handleSubmit(onSubmit, onInvalid)}
          encType="multipart/form-data"
        >
          <Grid container spacing={5} marginY={"2em"} alignItems="center">
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
                    {Object.entries(selectService).map(([value, label]) => (
                      <MenuItem key={value} value={value}>
                        {label}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <InputLabel id="tgl_contract">Tanggal Kontrak</InputLabel>
              <Controller
                name="tgl_contract"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    {...field}
                    format="DD-MM-YYYY"
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
              <Typography sx={{ color: "rgba(0, 0, 0, 0.6)" }} id="masa">
                Masa (Tahun)
              </Typography>
              <TextField
                variant="outlined"
                fullWidth
                type="number"
                {...register("masa")}
                error={!!errors.masa}
                helperText={errors.masa?.message}
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

export default EditContract;
