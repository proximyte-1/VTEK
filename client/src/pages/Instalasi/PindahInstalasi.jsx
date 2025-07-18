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
import { useNavigate, useParams } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import axios from "axios";
import dayjs from "dayjs";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { maxDateTime, minDateTime, selectService } from "../../utils/constants";
import * as yup from "yup";
import MultipleItemTableInput from "../../components/MultipleTableInput/MultipleItemTableInput";
import MultipleItemTableSelect from "../../components/MultipleTableSelect/MultipleItemTableSelect";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { displayValue } from "../../utils/helpers";

const PindahInstalasi = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { alert, showAlert, closeAlert } = useAlert();
  const [loading, setLoading] = useState(false);
  const [idCont, setIdCont] = useState();
  const [select, setSelect] = useState();
  const [retry, setRetry] = useState(false);

  const schema = useMemo(() => {
    return yup.object().shape({
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
      no_seri: [],
    },
  });

  useEffect(() => {
    try {
      axios
        .get(
          `${
            import.meta.env.VITE_API_URL
          }api/get-instalasi-by-contract?id=${id}`
        )
        .then((res) => {
          const data = res.data;
          const arraySelect = data.map((item) => ({
            id: parseInt(item.id), // Convert id to a number if it's a string
            serial: item.no_seri,
          }));

          if (data.length === 0) {
            setIdCont(null);
            setSelect(null);
          } else {
            setSelect(arraySelect);
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
    // setLoading(true);
    try {
      const data = new FormData();

      // const seri = getValues("no_seri");

      // const checked = await checkNoSeri(contract, seri);
      // if (!checked) {
      //   showAlert(
      //     "No Kontrak dan No Seri tidak cocok. Tolong cek kembali.",
      //     "error"
      //   );
      //   return;
      // }

      // Append all fields except special ones
      Object.entries(values).forEach(([key, value]) => {
        // data.append(key, value);
        if (key === "no_seri") {
          const format = value.map((item) => ({
            id_contract: id,
            no_seri: item.no_seri_label,
            lokasi: item.lokasi,
            tgl_instalasi: item.tgl_instalasi,
          }));

          data.append(key, JSON.stringify(format));
        }
      });

      // Submit main form
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}api/create-pindah-instalasi`,
        data,
        { timeout: 5000 }
      );

      if (!response.data.ok) {
        throw new Error("Gagal menyimpan data instalasi.");
      } else {
        setRetry(false);
        navigate(`/contract/view/${id}`, {
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
    console.log(errors);
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
        Pindah Instalasi
      </Typography>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <form
          onSubmit={handleSubmit(onSubmit, onInvalid)}
          encType="multipart/form-data"
        >
          <Grid container spacing={5} marginY={"2em"} alignItems="center">
            {/* <Grid size={{ xs: 12, md: 6 }}>
              <Typography sx={{ fontWeight: "bold", marginX: 1 }}>
                No. Kontrak : {displayValue(id)}
              </Typography>
            </Grid> */}

            <Grid container size={{ xs: 12, md: 12 }}>
              <Controller
                name="no_seri"
                control={control}
                render={({ field }) => (
                  <MultipleItemTableSelect
                    value={field.value}
                    onChange={field.onChange}
                    noSeriOptions={select}
                    optionValueKey="id"
                    optionLabelKey="serial"
                  />
                )}
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

export default PindahInstalasi;
