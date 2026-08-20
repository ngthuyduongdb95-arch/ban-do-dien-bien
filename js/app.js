// ======================================================
// APP.JS
// ======================================================

console.log("WEBGIS APP: Khởi tạo...");

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        // ==================================================
        // 1. KHỞI TẠO BẢN ĐỒ
        // ==================================================

        try {

            if (
                typeof initMap ===
                "function"
            ) {

                initMap();

            }

        }
        catch (error) {

            console.error(
                "Lỗi khởi tạo bản đồ:",
                error
            );

        }


        // ==================================================
        // 2. TẢI GOOGLE SHEETS
        //    TẢI XONG LÀ CẬP NHẬT KPI NGAY
        // ==================================================

        try {

            if (
                typeof loadSheet ===
                "function"
            ) {

                await loadSheet();

                console.log(
                    "Google Sheets:",
                    Object.keys(
                        window.sheetData || {}
                    ).length,
                    "xã/phường"
                );

            }


            // KPI cập nhật độc lập với GeoJSON

            if (
                typeof dashboard !==
                "undefined" &&
                typeof dashboard.update ===
                "function"
            ) {

                dashboard.update();

            }

        }
        catch (error) {

            console.error(
                "Lỗi tải Google Sheets:",
                error
            );

        }


        // ==================================================
        // 3. TẢI GEOJSON
        //    Nếu GeoJSON lỗi cũng KHÔNG làm mất KPI
        // ==================================================

        try {

            if (
                typeof loadGeoJSON ===
                "function"
            ) {

                await loadGeoJSON();

            }

        }
        catch (error) {

            console.error(
                "Lỗi tải GeoJSON:",
                error
            );

        }


        // ==================================================
        // 4. ĐỔI LỚP DỮ LIỆU
        // ==================================================

        const layerSelect =
            document.getElementById(
                "layerSelect"
            );


        if (layerSelect) {

            layerSelect.addEventListener(
                "change",
                function () {

                    if (
                        typeof setLayer ===
                        "function"
                    ) {

                        setLayer(
                            this.value
                        );

                    }

                }
            );

        }


        // ==================================================
        // 5. CẬP NHẬT DỮ LIỆU
        // ==================================================

        const btnRefresh =
            document.getElementById(
                "btnRefresh"
            );


        if (btnRefresh) {

            btnRefresh.addEventListener(
                "click",
                async function () {

                    try {

                        if (
                            typeof loadSheet ===
                            "function"
                        ) {

                            await loadSheet();

                        }


                        // Cập nhật KPI ngay

                        if (
                            typeof dashboard !==
                            "undefined" &&
                            typeof dashboard.update ===
                            "function"
                        ) {

                            dashboard.update();

                        }


                        // Sau đó vẽ lại bản đồ

                        if (
                            typeof refreshMap ===
                            "function"
                        ) {

                            refreshMap();

                        }

                    }
                    catch (error) {

                        console.error(
                            "Lỗi cập nhật dữ liệu:",
                            error
                        );

                    }

                }
            );

        }


        // ==================================================
        // 6. VỊ TRÍ
        // ==================================================

        const btnLocate =
            document.getElementById(
                "btnLocate"
            );


        if (btnLocate) {

            btnLocate.addEventListener(
                "click",
                function () {

                    if (
                        typeof locateUser ===
                        "function"
                    ) {

                        locateUser();

                    }

                }
            );

        }


        console.log(
            "WEBGIS APP: Khởi tạo hoàn tất."
        );

    }
);
