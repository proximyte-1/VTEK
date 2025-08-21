import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  TextField,
  Button,
  Grid,
  Typography,
  Paper,
  useTheme,
  useMediaQuery,
  Select,
  MenuItem,
  InputLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  Alert,
  Snackbar,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Link,
  CircularProgress,
  InputAdornment,
  Box,
  Stack,
  Chip,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { ExpandMoreRounded, PauseCircleFilled } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useParams } from "react-router-dom";
import { useAlert } from "../../utils/alert";
import axios from "axios";
import {
  columnsBarang,
  columnsBarangApproval,
  displayFormatDate,
  displayValue,
} from "../../utils/helpers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { useAuth } from "../../utils/auth";
import { DataGrid } from "@mui/x-data-grid";
import DangerousIcon from "@mui/icons-material/Dangerous";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import AccessTimeFilledIcon from "@mui/icons-material/AccessTimeFilled";

const ViewLK = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  let path;

  const { user } = useAuth();
  const { alert, showAlert, closeAlert } = useAlert();
  const [data, setData] = useState([]);
  const [barang, setDataBarang] = useState([]);
  const [customer, setDataCustomer] = useState([]);
  const [searched, setSearched] = useState(true);
  const [loading, setLoading] = useState(false);
  const [contract, setContract] = useState([]);
  const [instalasi, setInstalasi] = useState([]);
  const [area, setArea] = useState([]);
  const [teknisi, setTeknisi] = useState([]);
  const [approver, setApprover] = useState([]);
  const [expand, setExpand] = useState(true);

  useEffect(() => {
    // use for role checking
    if (!user?.role?.includes(3)) {
      // navigate("/", {
      //   state: {
      //     message: "Anda tidak memiliki permission sebagai approver!",
      //     severity: "error",
      //   },
      // });
    }
  }, [user]);

  useEffect(() => {
    const fetchFlkData = async () => {
      try {
        const response = await axios.get(
          import.meta.env.VITE_API_URL + `api/get-flk-one-by-id?${id}`
        );
        const datas = response.data[0];
        console.log(datas);

        if (datas) {
          const fetchApprover = await axios.get(
            import.meta.env.VITE_API_URL +
              `api/get-approver-status?id_appr=${datas.id}`
          );

          const data_appr = fetchApprover.data;

          setData(datas);
          await validationApprover(data_appr, datas.type);

          setApprover(data_appr);

          if (datas.type === 1) {
            await fetchDataBarang(displayValue(datas.id));
          }

          // Fetch related data
          const customer = await fetchDataCustomer(datas.no_cus);
          if (customer) {
            const dataContract = await fetchDataContract(
              displayValue(customer["d:Sell_to_Customer_No"])
            );

            const dataArea = await fetchDataArea(
              displayValue(customer["d:Sell_to_Customer_No"])
            );
          }
          setExpand(false);
        } else {
          console.error("No data found or no_rep is missing");
          showAlert(
            "Gagal mendapat data laporan no rep tidak ditemukan.",
            "error"
          );
        }
      } catch (error) {
        console.error("Fetch failed:", error);
        showAlert("Gagal mendapat data laporan.", "error");
      }
    };

    fetchFlkData(id);
  }, [id, user]);

  const validationApprover = async (data, type_lk) => {
    path = type_lk === 1 ? "/flk" : type_lk === 2 ? "/flk-no-barang" : "/";

    if (
      data.some((item) => item.id_user === user?.id_user) ||
      data.created_by === user?.id_user
    ) {
      const filteredData = data.filter(
        (item) => item.id_user === user?.id_user
      );

      if (filteredData[0].approved === 1 || filteredData[0].approved === 3) {
        navigate(path, {
          state: {
            message: "Anda sudah memproses laporan kerja ini!",
            severity: "warning",
          },
        });
      }
    } else {
      navigate(path, {
        state: {
          message:
            "Anda tidak memiliki permission sebagai approver laporan kerja ini!",
          severity: "error",
        },
      });
    }
  };

  const fetchDataCustomer = async (no_cus) => {
    try {
      const fetch_customer = await axios.get(
        import.meta.env.VITE_API_URL + `api/nav-one-by-no-cus?no_cus=${no_cus}`
      );
      const data = fetch_customer.data.data;

      if (data.length <= 0) {
        throw new Error();
      }

      setDataCustomer(data[0]);
      return data?.[0];
    } catch (error) {
      console.error("Error fetching customer:", error);
    }
  };

  const fetchDataContract = async (no_cus) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}api/get-contract-lk`,
        {
          params: {
            no_cus: no_cus,
          },
        }
      );

      const data = response.data;

      if (data.length <= 0) {
        setContract(null);
        return;
      }

      const dataInstalasi = await fetchDataInstalasi(displayValue(data[0].id));

      setContract(data[0]);
    } catch (error) {
      console.error("Error fetching contract:", error);
      showAlert("Gagal mengambil data kontrak", "error");
    }
  };

  const fetchDataInstalasi = async (id_contract) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}api/get-instalasi-lk`,
        {
          params: {
            id_contract: id_contract,
          },
        }
      );

      const data = response.data;

      if (data.length <= 0) {
        setInstalasi(null);
        return;
      }

      setInstalasi(data[0]);
    } catch (error) {
      console.error("Error fetching instalation:", error);
      showAlert("Gagal mengambil data instalasi", "error");
    }
  };

  const fetchDataArea = async (no_cus) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}api/get-area-lk`,
        {
          params: {
            no_cus: no_cus,
          },
        }
      );

      const data = response.data;

      if (data.length <= 0) {
        setArea(null);
        return;
      }

      setArea(data);
      setTeknisi(data.teknisi);
    } catch (error) {
      console.error("Error fetching data area:", error);
      showAlert("Gagal mengambil data area", "error");
    }
  };

  const fetchDataBarang = async (id) => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}api/get-brg?id=${id}`
      );
      const data = response.data;

      if (data.length <= 0) {
        showAlert("Data barang kosong !!", "error");
        setSearched(false);
        return null;
      }

      const customerData = data[0];
      setSearched(true);
      setDataBarang(data);
    } catch (error) {
      console.error("Error fetching barang:", error);
      showAlert("Gagal mengambil data dari server", "error");
      setSearched(false);
    }
  };

  const handleApprove = async () => {
    setLoading(true);
    try {
      const id_approval = approver.filter(
        (item) => item.id_user === user?.id_user
      );

      const fetch_approve = await axios.get(
        import.meta.env.VITE_API_URL +
          `api/lk-approve?id_approval=${id_approval[0].id}&${id}`
      );
      const response = fetch_approve.data;
      path =
        data.type === 1 ? "/flk" : data.type === 2 ? "/flk-no-barang" : "/";

      if (!response.ok) {
        throw new Error();
      } else {
        navigate(path, {
          state: {
            message: "Laporan kerja berhasil di approve!",
            severity: "success",
          },
        });
      }
    } catch (error) {
      console.error("Error approving data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    console.log("reject");
  };

  // Theme and media query for responsiveness
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Paper sx={{ padding: 3, marginBottom: 5 }} elevation={4}>
      <Typography variant="h5" marginBottom={"1.5em"} gutterBottom>
        View Laporan Kerja
      </Typography>
      <LocalizationProvider dateAdapter={AdapterDateFns}>
        <Grid container spacing={5} marginY={"2em"} alignItems="center">
          <Grid size={12}>
            <Stack direction="row" spacing={2}>
              {approver?.map((item) => (
                <Chip
                  key={item.id}
                  color={
                    item.approved === 1
                      ? "success"
                      : item.approved === 3
                      ? "error"
                      : ""
                  }
                  icon={
                    item.approved === 1 ? (
                      <CheckCircleIcon />
                    ) : item.approved === 3 ? (
                      <DangerousIcon />
                    ) : (
                      <AccessTimeFilledIcon />
                    )
                  }
                  label={item.name}
                />
              ))}
            </Stack>
          </Grid>
          <Grid container spacing={5}>
            {/* Accordion 1 - Data Pelanggan */}
            <Grid size={12}>
              <Accordion disabled={!searched} expanded={!expand}>
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
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Typography>
                        No. Pelanggan :{" "}
                        {displayValue(customer?.["d:Sell_to_Customer_No"])}
                      </Typography>
                      <Typography>
                        Nama Pelanggan :{" "}
                        {displayValue(customer?.["d:Sell_to_Customer_Name"])}
                      </Typography>
                      <Typography>
                        Alias :{" "}
                        {displayValue(customer?.["d:Sell_to_Customer_Name"])}
                      </Typography>
                      <Typography>
                        Alamat : {displayValue(customer?.["d:Sell_to_Address"])}
                      </Typography>
                      <Typography>
                        Penanggung Jawab :{" "}
                        {displayValue(customer?.["d:Penanggung_jawab"])}
                      </Typography>
                    </Grid>
                    {/* Row 2 */}
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Grid>
                        <Typography>
                          Kode Area : {displayValue(area?.kode_area)}
                        </Typography>
                        <Typography>
                          Group : {displayValue(area?.groups)}
                        </Typography>
                      </Grid>
                      <Typography>
                        Supervisor : {displayValue(area?.nama_spv)}
                      </Typography>
                      <Typography>
                        Teknisi : {displayValue(area?.nama_teknisi)}
                      </Typography>
                      <Typography>C.S.O :</Typography>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Grid>

            {/* Accordion 2 - Data Mesin */}
            <Grid size={12}>
              <Accordion disabled={!searched} expanded={!expand}>
                <AccordionSummary
                  expandIcon={<ExpandMoreRounded />}
                  aria-controls="panel1-content"
                  id="panel1-header"
                >
                  <Typography component="span" variant="h5">
                    Detail Mesin
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={5}>
                    {/* Row 1 */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography>
                        No Seri : {displayValue(customer?.["d:Serial_No"])}
                      </Typography>
                      <Typography>
                        Nama Mesin :{" "}
                        {displayValue(customer?.["d:Machine_Name"])}
                      </Typography>
                      <Typography>
                        Type : {displayValue(customer?.["d:Machine_Code"])}
                      </Typography>
                    </Grid>

                    {/* Row 2 */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography>
                        Tanggal Instalasi :
                        {displayFormatDate(instalasi?.tgl_instalasi)}
                      </Typography>
                      <Typography>
                        Tanggal Kontrak :{" "}
                        {displayFormatDate(contract?.tgl_contract_exp)}
                      </Typography>
                      <Typography>
                        Tipe Service :{displayValue(contract?.type_service)}
                      </Typography>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Grid>

            {/* Accordion 3 - Data LK */}
            <Grid size={12}>
              <Accordion disabled={!searched} expanded={!expand}>
                <AccordionSummary
                  expandIcon={<ExpandMoreRounded />}
                  aria-controls="panel1-content"
                  id="panel1-header"
                >
                  <Typography component="span" variant="h5">
                    Detail LK
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={5}>
                    {/* Row 1 */}
                    <Grid size={12}>
                      {data.type === 1 && (
                        <Typography>
                          No. LK : {displayValue(data.no_rep)}
                        </Typography>
                      )}
                      <Typography>
                        No. Laporan : {displayValue(data.no_lap)}
                      </Typography>
                      <Typography>
                        No. FreshDesk : {displayValue(data.no_fd)}
                      </Typography>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Grid>

            {/* Accordion 4 - Data Call */}
            <Grid size={12}>
              <Accordion disabled={!searched} expanded={!expand}>
                <AccordionSummary
                  expandIcon={<ExpandMoreRounded />}
                  aria-controls="panel1-content"
                  id="panel1-header"
                >
                  <Typography component="span" variant="h5">
                    Detail Call
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={5}>
                    {/* Row 1 */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography>
                        No. Call :{displayValue(data?.no_call)}
                      </Typography>
                      <Typography>
                        Pelapor : {displayValue(data?.pelapor)}
                      </Typography>
                      <Typography>
                        Waktu Call :{displayFormatDate(data?.waktu_call)}
                      </Typography>
                      <Typography>
                        Waktu Datang :{displayFormatDate(data?.waktu_selesai)}
                      </Typography>
                      <Typography>
                        Status Call :{displayValue(data?.status_call)}
                      </Typography>
                    </Grid>

                    {/* Row 2 */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography>
                        Keluhan : {displayValue(data?.keluhan)}
                      </Typography>
                      <Typography>
                        Kategori Keluhan :{displayValue(data?.kat_keluhan)}
                      </Typography>
                      <Typography>
                        Problem :{displayValue(data?.problem)}
                      </Typography>
                      <Typography>
                        Kategori Problem :{displayValue(data?.kat_problem)}
                      </Typography>
                      <Typography>
                        Solusi :{displayValue(data?.solusi)}
                      </Typography>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Grid>

            {/* Accordion 5 - Data Hasil */}
            <Grid size={12}>
              <Accordion disabled={!searched} expanded={!expand}>
                <AccordionSummary
                  expandIcon={<ExpandMoreRounded />}
                  aria-controls="panel1-content"
                  id="panel1-header"
                >
                  <Typography component="span" variant="h5">
                    Detail Hasil
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Grid container spacing={5}>
                    {/* Row 1 */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography>
                        Waktu Mulai :{displayFormatDate(data?.waktu_mulai)}
                      </Typography>
                      <Typography>
                        Waktu Selesai : {displayFormatDate(data?.waktu_selesai)}
                      </Typography>
                      <Typography>
                        Count B/W :{displayValue(data?.count_bw)}
                      </Typography>
                      <Typography>
                        Count C/L :{displayValue(data?.count_cl)}
                      </Typography>
                      <Typography>
                        Saran :{displayValue(data?.saran)}
                      </Typography>
                      <Typography>
                        Status Result :{displayValue(data?.status_res)}
                      </Typography>
                    </Grid>

                    <Grid size={12}>
                      <Box
                        sx={{
                          position: "relative",
                          width: "100%",
                          paddingTop: "56.25%", // 16:9 aspect ratio (modify as needed)
                          overflow: "hidden",
                        }}
                      >
                        <img
                          src={`${data.pic}`}
                          alt={`Bukti LK`}
                          loading="lazy"
                          style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            width: "100%",
                            height: "100%",
                            objectFit: "contain", // or 'contain' depending on your preference
                          }}
                        />
                      </Box>
                    </Grid>
                  </Grid>
                </AccordionDetails>
              </Accordion>
            </Grid>

            {/* Accordion 6 - NO REP - Data Barang */}
            {data.type === 1 && (
              <Grid size={12}>
                <Accordion expanded={!expand} disabled={!searched}>
                  <AccordionSummary
                    expandIcon={<ExpandMoreRounded />}
                    aria-controls="panel1-content"
                    id="panel1-header"
                  >
                    <Typography component="span" variant="h5">
                      Detail Barang
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    {/* Table */}
                    <Box sx={{ width: "100%", overflowX: "auto" }}>
                      <Box sx={{ minWidth: 700 }}>
                        <DataGrid
                          rows={barang}
                          columns={columnsBarangApproval}
                          getRowId={(row) => row.id_brg}
                          initialState={{
                            pagination: {
                              paginationModel: {
                                pageSize: 15,
                              },
                            },
                          }}
                          pageSizeOptions={[15]}
                          disableRowSelectionOnClick
                        />
                      </Box>
                    </Box>
                  </AccordionDetails>
                </Accordion>
              </Grid>
            )}
          </Grid>
          {/* Action Button */}
          {!approver?.id_user?.includes(user?.id_user) && (
            <Grid size={{ xs: 12, md: 6 }}>
              <Button
                type="button"
                name="search"
                id="search"
                variant="contained"
                color="success"
                sx={{ marginX: 1 }}
                onClick={handleApprove}
                disabled={loading || expand}
                loading={loading || expand}
              >
                {loading ? <CircularProgress size={24} /> : "Approve"}
              </Button>
              {/* <Button
                type="button"
                name="search"
                id="search"
                variant="contained"
                color="error"
                sx={{ marginX: 1 }}
                onClick={handleReject}
                disabled={loading || expand}
                loading={loading || expand}
              >
                {loading ? <CircularProgress size={24} /> : "Reject"}
              </Button> */}
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
      </LocalizationProvider>
    </Paper>
  );
};

export default ViewLK;
