import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Box, Typography, Paper, Button, LinearProgress } from "@mui/material";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import ImageIcon from "@mui/icons-material/Image";

const MAX_FILE_SIZE = import.meta.env.VITE_MAX_FILE_SIZE * 1024 * 1024; // 5MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/jpg",
  "application/pdf",
];

const FileUpload = ({
  onFileSelect,
  onError,
  uploadProgress = 0,
  isUploading = false,
}) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const onDrop = useCallback(
    (acceptedFiles, fileRejections) => {
      const file = acceptedFiles[0];

      if (file) {
        if (!ALLOWED_TYPES.includes(file.type)) {
          onError("Only image and PDF files are allowed.");
          setSelectedFile(null);
          setPreview(null);
          onFileSelect(null);
          return;
        }

        if (file.size > MAX_FILE_SIZE) {
          onError("File must be 5MB or less.");
          setSelectedFile(null);
          setPreview(null);
          onFileSelect(null);
          return;
        }

        setSelectedFile(file);
        onFileSelect(file);
        onError(null); // Clear error

        // Generate preview for images
        if (file.type.startsWith("image/")) {
          const reader = new FileReader();
          reader.onload = () => setPreview(reader.result);
          reader.readAsDataURL(file);
        } else {
          setPreview(null);
        }
      } else if (fileRejections.length > 0) {
        const { errors } = fileRejections[0];
        const message = errors.map((e) => e.message).join(", ");
        onError(message);
        setPreview(null);
      }
    },
    [onFileSelect, onError]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: false,
  });

  const handleRemoveFile = (e) => {
    e.stopPropagation();
    setSelectedFile(null);
    setPreview(null);
    onFileSelect(null);
  };

  const getFileIcon = (file) => {
    if (!file) return <UploadFileIcon fontSize="large" color="action" />;

    if (file.type.startsWith("image/")) {
      return <ImageIcon fontSize="large" color="action" />;
    } else if (file.type === "application/pdf") {
      return <PictureAsPdfIcon fontSize="large" color="action" />;
    }
    return <InsertDriveFileIcon fontSize="large" color="action" />;
  };

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
        {preview ? (
          <Box sx={{ maxWidth: "100%", mb: 2 }}>
            <img
              src={preview}
              alt="Preview"
              style={{
                maxHeight: "200px",
                maxWidth: "100%",
                objectFit: "contain",
              }}
            />
          </Box>
        ) : (
          getFileIcon(selectedFile)
        )}

        <Typography variant="body1" mt={1}>
          {selectedFile
            ? selectedFile.name
            : "Drag & drop a file here or click to select"}
        </Typography>

        {isUploading && (
          <Box sx={{ width: "100%", mt: 2 }}>
            <LinearProgress variant="determinate" value={uploadProgress} />
            <Typography variant="caption" display="block" mt={1}>
              Uploading: {Math.round(uploadProgress)}%
            </Typography>
          </Box>
        )}

        {selectedFile && !isUploading && (
          <Button
            variant="text"
            color="error"
            size="small"
            onClick={handleRemoveFile}
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
