import dayjs from "dayjs";
import * as yup from "yup";

export const columnsBarang = [
  {
    field: "no",
    headerName: "No.",
    sortable: false,
    renderCell: (params) => {
      return params.api.getAllRowIds().indexOf(params.id) + 1;
    },
  },
  {
    field: "kode_part",
    headerName: "Kode Part",
    flex: 1,
    renderCell: ({ row }) => <div>{displayValue(row["d:ItemNo"])}</div>,
  },
  {
    field: "nama_part",
    headerName: "Nama Part",
    flex: 1,
    renderCell: ({ row }) => <div>{displayValue(row["d:Description"])}</div>,
  },
  {
    field: "quantity",
    headerName: "Quantity",
    flex: 1,
    renderCell: ({ row }) => <div>{displayValue(row["d:Quantity"])}</div>,
  },
];

export const schemaNoRep = yup.object().shape({
  no_rep: yup.string().required(),
  no_call: yup.string().required(),
  no_lap: yup.string().required(),
  pelapor: yup.string().required(),
  waktu_call: yup.date().required(),
  waktu_dtg: yup.date().required(),
  status_call: yup.string().required(),
  keluhan: yup.string().required(),
  kat_keluhan: yup.string().required(),
  problem: yup.string().required(),
  kat_problem: yup.string().required(),
  solusi: yup.string().required(),
  waktu_mulai: yup.date().required(),
  waktu_selesai: yup
    .date()
    .min(
      yup.ref("waktu_mulai"),
      "Waktu selesai tidak boleh sebelum waktu mulai"
    ),
  count_bw: yup.string().required(),
  count_cl: yup.string().required(),
  saran: yup.string().required(),
  status_res: yup.string().required(),
  rep_ke: yup.number().nullable(),
  pic: yup.mixed().when("$isEdit", {
    is: false, // when not editing, i.e., adding
    then: (schema) =>
      schema
        .required("File bukti harus diunggah.")
        .test(
          "fileType",
          "Hanya file gambar (jpg, png, jpeg, pdf) yang diperbolehkan.",
          (value) => {
            return (
              value &&
              [
                "image/jpeg",
                "image/png",
                "image/jpg",
                "application/pdf",
              ].includes(value.type)
            );
          }
        )
        .test(
          "fileSize",
          `Ukuran file maksimal ${import.meta.env.VITE_MAX_FILE_MB}MB.`,
          (value) => {
            const max_byte = import.meta.env.VITE_MAX_FILE_MB * 1024 * 1024;
            return value && value.size <= max_byte;
          }
        ),
    otherwise: (schema) => schema.nullable().notRequired(),
  }),
});

export const schemaUsers = yup.object().shape({
  name: yup.string().required(),
  email: yup.string().required(),
  kode_area: yup.string(),
  role: yup.number().required(),
  type: yup.number().required(),
});

export const displayValue = (data) => {
  if (data === null || data === undefined || data === "") return "-";

  // Handle object with `_` field (common in SOAP/XML JSON)
  if (typeof data === "object" && "_" in data) {
    return String(data._).trim();
  }

  // Handle string or number
  if (typeof data === "string" || typeof data === "number") {
    return String(data).trim();
  }

  // Fallback for other objects (e.g., nested structures)
  return "-";
};

export const displayFormatDate = (data) => {
  if (!data) return "-";

  const date = dayjs(data);

  if (!date.isValid()) return "-";

  // If time is 00:00, treat it as date-only
  const hasTime =
    date.hour() !== 7 || date.minute() !== 0 || date.second() !== 0;

  return hasTime ? date.format("DD-MM-YYYY HH:mm") : date.format("DD-MM-YYYY");
};

export const handleFileSelect = (file) => {
  setValue("pic", file, { shouldValidate: true });
};
