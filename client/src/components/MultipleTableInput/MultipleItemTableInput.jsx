// MultipleItemTableInput.jsx
import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  IconButton,
  Box,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import dayjs from "dayjs";

/**
 * Reusable component for multiple item input in a table-like format.
 * This component is designed to be used with react-hook-form's Controller.
 *
 * @param {object} props
 * @param {Array<object>} props.value - The current array of items, provided by react-hook-form.
 * @param {function} props.onChange - Callback to update react-hook-form's state with the new array of items.
 */
function MultipleItemTableInput({ value, onChange }) {
  // Local state for the "new item" input fields only
  const [newItem, setNewItem] = useState({
    no_seri: "",
    lokasi: "",
    tgl_instalasi: null, // Initialize with null for Day.js DatePicker
  });

  const handleNewItemChange = (event) => {
    const { name, value } = event.target;
    setNewItem((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleNewItemDateChange = (date) => {
    setNewItem((prev) => ({
      ...prev,
      tgl_instalasi: date, // Day.js object or null
    }));
  };

  const handleAddItem = () => {
    if (newItem.no_seri.trim() !== "" && newItem.lokasi.trim() !== "") {
      // Format the date to 'DD-MM-YYYY' before adding to the list
      const formattedDate = newItem.tgl_instalasi
        ? dayjs(newItem.tgl_instalasi).format("DD-MM-YYYY")
        : null;

      const newItemWithId = {
        ...newItem,
        id: Date.now().toString(),
        tgl_instalasi: formattedDate,
      };
      const updatedItems = [...value, newItemWithId];

      onChange(updatedItems);

      // Clear the local input fields for the next new item
      setNewItem({ no_seri: "", lokasi: "", tgl_instalasi: null });
    }
  };

  const handleDeleteItem = (idToDelete) => {
    const updatedItems = value.filter((item) => item.id !== idToDelete);
    onChange(updatedItems);
  };

  const handleItemFieldChange = (id, field, itemValue) => {
    const updatedItems = value.map((item) =>
      item.id === id ? { ...item, [field]: itemValue } : item
    );
    onChange(updatedItems);
  };

  const handleItemDateChange = (id, date) => {
    // Format the date to 'DD-MM-YYYY' when it's changed in an existing item
    const formattedDate = date ? dayjs(date).format("DD-MM-YYYY") : null;
    const updatedItems = value.map((item) =>
      item.id === id ? { ...item, tgl_instalasi: formattedDate } : item
    );
    onChange(updatedItems);
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ width: "100%" }}>
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="multiple item input table">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold" }}>No. Seri</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Lokasi</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>
                  Tanggal Instalasi
                </TableCell>
                <TableCell align="left" sx={{ fontWeight: "bold" }}>
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {/* Existing Items - rendered from the `value` prop received from Controller */}
              {value.map((item) => (
                <TableRow key={item.id}>
                  <TableCell component="th" scope="row">
                    <TextField
                      variant="outlined"
                      value={item.no_seri}
                      onChange={(e) =>
                        handleItemFieldChange(
                          item.id,
                          "no_seri",
                          e.target.value
                        )
                      }
                      fullWidth
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <TextField
                      variant="outlined"
                      value={item.lokasi}
                      onChange={(e) =>
                        handleItemFieldChange(item.id, "lokasi", e.target.value)
                      }
                      fullWidth
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <DatePicker
                      // Parse the existing string date using the 'DD-MM-YYYY' format
                      value={
                        item.tgl_instalasi
                          ? dayjs(item.tgl_instalasi, "DD-MM-YYYY")
                          : null
                      }
                      onChange={(date) => handleItemDateChange(item.id, date)}
                      slotProps={{
                        textField: { size: "small", fullWidth: true },
                      }}
                      format="DD-MM-YYYY" // Display format
                    />
                  </TableCell>
                  <TableCell align="center">
                    <IconButton
                      aria-label="delete"
                      onClick={() => handleDeleteItem(item.id)}
                      color="error"
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}

              {/* Input Row for New Items */}
              <TableRow>
                <TableCell>
                  <TextField
                    placeholder="No. Seri"
                    variant="outlined"
                    name="no_seri"
                    value={newItem.no_seri}
                    onChange={handleNewItemChange}
                    fullWidth
                    size="small"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddItem();
                      }
                    }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    placeholder="Lokasi"
                    variant="outlined"
                    name="lokasi"
                    value={newItem.lokasi}
                    onChange={handleNewItemChange}
                    fullWidth
                    size="small"
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddItem();
                      }
                    }}
                  />
                </TableCell>
                <TableCell>
                  <DatePicker
                    value={newItem.tgl_instalasi}
                    onChange={handleNewItemDateChange}
                    slotProps={{
                      textField: {
                        size: "small",
                        fullWidth: true,
                        placeholder: "DD-MM-YYYY",
                      },
                    }}
                    format="DD-MM-YYYY" // Display format for new item input
                  />
                </TableCell>
                <TableCell align="center">
                  <IconButton
                    aria-label="add"
                    onClick={handleAddItem}
                    color="primary"
                    size="small"
                    disabled={
                      newItem.no_seri.trim() === "" ||
                      newItem.lokasi.trim() === ""
                    }
                  >
                    <AddCircleOutlineIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </LocalizationProvider>
  );
}

export default MultipleItemTableInput;
