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
  FormControl,
  FormHelperText,
  Autocomplete,
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
import MultipleItemTableInputArea from "../../components/MultipleTableInputArea/MultipleItemTableInputArea";

const AddArea = () => {
  const navigate = useNavigate();

  const { alert, showAlert, closeAlert } = useAlert();
  const [loading, setLoading] = useState(false);
  const [dataUser, setDataUser] = useState([]);
  const [dataSPV, setDataSPV] = useState([]);
  const [dataApprover, setDataApprover] = useState([]);
  const [retry, setRetry] = useState(false);

  const schema = useMemo(() => {
    return yup.object().shape({
      kode_area: yup
        .array()
        .default([])
        .of(
          yup.object().shape({
            id: yup.string().required(), // IDs are generated, but schema should know
            kode_area: yup.string().required("Kode Area is required"),
            nama_area: yup.string().required("Nama Area is required"),
            teknisi: yup
              .array()
              .required("Teknisi is required")
              .min(1, "Minimal 1 teknisi di masukkan."),
          })
        )
        .min(1, "Minimal 1 area di masukkan."),
      groups: yup.string().required(),
      id_supervisor: yup.array().required(),
      id_approver: yup.array().required(),
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
      kode_area: [],
      groups: "",
      id_supervisor: [],
      id_approver: [],
    },
  });

  useEffect(() => {
    const getUserData = () => {
      try {
        axios
          .get(`${import.meta.env.VITE_API_URL}api/get-teknisi`)
          .then((res) => {
            if (res.data.length >= 0) {
              const data = res.data;
              setDataUser(data);
            } else {
              showAlert("Data user teknisi belum ada.", "error");
            }
          });
      } catch (err) {
        console.error("Terjadi kesalahan saat memanggil data: ", err);
        showAlert("Terjadi kesalahan saat memanggil data", "error");
      }
    };

    const getSPVData = () => {
      try {
        axios.get(`${import.meta.env.VITE_API_URL}api/get-spv`).then((res) => {
          if (res.data.length >= 0) {
            const data = res.data;
            setDataSPV(data);
          } else {
            showAlert("Data user supervisor belum ada.", "error");
          }
        });
      } catch (err) {
        console.error("Terjadi kesalahan saat memanggil data: ", err);
        showAlert("Terjadi kesalahan saat memanggil data", "error");
      }
    };

    const getApproverData = () => {
      try {
        axios
          .get(`${import.meta.env.VITE_API_URL}api/get-approver`)
          .then((res) => {
            if (res.data.length >= 0) {
              const data = res.data;
              setDataApprover(data);
            } else {
              showAlert("Data user approver belum ada.", "error");
            }
          });
      } catch (err) {
        console.error("Terjadi kesalahan saat memanggil data: ", err);
        showAlert("Terjadi kesalahan saat memanggil data", "error");
      }
    };

    getUserData();
    getSPVData();
    getApproverData();
  }, []);

  const onSubmit = async (values) => {
    // setLoading(true);
    try {
      const data = new FormData();

      // Append all fields except special ones
      Object.entries(values).forEach(([key, value]) => {
        if (key === "kode_area") {
          data.append(key, JSON.stringify(value));
        } else if (key === "id_supervisor" || key === "id_approver") {
          data.append(key, JSON.stringify(value));
        } else {
          data.append(key, value);
        }
      });

      // Submit main form
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}api/create-area`,
        data,
        { timeout: 5000 }
      );
      if (!response.data.ok) {
        throw new Error("Gagal menyimpan data area.");
      } else {
        setRetry(false);
        navigate("/area", {
          state: {
            message: "Data area Berhasil Ditambahkan!",
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
        New Area
      </Typography>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <form
          onSubmit={handleSubmit(onSubmit, onInvalid)}
          encType="multipart/form-data"
        >
          <Grid container spacing={5} marginY={"2em"} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography sx={{ color: "rgba(0, 0, 0, 0.6)" }} id="groups">
                Group
              </Typography>
              <TextField
                variant="outlined"
                fullWidth
                {...register("groups")}
                error={!!errors.groups}
                helperText={errors.groups?.message}
              />
            </Grid>

            {dataSPV && (
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="id_supervisor"
                  control={control}
                  rules={{ required: "Supervisor is required" }}
                  render={({ field, fieldState: { error } }) => (
                    <>
                      <Typography sx={{ color: "rgba(0, 0, 0, 0.6)" }}>
                        Pilih Supervisor
                      </Typography>
                      <Autocomplete
                        {...field}
                        multiple
                        id="spv-autocomplete"
                        options={dataSPV || []}
                        getOptionLabel={(option) => option.name || ""}
                        isOptionEqualToValue={(option, value) =>
                          option.id === value.id
                        }
                        onChange={(event, newValue) => {
                          // Pass an array of IDs to the form state
                          field.onChange(newValue.map((option) => option.id));
                        }}
                        // The value prop must be an array of objects
                        value={
                          dataSPV.filter((option) =>
                            field.value?.includes(option.id)
                          ) || []
                        }
                        filterSelectedOptions
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            variant="outlined"
                            fullWidth
                            error={!!error}
                            helperText={error ? error.message : null}
                          />
                        )}
                      />
                    </>
                  )}
                />
              </Grid>
            )}

            {dataApprover && (
              <Grid size={{ xs: 12, md: 6 }}>
                <Controller
                  name="id_approver"
                  control={control}
                  rules={{ required: "Approver is required" }}
                  render={({ field, fieldState: { error } }) => (
                    <>
                      <Typography sx={{ color: "rgba(0, 0, 0, 0.6)" }}>
                        Pilih Approver
                      </Typography>
                      <Autocomplete
                        {...field}
                        multiple
                        id="approver-autocomplete"
                        options={dataApprover || []}
                        getOptionLabel={(option) => option.name || ""}
                        isOptionEqualToValue={(option, value) =>
                          option.id === value.id
                        }
                        onChange={(event, newValue) => {
                          // Pass an array of IDs to the form state
                          field.onChange(newValue.map((option) => option.id));
                        }}
                        // The value prop must be an array of objects
                        value={
                          dataApprover.filter((option) =>
                            field.value?.includes(option.id)
                          ) || []
                        }
                        filterSelectedOptions
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            variant="outlined"
                            fullWidth
                            error={!!error}
                            helperText={error ? error.message : null}
                          />
                        )}
                      />
                    </>
                  )}
                />
              </Grid>
            )}

            <Grid container size={{ xs: 12, md: 12 }}>
              <Controller
                name="kode_area" // This name maps to the 'lineItems' in your Yup schema and form data
                control={control}
                render={({ field }) => (
                  <MultipleItemTableInputArea
                    value={field.value} // Pass the array of items from RHF's state to your component
                    onChange={field.onChange} // Pass RHF's onChange to your component for updates
                    teknisiOptions={dataUser}
                  />
                )}
              />
              {/* Display error message for the entire lineItems array if validation fails */}
            </Grid>
            {errors.kode_area && (
              <Typography color="error" variant="body1" sx={{ mt: 0.5, ml: 2 }}>
                {errors.kode_area.message}
              </Typography>
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

export default AddArea;
