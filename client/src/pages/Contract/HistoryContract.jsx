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

const HistoryContract = () => {
  const { id } = useParams();

  const { alert, showAlert, closeAlert } = useAlert();
  const [data, setData] = useState([]);
  const [expand, setExpand] = useState(true);

  useEffect(() => {
    const fetchMachineHistory = async () => {
      try {
        const response = await axios.get(
          `${
            import.meta.env.VITE_API_URL
          }api/get-contract-machine-history-by-id?id_contract=${id}`
        );

        const data = response.data;

        const grouped = data.reduce((acc, currentItem) => {
          const { no_seri } = currentItem;
          if (!acc[no_seri]) {
            acc[no_seri] = [];
          }
          acc[no_seri].push(currentItem);
          return acc;
        }, {});
        setData(grouped);
      } catch (err) {
        console.error("No data found or is missing");
        showAlert("Gagal mendapat data mesin tidak ditemukan.", "error");
      }
    };

    fetchMachineHistory();
  }, [id]);

  const uniqueNoSeri = Object.keys(data);

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  return (
    <Paper sx={{ padding: 3, marginBottom: 5 }} elevation={4}>
      <Typography variant="h5" marginBottom={"1.5em"} gutterBottom>
        Historis Mesin
      </Typography>
      <Grid container spacing={5} marginY={"2em"} alignItems="center">
        <Grid container spacing={5}>
          {uniqueNoSeri.length === 0 ? (
            <Grid size={12}>
              <Typography>No machine data available.</Typography>
            </Grid>
          ) : (
            uniqueNoSeri.map((noSeri) => (
              <Grid size={12} key={noSeri}>
                <Accordion expanded={expand}>
                  <AccordionSummary
                    expandIcon={<ExpandMoreRounded />}
                    aria-controls={`${noSeri}-content`}
                    id={`${noSeri}-header`}
                  >
                    <Typography component="span" variant="h5">
                      {noSeri} {/* Display the unique no_seri */}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <TableContainer
                      component={Paper}
                      sx={{ borderRadius: "0 0 8px 8px" }}
                    >
                      <Table
                        sx={{ minWidth: 650 }}
                        aria-label={`data for machine ${noSeri}`}
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
                            {/* Add other headers if needed */}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {data[noSeri]?.map((row) => (
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
            ))
          )}
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
    </Paper>
  );
};

export default HistoryContract;
