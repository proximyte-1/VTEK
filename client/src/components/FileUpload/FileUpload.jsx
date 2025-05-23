import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Box, Typography, Paper, Button } from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";

const MAX_FILE_SIZE = import.meta.env.VITE_MAX_FILE_SIZE * 1024 * 1024; // 5MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/jpg",
  "application/pdf",
];

const FileUpload = ({ onFileSelect, onError }) => {
  const [selectedFile, setSelectedFile] = useState(null);

  const onDrop = useCallback(
    (acceptedFiles, fileRejections) => {
      const file = acceptedFiles[0];

      if (file) {
        if (!ALLOWED_TYPES.includes(file.type)) {
          onError("Only image and PDF files are allowed.");
          setSelectedFile(null);
          onFileSelect(null);
          return;
        }

        if (file.size > MAX_FILE_SIZE) {
          onError("File must be 5MB or less.");
          setSelectedFile(null);
          onFileSelect(null);
          return;
        }

        setSelectedFile(file);
        onFileSelect(file);
        onError(null); // Clear error
      } else if (fileRejections.length > 0) {
        const { errors } = fileRejections[0];
        const message = errors.map((e) => e.message).join(", ");
        onError(message);
      }
    },
    [onFileSelect, onError]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
  });

  return (
    <Paper
      variant="outlined"
      {...getRootProps()}
      sx={{
        p: 3,
        textAlign: "center",
        border: "2px dashed",
        borderColor: isDragActive ? "primary.main" : "grey.400",
        bgcolor: isDragActive ? "grey.100" : "transparent",
        cursor: "pointer",
        mt: 2,
      }}
    >
      <input {...getInputProps()} />
      <Box display="flex" flexDirection="column" alignItems="center">
        <UploadFileIcon fontSize="large" color="action" />
        <Typography variant="body1" mt={1}>
          {selectedFile
            ? selectedFile.name
            : "Drag & drop a file here or click to select"}
        </Typography>
        {selectedFile && (
          <Button
            variant="text"
            color="error"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedFile(null);
              onFileSelect(null);
            }}
            sx={{ mt: 1 }}
          >
            Remove File
          </Button>
        )}
      </Box>
    </Paper>
  );
};

export default FileUpload;
