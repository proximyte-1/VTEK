import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Typography,
  Snackbar,
  Alert,
  Box,
  Grid,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  TextField,
} from "@mui/material";
import dayjs from "dayjs";
import { DataGrid } from "@mui/x-data-grid";
import { LocalizationProvider, DatePicker } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { useAlert } from "../../utils/alert";
import { displayValue } from "../../utils/helpers";
import axios from "axios";

const Search = () => {
  const navigate = useNavigate();

  const [filter, setFilter] = useState({
    nama_customer: "",
  });

  const columns = [
    {
      field: "no",
      headerName: "No.",
      sortable: false,
      flex: 0,
      width: 10,
      renderCell: (params) => {
        return params.api.getAllRowIds().indexOf(params.id) + 1;
      },
    },
    {
      field: "d:Sell_to_Customer_No",
      headerName: "No Customer",
      flex: 1,
      width: 100,
      renderCell: (params) => `${displayValue(params.value)}`,
    },
    {
      field: "d:Sell_to_Customer_Name",
      headerName: "Nama Customer",
      flex: 1,
      width: 100,
      renderCell: (params) => `${displayValue(params.value)}`,
    },
    {
      field: "d:Serial_No",
      headerName: "No Seri",
      flex: 1,
      width: 100,
      renderCell: (params) => `${displayValue(params.value)}`,
    },
    {
      field: "d:Sell_to_Address",
      headerName: "Alamat",
      flex: 1,
      width: 100,
      renderCell: (params) => `${displayValue(params.value)}`,
    },
  ];

  const [loading, setLoading] = useState(false);
  const [datas, setDatas] = useState([]);
  const [selected, setSelected] = useState();
  const { alert, showAlert, closeAlert } = useAlert();

  const handleChange = (e) => {
    setFilter({
      ...filter,
      [e.target.name]: e.target.value,
    });
  };

  const handleSeachCustomer = async () => {
    if (!filter.nama_customer || filter.nama_customer.length < 5) {
      showAlert("Minimal 5 character for search", "error");
      return;
    }
    setLoading(true);
    try {
      const nama_cust = filter.nama_customer.toUpperCase();
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}api/nav-by-nama-cus`,
        {
          params: {
            nama_cus: nama_cust,
          },
        }
      );

      const data = response.data;

      if (!data.ok) throw new Error("Search Failed");

      const all_data = data.data;
      const seenCombinations = new Set(); // Use a Set to store unique combinations
      const result = [];

      for (const item of all_data) {
        // Create a unique key for each combination of no_cus and no_seri
        const combinationKey = `${item["d:Sell_to_Customer_No"]}-${item["d:Serial_No"]}`;

        if (!item["d:Sell_to_Customer_No"] || !item["d:Serial_No"]) {
          continue;
        }

        // If the combination has not been seen before, add it to the result and the Set
        if (!seenCombinations.has(combinationKey)) {
          seenCombinations.add(combinationKey);
          result.push(item);
        }
      }

      setDatas(result);
      setLoading(false);
    } catch (error) {
      console.error("Filter error : ", error);
      showAlert("Filter Failed !!", "error");
      setLoading(false);
    }
  };

  const handleSubmit = () => {
    if (!selected) {
      showAlert("No. Seri belum dipilih.", "error");
      return;
    }
    const no_seri = displayValue(selected);
    navigate("/flk-no-barang/add", { state: { initialNoSeri: no_seri } });
  };

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Search Customer
      </Typography>

      <Box>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Grid container spacing={5} marginY={"2em"} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <InputLabel id="nama_customer">Nama Customer</InputLabel>
              <TextField
                variant="outlined"
                fullWidth
                value={filter.nama_customer}
                name="nama_customer"
                onChange={handleChange}
                helperText="Minimum 5 characters"
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Button
                variant="contained"
                color="primary"
                style={{ marginTop: "20px" }}
                onClick={handleSeachCustomer}
              >
                {loading ? (
                  <CircularProgress size={24} color="info" />
                ) : (
                  "Search"
                )}
              </Button>
            </Grid>
          </Grid>
        </LocalizationProvider>
      </Box>
      <Box sx={{ width: "100%", overflowX: "auto" }}>
        <Box sx={{ minWidth: 700 }}>
          <DataGrid
            rows={datas}
            columns={columns}
            getRowId={(row) => datas.indexOf(row)}
            initialState={{
              pagination: {
                paginationModel: {
                  pageSize: 5,
                },
              },
            }}
            pageSizeOptions={[5]}
            onRowClick={(params) => {
              setSelected(params.row["d:Serial_No"]);
              console.log("Row clicked:", params.row);
            }}
          />
        </Box>
      </Box>

      {/* Link to Form Page */}
      <Button
        variant="contained"
        color="primary"
        style={{ marginTop: "20px", marginBottom: "20px" }}
        onClick={handleSubmit}
      >
        {loading ? <CircularProgress size={24} color="info" /> : "Submit"}
      </Button>

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
    </Container>
  );
};

export default Search;
