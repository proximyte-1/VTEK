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
  InputLabel,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";

/**
 * Reusable component for multiple item input in a table-like format.
 * This component is designed to be used with react-hook-form's Controller.
 *
 * @param {object} props
 * @param {Array<object>} props.value - The current array of items, provided by react-hook-form.
 * @param {function} props.onChange - Callback to update react-hook-form's state with the new array of items.
 * @param {Array<string>} props.noSeriOptions - The list of options for the "No. Seri" select dropdown.
 */
function MultipleItemTableSelect_old({
  value = [],
  onChange,
  noSeriOptions = [],
  optionValueKey = "id",
  optionLabelKey = "label",
}) {
  const [newItem, setNewItem] = useState({ no_seri: "", lokasi: "" });

  const handleNewItemChange = (event) => {
    const { name, value } = event.target;
    setNewItem((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddItem = () => {
    if (newItem.no_seri && newItem.lokasi) {
      const selectedOption = noSeriOptions.find(
        (opt) => opt[optionValueKey] === newItem.no_seri
      );
      const newItemWithId = {
        ...newItem,
        id: Date.now().toString(),
        no_seri_label: selectedOption ? selectedOption[optionLabelKey] : "",
      };
      onChange([...value, newItemWithId]);
      setNewItem({ no_seri: "", lokasi: "" });
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

  const selectedSeriValues = value.map((item) => item.no_seri);

  return (
    <Box sx={{ width: "100%" }}>
      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold" }}>No. Seri</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Lokasi</TableCell>
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
                    <FormControl size="small">
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
                        handleItemFieldChange(item.id, "lokasi", e.target.value)
                      }
                      fullWidth
                      size="small"
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
                  <InputLabel>No. Seri</InputLabel>
                  <Select
                    label="No. Seri"
                    name="no_seri"
                    value={newItem.no_seri}
                    onChange={handleNewItemChange}
                  >
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
  );
}

export default MultipleItemTableSelect_old;
