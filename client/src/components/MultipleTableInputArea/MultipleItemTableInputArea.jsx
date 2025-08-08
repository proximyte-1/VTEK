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
  Autocomplete,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import dayjs from "dayjs";

/**
 * Reusable component for multiple item input in a table-like format.
 * This component is designed to be used with react-hook-form's Controller.
 *
 * @param {object} props
 * @param {Array<object>} props.value - The current array of items, provided by react-hook-form.
 * @param {function} props.onChange - Callback to update react-hook-form's state with the new array of items.
 * @param {Array<object>} props.teknisiOptions - The array of teknisi objects to be used as options for the Autocomplete.
 */
function MultipleItemTableInputArea({ value, onChange, teknisiOptions }) {
  // Local state for the "new item" input fields only
  const [newItem, setNewItem] = useState({
    kode_area: "",
    nama_area: "",
    teknisi: [], // Change to store the selected teknisi object
  });

  const handleNewItemChange = (event) => {
    const { name, value } = event.target;
    setNewItem((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAutocompleteChange = (event, newValue) => {
    setNewItem((prev) => ({
      ...prev,
      teknisi: newValue.map((option) => option.id), // Store the selected teknisi object
    }));
  };

  const handleAddItem = () => {
    if (
      newItem.kode_area.trim() !== "" &&
      newItem.nama_area.trim() !== "" &&
      newItem.teknisi.length > 0
    ) {
      const newItemWithId = {
        ...newItem,
        id: Date.now().toString(),
      };
      const updatedItems = [...value, newItemWithId];

      onChange(updatedItems);

      // Clear the local input fields for the next new item
      setNewItem({ kode_area: "", nama_area: "", teknisi: [] });
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

  // Handler for changes within an existing item's teknisi Autocomplete
  const handleExistingItemAutocompleteChange = (id, newValue) => {
    const updatedItems = value.map((item) =>
      item.id === id
        ? { ...item, teknisi: newValue.map((option) => option.id) }
        : item
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
                <TableCell sx={{ fontWeight: "bold", width: "150px" }}>
                  Kode Area
                </TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Nama Area</TableCell>
                <TableCell sx={{ fontWeight: "bold", width: "450px" }}>
                  Teknisi
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
                      value={item.kode_area}
                      onChange={(e) =>
                        handleItemFieldChange(
                          item.id,
                          "kode_area",
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
                      value={item.nama_area}
                      onChange={(e) =>
                        handleItemFieldChange(
                          item.id,
                          "nama_area",
                          e.target.value
                        )
                      }
                      fullWidth
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Autocomplete
                      multiple
                      filterSelectedOptions
                      id={`teknisi-autocomplete-${item.id}`}
                      options={teknisiOptions || []}
                      getOptionLabel={(option) => option.name || ""}
                      isOptionEqualToValue={(option, selectedValue) =>
                        option.id === selectedValue.id
                      }
                      value={
                        teknisiOptions.filter((option) =>
                          item.teknisi?.includes(option.id)
                        ) || []
                      }
                      onChange={(e, newValue) =>
                        handleExistingItemAutocompleteChange(item.id, newValue)
                      }
                      fullWidth
                      size="small"
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          placeholder="Pilih Teknisi"
                          variant="outlined"
                          size="small"
                        />
                      )}
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
                    placeholder="Kode Area"
                    variant="outlined"
                    name="kode_area"
                    value={newItem.kode_area}
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
                    placeholder="Nama Area"
                    variant="outlined"
                    name="nama_area"
                    value={newItem.nama_area}
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
                  <Autocomplete
                    multiple
                    filterSelectedOptions
                    id="new-item-teknisi-autocomplete"
                    options={teknisiOptions || []}
                    getOptionLabel={(option) => option.name || ""}
                    isOptionEqualToValue={(option, value) =>
                      option.id === value.id
                    }
                    value={
                      teknisiOptions.filter((option) =>
                        newItem.teknisi?.includes(option.id)
                      ) || []
                    }
                    onChange={handleAutocompleteChange}
                    fullWidth
                    size="small"
                    renderInput={(params) => (
                      <TextField
                        placeholder="Pilih Teknisi"
                        {...params}
                        variant="outlined"
                        size="small"
                      />
                    )}
                  />
                </TableCell>
                <TableCell align="center">
                  <IconButton
                    aria-label="add"
                    onClick={handleAddItem}
                    color="primary"
                    size="small"
                    disabled={
                      newItem.nama_area.trim() === "" ||
                      newItem.kode_area.trim() === "" ||
                      newItem.teknisi === null
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

export default MultipleItemTableInputArea;
