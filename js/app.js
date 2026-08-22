"use strict";

console.log("WEBGIS APP: Khởi tạo...");

document.addEventListener("DOMContentLoaded", async () => {
    try {
        initMap();
        const rows = await loadSheet();
        if (!Array.isArray(rows) || rows.length === 0) {
            throw new Error("Không tải được dữ liệu Google Sheets; chưa render bản đồ để tránh hiển thị sai số liệu.");
        }
        await loadGeoJSON();
        if (typeof window.updateDashboard === "function") {
            window.updateDashboard();
        }
        console.log("WEBGIS APP: Khởi tạo hoàn tất.");
    } catch (err) {
        console.error("WEBGIS APP: Lỗi khởi tạo:", err);
    }
});
