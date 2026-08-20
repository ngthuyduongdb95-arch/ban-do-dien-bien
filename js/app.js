// ======================================================
// APP.JS
// ======================================================

console.log("WEBGIS APP: Khởi tạo...");

document.addEventListener("DOMContentLoaded", async () => {
    try {
        // 1. Khởi tạo bản đồ nền trước
        initMap();

        // 2. Load dữ liệu Google Sheets
        if (typeof loadSheet === "function") {
            await loadSheet();
        }

        // 3. Load GeoJSON và vẽ lớp dữ liệu
        await loadGeoJSON();

        // 4. Dashboard
        if (typeof dashboard !== "undefined" && typeof dashboard.update === "function") {
            dashboard.update();
        }

        // 5. Các điều khiển bản đồ phụ (nền, fullscreen, xuất ảnh, tìm kiếm...)
        // đã được map.js đăng ký tập trung để tránh gắn sự kiện trùng.

        console.log("WEBGIS APP: Khởi tạo hoàn tất.");
    } catch (err) {
        console.error("WEBGIS APP: Lỗi khởi tạo:", err);
    }
});
