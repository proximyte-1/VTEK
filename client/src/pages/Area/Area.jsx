import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
import { useAlert } from "../../utils/alert";
import { Margin } from "@mui/icons-material";
import dayjs from "dayjs";
import EditIcon from "@mui/icons-material/Edit";

const Area = () => {
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
    { field: "groups", headerName: "Group Name", flex: 1 },
    { field: "count", headerName: "Banyak Kode Area", flex: 1 },
    {
      field: "actions",
      headerName: "Actions",
      sortable: false,
      filterable: false,
      flex: 1, // Disables flex shrinking
      width: 100,
      minWidth: 100, // Fallback width
      align: "center",
      renderCell: (params) => (
        <>
          <IconButton
            variant="contained"
            onClick={() => navigate(`edit/${params.row.groups}`)}
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
    async function fetchArea() {
      try {
        const response = await axios.get(
          import.meta.env.VITE_API_URL + `api/get-area`
        );

        // Map over the data to add a unique 'id' to each row
        const dataWithIds = response.data.map((item, index) => ({
          ...item, // Keep all other properties
          id: index, // Add a unique 'id' using the index
        }));

        setDatas(dataWithIds);
      } catch (error) {
        console.error("Error fetching area:", error);
      }
    }

    if (location.state?.message) {
      showAlert(location.state.message, location.state.severity || "info");
    }

    fetchArea();
  }, [location.state]);

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Master Area
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
        New Data
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

export default Area;
