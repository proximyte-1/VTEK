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
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
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
import { displayFormatDate, displayValue } from "../../utils/helpers";
import MultipleItemTableInput from "../../components/MultipleTableInput/MultipleItemTableInput";

const ViewContract = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { alert, showAlert, closeAlert } = useAlert();
  const [data, setData] = useState([]);
  const [machine, setMachine] = useState([]);
  const [loading, setLoading] = useState(false);
  const [expand, setExpand] = useState(true);
  const [customer, setDataCustomer] = useState([]);

  useEffect(() => {
    const fetchContractById = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}api/get-contract-by-id?id=${id}`
        );

        const data = response.data[0];

        if (data) {
          setData(data);
        }

        fecthDataMesin();
        fetchCustomerData(data.no_cus);
      } catch (err) {
        console.error("No data found or is missing");
        showAlert("Gagal mendapat data kontrak tidak ditemukan.", "error");
      }
    };

    fetchContractById();
  }, [id]);

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
      }

      const data = response.data.data[0];
      setDataCustomer(data);

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
      console.log();

      if (data.length <= 0) {
        return;
      } else {
        setMachine(data);
      }
    } catch (error) {
      console.error("Fetch data mesin : ", error);
    }
  };

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Paper sx={{ padding: 3, marginBottom: 5 }} elevation={4}>
      <Typography variant="h5" marginBottom={"1.5em"} gutterBottom>
        View Kontrak - {data.no_contract}
      </Typography>
      <Grid container spacing={5} marginY={"2em"} alignItems="center">
        <Grid container spacing={5}>
          {/* Accordion 1 - Non Input */}
          <Grid size={12}>
            <Accordion expanded={!expand} sx={{ width: "100%" }}>
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
                    <Typography id="no_cus">
                      No. Customer : {displayValue(data?.no_cus)}
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
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Grid>

          {/* Accordion 2 - Input */}
          <Grid size={12}>
            <Accordion expanded={!expand}>
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
                {/* Row 1 */}
                <Grid size={{ xs: 12, md: 12 }}>
                  <Typography>
                    Type Service : {displayValue(data?.type_service)}
                  </Typography>
                  <Typography>
                    Tanggal Awal Kontrak :{" "}
                    {displayFormatDate(data?.tgl_contract)}
                  </Typography>
                  <Typography>
                    Tanggal Akhir Kontrak :{" "}
                    {displayFormatDate(data?.tgl_contract_exp)}
                  </Typography>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Grid>

          {/* Accordion 3 - Data Mesin */}
          <Grid size={12}>
            {/* Accordion component */}
            <Accordion expanded={!expand}>
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
                {/* Table to display the data */}
                <TableContainer
                  component={Paper}
                  sx={{ borderRadius: "0 0 8px 8px" }}
                >
                  <Table
                    sx={{ minWidth: 650 }}
                    aria-label="contract data table"
                  >
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: "bold" }}>
                          No. Seri
                        </TableCell>
                        <TableCell sx={{ fontWeight: "bold" }}>
                          Lokasi
                        </TableCell>
                        <TableCell sx={{ fontWeight: "bold" }}>
                          Tanggal Instalasi
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {machine?.map((row) => (
                        <TableRow key={row.id}>
                          <TableCell>{row.no_seri}</TableCell>
                          <TableCell>{row.lokasi}</TableCell>
                          <TableCell>
                            {displayFormatDate(row.tgl_instalasi)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
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
        <Grid size={{ xs: 12, md: 12 }}>
          <Button
            type="button"
            variant="contained"
            color="primary"
            disabled={loading}
            sx={{ width: isSmallScreen ? "100%" : "auto", marginX: 1 }}
            onClick={() => navigate(`/contract/instalasi/${id}`)}
          >
            Pindah Instalasi
          </Button>

          <Button
            type="button"
            variant="contained"
            color="primary"
            disabled={loading}
            sx={{ width: isSmallScreen ? "100%" : "auto" }}
            onClick={() => navigate(`/contract/view-origin/${id}`)}
          >
            Kontrak Awal
          </Button>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default ViewContract;
