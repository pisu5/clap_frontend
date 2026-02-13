import { api } from "./api";

export default function AdminExport() {
  const downloadExcel = async () => {
    const res = await api.get("/export-excel", {
      responseType: "blob",
    });

    const url = window.URL.createObjectURL(
      new Blob([res.data])
    );

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "survey_attempts.xlsx");
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Admin – Export Data</h2>
      <button onClick={downloadExcel}>
        Download Excel
      </button>
    </div>
  );
}
