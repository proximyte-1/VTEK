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
      field: "d:Sell_to_Address",
      headerName: "Alamat",
      flex: 1,
      width: 100,
      renderCell: (params) => `${displayValue(params.value)}`,
    },
  ];

  const columns_seri = [
    {
      field: "no",
      headerName: "No.",
      sortable: false,
      renderCell: (params) => {
        return params.api.getAllRowIds().indexOf(params.id) + 1;
      },
    },
    {
      field: "d:Serial_No",
      headerName: "No Seri",
      flex: 1,
      width: 100,
      renderCell: (params) => `${displayValue(params.value)}`,
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
  ];

  const [loading, setLoading] = useState(false);
  const [datas, setDatas] = useState([]);
  const [dataNoSeri, setDataNoSeri] = useState([]);
  const [customer, setCustomer] = useState([]);
  const [selected, setSelected] = useState();
  const [no_seri, setNoSeri] = useState();
  const { alert, showAlert, closeAlert } = useAlert();

  const handleChange = (e) => {
    setFilter({
      ...filter,
      [e.target.name]: e.target.value,
    });
  };

  const handleSeachCustomer = async () => {
    setLoading(true);
    setDataNoSeri([]);
    setCustomer([]);
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
      console.log(data);

      if (!data.ok) throw new Error("Search Failed");

      const all_data = data.data;
      const uniqueMap = new Map();

      all_data.forEach((item) => {
        const customerNo = item["d:Sell_to_Customer_No"];

        if (!uniqueMap.has(customerNo)) {
          uniqueMap.set(customerNo, item);
        }
      });

      const uniqueData = Array.from(uniqueMap.values());

      setDatas(all_data);
      setCustomer(uniqueData);
      setLoading(false);
    } catch (error) {
      console.error("Filter error : ", error);
      showAlert("Filter Failed !!", "error");
      setLoading(false);
    }
  };

  const handleSearchNoSeri = async () => {
    setLoading(true);
    setDataNoSeri([]);
    try {
      const no_cus = selected;
      const map_data = new Map();
      const uniqueMap = new Map();

      datas.forEach((item) => {
        if (item["d:Sell_to_Customer_No"] === no_cus) {
          map_data.set(item);

          const noSeri = item["d:Serial_No"];

          if (!uniqueMap.has(noSeri)) {
            uniqueMap.set(noSeri, item);
          }
        }
      });

      const uniqueData = Array.from(uniqueMap.values());

      setDataNoSeri(uniqueData);
      setLoading(false);
    } catch (error) {
      console.error("Filter error : ", error);
      showAlert("Filter Failed !!", "error");
      setLoading(false);
    }
  };

  const handleSubmit = () => {
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
            rows={customer}
            columns={columns}
            getRowId={(row) => customer.indexOf(row)}
            initialState={{
              pagination: {
                paginationModel: {
                  pageSize: 5,
                },
              },
            }}
            pageSizeOptions={[5]}
            onRowClick={(params) => {
              setSelected(params.row["d:Sell_to_Customer_No"]);
              // console.log("Row clicked:", params.row);
            }}
          />
        </Box>
      </Box>

      {/* Link to Form Page */}
      <Button
        variant="contained"
        color="primary"
        style={{ marginTop: "20px", marginBottom: "20px" }}
        onClick={handleSearchNoSeri}
      >
        {loading ? (
          <CircularProgress size={24} color="info" />
        ) : (
          "Search No Seri"
        )}
      </Button>

      {/* No Seri */}
      <Box sx={{ width: "100%", overflowX: "auto" }}>
        <Box sx={{ minWidth: 700 }}>
          <DataGrid
            rows={dataNoSeri}
            columns={columns_seri}
            getRowId={(row) => dataNoSeri.indexOf(row)}
            initialState={{
              pagination: {
                paginationModel: {
                  pageSize: 5,
                },
              },
            }}
            pageSizeOptions={[5]}
            onRowClick={(params) => {
              setNoSeri(params.row["d:Serial_No"]);
              // console.log("Row clicked:", params.row);
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
