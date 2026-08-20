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

        // 5. Sự kiện đổi lớp
        const layerSelect = document.getElementById("layerSelect");
        if (layerSelect) {
            layerSelect.addEventListener("change", function () {
                setLayer(this.value);
            });
        }

        // 6. Tìm xã/phường
        const btnSearch = document.getElementById("btnSearch");
        const txtSearch = document.getElementById("txtSearch");

        if (btnSearch && txtSearch) {
            btnSearch.addEventListener("click", () => {
                searchFeature(txtSearch.value);
            });

            txtSearch.addEventListener("keydown", e => {
                if (e.key === "Enter") {
                    searchFeature(e.target.value);
                }
            });
        }

        // 7. Cập nhật dữ liệu
        const btnRefresh = document.getElementById("btnRefresh");
        if (btnRefresh) {
            btnRefresh.addEventListener("click", async () => {
                await reloadData();
            });
        }

        console.log("WEBGIS APP: Khởi tạo hoàn tất.");
    } catch (err) {
        console.error("WEBGIS APP: Lỗi khởi tạo:", err);
    }
});
