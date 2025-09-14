import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Container,
  Button,
  Typography,
  Snackbar,
  Alert,
  Box,
  IconButton,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import axios from "axios";
import { useAlert } from "../../../utils/alert";
import { Margin } from "@mui/icons-material";
import dayjs from "dayjs";
import VisibilityIcon from "@mui/icons-material/Visibility";
import EditIcon from "@mui/icons-material/Edit";

const CustomerContract = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const columns = [
    {
      field: "no",
      headerName: "No.",
      sortable: false,
      renderCell: (params) => {
        return params.api.getAllRowIds().indexOf(params.id) + 1;
      },
    },
    { field: "no_contract", headerName: "No. Kontrak", flex: 1 },
    { field: "type_service", headerName: "Status Kontrak", flex: 1 },
    {
      field: "tgl_contract",
      headerName: "Tanggal Kontrak",
      flex: 1,
      renderCell: (params) =>
        params.value ? dayjs(params.value).format("DD-MM-YYYY") : "-",
    },
    {
      field: "actions",
      headerName: "Actions",
      sortable: false,
      filterable: false,
      flex: 1,
      align: "center",
      renderCell: (params) => (
        <>
          <IconButton
            variant="contained"
            sx={{ marginX: 0.5 }}
            onClick={() => navigate(`view/${params.row.id}`)}
          >
            <VisibilityIcon />
          </IconButton>

          <IconButton
            variant="contained"
            sx={{ marginX: 0.5 }}
            onClick={() => navigate(`edit/${params.row.id}`)}
          >
            <EditIcon />
          </IconButton>
        </>
      ),
    },
  ];

  const { alert, showAlert, closeAlert } = useAlert();

  const [datas, setDatas] = useState([]);

  useEffect(() => {
    async function fetchContract() {
      try {
        const response = await axios.get(
          import.meta.env.VITE_API_URL +
            `api/get-contract-by-customer-id?id=${id}`
        );

        setDatas(response.data);
      } catch (error) {
        console.error("Error fetching contract:", error);
      }
    }

    if (location.state?.message) {
      showAlert(location.state.message, location.state.severity || "info");
    }

    fetchContract();
  }, [location.state]);

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        List Kontrak
      </Typography>
      <Box sx={{ width: "100%", overflowX: "auto" }}>
        <Box sx={{ minWidth: 700 }}>
          <DataGrid
            rows={datas}
            columns={columns}
            getRowId={(row) => row.id}
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

      {/* Link to Form Page */}
      <Button
        variant="contained"
        color="primary"
        style={{ marginTop: "20px", marginBottom: "20px" }}
        onClick={() => navigate(`add`)}
      >
        New
      </Button>

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

export default CustomerContract;
