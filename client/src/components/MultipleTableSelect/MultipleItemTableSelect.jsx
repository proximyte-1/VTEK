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
  Select,
  MenuItem,
  FormControl,
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
 * @param {Array<object>} props.noSeriOptions - The list of options for the "No. Seri" select dropdown. Each option should be an object.
 * @param {string} props.optionValueKey - The key in each noSeriOption object that holds the value.
 * @param {string} props.optionLabelKey - The key in each noSeriOption object that holds the display label.
 */
function MultipleItemTableSelect({
  value = [],
  onChange,
  noSeriOptions = [],
  optionValueKey = "id",
  optionLabelKey = "label",
}) {
  const [newItem, setNewItem] = useState({
    no_seri: "",
    lokasi: "",
    tgl_instalasi: null, // Initialize with null for DatePicker
  });

  const handleNewItemChange = (event) => {
    const { name, value } = event.target;
    setNewItem((prev) => ({ ...prev, [name]: value }));
  };

  const handleNewItemDateChange = (date) => {
    setNewItem((prev) => ({
      ...prev,
      tgl_instalasi: date, // Day.js object or null
    }));
  };

  const handleAddItem = () => {
    if (newItem.no_seri && newItem.lokasi) {
      const selectedOption = noSeriOptions.find(
        (opt) => opt[optionValueKey] === newItem.no_seri
      );

      // Format the date to 'DD-MM-YYYY' before adding to the list
      const formattedDate = newItem.tgl_instalasi
        ? dayjs(newItem.tgl_instalasi).format("DD-MM-YYYY")
        : null;

      const newItemWithId = {
        ...newItem,
        id: Date.now().toString(),
        no_seri_label: selectedOption ? selectedOption[optionLabelKey] : "",
        tgl_instalasi: formattedDate, // Store the formatted date string
      };
      onChange([...value, newItemWithId]);
      setNewItem({ no_seri: "", lokasi: "", tgl_instalasi: null }); // Reset for next input
    }
  };

  const handleDeleteItem = (idToDelete) => {
    onChange(value.filter((item) => item.id !== idToDelete));
  };

  const handleItemFieldChange = (id, field, itemValue) => {
    onChange(
      value.map((item) => {
        if (item.id === id) {
          const updatedItem = { ...item, [field]: itemValue };
          if (field === "no_seri") {
            const selectedOption = noSeriOptions.find(
              (opt) => opt[optionValueKey] === itemValue
            );
            updatedItem.no_seri_label = selectedOption
              ? selectedOption[optionLabelKey]
              : "";
          }
          return updatedItem;
        }
        return item;
      })
    );
  };

  const handleItemDateChange = (id, date) => {
    // Format the date to 'DD-MM-YYYY' when it's changed in an existing item
    const formattedDate = date ? dayjs(date).format("DD-MM-YYYY") : null;
    onChange(
      value.map((item) =>
        item.id === id ? { ...item, tgl_instalasi: formattedDate } : item
      )
    );
  };

  const selectedSeriValues = value.map((item) => item.no_seri);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box sx={{ width: "100%" }}>
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold" }}>No. Seri</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Lokasi</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>
                  Tanggal Instalasi
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ fontWeight: "bold", width: "100px" }}
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {value.map((item) => {
                const availableOptions = noSeriOptions.filter(
                  (option) =>
                    !selectedSeriValues.includes(option[optionValueKey]) ||
                    option[optionValueKey] === item.no_seri
                );
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <FormControl fullWidth size="small">
                        <Select
                          value={item.no_seri}
                          onChange={(e) =>
                            handleItemFieldChange(
                              item.id,
                              "no_seri",
                              e.target.value
                            )
                          }
                        >
                          {/* Add an empty option for selection if none is picked */}
                          <MenuItem value="">
                            <em>Pilih No. Seri</em>
                          </MenuItem>
                          {availableOptions.map((option) => (
                            <MenuItem
                              key={option[optionValueKey]}
                              value={option[optionValueKey]}
                            >
                              {option[optionLabelKey]}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </TableCell>
                    <TableCell>
                      <TextField
                        value={item.lokasi}
                        onChange={(e) =>
                          handleItemFieldChange(
                            item.id,
                            "lokasi",
                            e.target.value
                          )
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
                        onClick={() => handleDeleteItem(item.id)}
                        color="error"
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
              <TableRow>
                <TableCell>
                  <FormControl fullWidth size="small">
                    <Select
                      name="no_seri"
                      value={newItem.no_seri}
                      onChange={handleNewItemChange}
                      displayEmpty // Allows displaying placeholder when value is empty
                    >
                      <MenuItem value="">
                        <em>Pilih No. Seri</em>
                      </MenuItem>
                      {noSeriOptions
                        .filter(
                          (option) =>
                            !selectedSeriValues.includes(option[optionValueKey])
                        )
                        .map((option) => (
                          <MenuItem
                            key={option[optionValueKey]}
                            value={option[optionValueKey]}
                          >
                            {option[optionLabelKey]}
                          </MenuItem>
                        ))}
                    </Select>
                  </FormControl>
                </TableCell>
                <TableCell>
                  <TextField
                    placeholder="Lokasi"
                    name="lokasi"
                    value={newItem.lokasi}
                    onChange={handleNewItemChange}
                    fullWidth
                    size="small"
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
                    onClick={handleAddItem}
                    color="primary"
                    size="small"
                    disabled={!newItem.no_seri || !newItem.lokasi}
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

export default MultipleItemTableSelect;
