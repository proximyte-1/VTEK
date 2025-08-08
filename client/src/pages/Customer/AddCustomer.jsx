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
  Accordion,
  AccordionDetails,
  AccordionSummary,
} from "@mui/material";
import { useAlert } from "../../utils/alert";
import { data, useNavigate } from "react-router-dom";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import axios from "axios";
import dayjs from "dayjs";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { maxDateTime, minDateTime, selectService } from "../../utils/constants";
import * as yup from "yup";
import MultipleItemTableInput from "../../components/MultipleTableInput/MultipleItemTableInput";
import { ExpandMoreRounded } from "@mui/icons-material";
import { displayValue } from "../../utils/helpers";

const AddCustomer = () => {
  const navigate = useNavigate();

  const { alert, showAlert, closeAlert } = useAlert();
  const [loading, setLoading] = useState(false);
  const [idCustomer, setIdCustomer] = useState([]);
  const [dataCustomer, setDataCustomer] = useState([]);
  const [kodeArea, setKodeArea] = useState([]);
  const [searched, setSearched] = useState(false);
  const [expand, setExpand] = useState(true);
  const [retry, setRetry] = useState(false);

  const schema = useMemo(() => {
    return yup.object().shape({
      no_cus: yup
        .string()
        .required()
        .test("id-exists", "No Customer Sudah Digunakan", function (value) {
          if (!value || !idCustomer) return false;
          const isDuplicate = idCustomer.some((item) => item.no_cus === value);
          return !isDuplicate;
        }),
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
      alias: "",
      kode_area: "",
    },
  });

  useEffect(() => {
    const getNoCus = async () => {
      try {
        axios
          .get(`${import.meta.env.VITE_API_URL}api/get-no-customer`)
          .then((res) => {
            if (res.data && Array.isArray(res.data) && res.data.length > 0) {
              // Store the array of objects directly
              console.log(res.data);
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

    getNoCus();
    getKodeArea();
  }, []);

  const handleSearch = async () => {
    setLoading(true);

    const noCus = getValues("no_cus");

    if (!noCus) {
      showAlert("Terjadi kesalahan saat mencari data.", "error");
      setSearched(false);
      setLoading(false);
      return;
    }

    // Check if no_rep is already used
    if (idCustomer.some((item) => item.no_cus == noCus)) {
      showAlert("Nomor Report Sudah Pernah Dipakai.", "error");
      setSearched(false);
      setLoading(false);
      return;
    }

    try {
      // Fetch customer data
      const customer = await fetchDataCustomer(noCus);

      setDataCustomer(customer);

      setExpand(false);
      setLoading(false);
    } catch (error) {
      console.error("Error in handleSearch:", error);
      showAlert("Terjadi kesalahan saat mencari data.", "error");
      setLoading(false);
    }
  };

  const fetchDataCustomer = async (no_cus) => {
    try {
      const fetch_customer = await axios.get(
        import.meta.env.VITE_API_URL + `api/nav-by-no-cus?no_cus=${no_cus}`
      );
      const data = fetch_customer.data;

      if (data.length <= 0) {
        showAlert("Nomor Customer Belum Ada Pada Navision !", "error");
        setSearched(false);
        return null;
      }

      const customerData = data.data[0];

      showAlert("Nomor Customer Tersedia", "success");
      setSearched(true);
      setDataCustomer(customerData);

      return customerData;
    } catch (error) {
      console.error("Error fetching customer:", error);
      showAlert("Gagal mengambil data dari server", "error");
      setSearched(false);
    }
  };

  const onSubmit = async (values) => {
    setLoading(true);
    try {
      const data = new FormData();

      // Append all fields except special ones
      Object.entries(values).forEach(([key, value]) => {
        data.append(key, value);
      });

      data.append("nama_cus", dataCustomer["d:Sell_to_Customer_Name"]);

      // Submit main form
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}api/create-customer`,
        data,
        { timeout: 5000 }
      );

      if (!response.data.ok) {
        throw new Error("Gagal menyimpan data customer.");
      } else {
        setRetry(false);
        navigate("/customer", {
          state: {
            message: "Data customer Berhasil Ditambahkan!",
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
        Pendaftaran Customer VTK
      </Typography>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <form
          onSubmit={handleSubmit(onSubmit, onInvalid)}
          encType="multipart/form-data"
        >
          <Grid container spacing={5} marginY={"2em"} alignItems="center">
            {/* Input Report */}
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="No. Customer"
                variant="outlined"
                fullWidth
                {...register("no_cus")}
                error={!!errors.no_cus}
                helperText={errors.no_cus?.message}
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
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : "Search"}
              </Button>
            </Grid>
            <Grid container spacing={5} size={12}>
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
                      Detail Customer
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={5}>
                      {/* Row 1 */}
                      <Grid size={{ xs: 12, md: 12 }}>
                        <Typography>
                          Nama Customer :{" "}
                          {displayValue(
                            dataCustomer?.["d:Sell_to_Customer_Name"]
                          )}
                        </Typography>
                        <Typography>
                          Alamat :{" "}
                          {displayValue(dataCustomer?.["d:Sell_to_Address"])}
                        </Typography>
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              </Grid>
              {/* Accordion 2 - Input  */}
              <Grid size={12}>
                <Accordion
                  expanded={!expand}
                  disabled={!searched || !getValues("no_cus")}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreRounded />}
                    aria-controls="panel1-content"
                    id="panel1-header"
                  >
                    <Typography component="span" variant="h5">
                      Data
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={5}>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Typography
                          sx={{ color: "rgba(0, 0, 0, 0.6)" }}
                          id="alias"
                        >
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

                      {kodeArea && (
                        <Grid size={{ xs: 12, md: 6 }}>
                          <Controller
                            name="kode_area"
                            control={control}
                            rules={{ required: "Kode Area is required" }} // Add your validation rules here
                            render={({ field }) => (
                              <FormControl fullWidth error={!!errors.kode_area}>
                                <Typography
                                  sx={{ color: "rgba(0, 0, 0, 0.6)" }}
                                >
                                  Pilih Kode Area
                                </Typography>
                                <Select
                                  id="area-select"
                                  variant="outlined"
                                  {...field}
                                  displayEmpty
                                >
                                  {kodeArea.map((item) => (
                                    <MenuItem key={item.id} value={item.id}>
                                      {item.groups + " - " + item.kode_area}
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

export default AddCustomer;
