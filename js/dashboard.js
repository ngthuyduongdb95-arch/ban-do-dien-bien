//======================================================
// DASHBOARD.JS
// WEBGIS QUẢN LÝ THÚ Y TỈNH ĐIỆN BIÊN
//======================================================

(function () {

    "use strict";


    //==================================================
    // CHUYỂN GIÁ TRỊ SANG SỐ
    //==================================================

    function toNumber(value) {

        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {
            return 0;
        }

        if (typeof value === "number") {

            return Number.isFinite(value)
                ? value
                : 0;

        }

        let text =
            String(value)
                .trim()
                .replace(/[^\d,.-]/g, "");

        if (!text) {
            return 0;
        }

        // Ví dụ: 1.234.567,89
        if (
            text.includes(".") &&
            text.includes(",")
        ) {

            text =
                text.replace(/\./g, "");

            text =
                text.replace(",", ".");

        }

        // Ví dụ: 1,5
        else if (
            text.includes(",")
        ) {

            const parts =
                text.split(",");

            if (
                parts.length === 2 &&
                parts[1].length <= 2
            ) {

                text =
                    parts[0] +
                    "." +
                    parts[1];

            }
            else {

                text =
                    text.replace(/,/g, "");

            }

        }

        // Ví dụ: 1.234.567
        else if (
            (text.match(/\./g) || []).length > 1
        ) {

            text =
                text.replace(/\./g, "");

        }

        const number =
            Number(text);

        return Number.isFinite(number)
            ? number
            : 0;

    }


    //==================================================
    // FORMAT SỐ
    //==================================================

    function formatNumber(value) {

        return toNumber(value)
            .toLocaleString(
                "vi-VN",
                {
                    maximumFractionDigits: 2
                }
            );

    }


    //==================================================
    // CHUẨN HÓA CHỮ
    //==================================================

    function cleanText(value) {

        return String(
            value ?? ""
        )
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");

    }


    //==================================================
    // LẤY DỮ LIỆU GOOGLE SHEETS
    //==================================================

    function getRowsFromSheet() {

        // Ưu tiên getRows() từ sheets.js
        if (
            typeof getRows === "function"
        ) {

            try {

                const rows =
                    getRows();

                if (
                    Array.isArray(rows)
                ) {

                    return rows;

                }

            }
            catch (error) {

                console.error(
                    "Dashboard getRows():",
                    error
                );

            }

        }


        // Dự phòng dùng sheetData
        if (
            typeof sheetData !==
            "undefined" &&
            sheetData
        ) {

            return Object.values(
                sheetData
            );

        }


        return [];

    }


    //==================================================
    // GÁN GIÁ TRỊ
    //==================================================

    function setText(
        id,
        value
    ) {

        const element =
            document.getElementById(id);

        if (element) {

            element.textContent =
                value;

        }

    }


    //==================================================
    // KIỂM TRA ĐANG CÓ DỊCH
    //==================================================

    function isCurrentlyDisease(
        value
    ) {

        const status =
            cleanText(value);

        return (

            status === "đang có dịch" ||

            status === "đang xảy ra dịch"

        );

    }


    //==================================================
    // KIỂM TRA CÓ DỊCH LŨY KẾ
    //
    // Một xã được tính vào lũy kế nếu:
    // - có trạng thái;
    // - hoặc có ổ dịch;
    // - hoặc có số liệu bệnh.
    //==================================================

    function hasDiseaseHistory(
        row,
        statusField,
        outbreakField,
        valueField,
        deathField
    ) {

        if (!row) {

            return false;

        }


        const status =
            cleanText(
                row[statusField]
            );


        const outbreak =
            toNumber(
                row[outbreakField]
            );


        const value =
            toNumber(
                row[valueField]
            );


        const death =
            deathField
                ? toNumber(
                    row[deathField]
                )
                : 0;


        return (

            status !== "" ||

            outbreak > 0 ||

            value > 0 ||

            death > 0

        );

    }


    //==================================================
    // DASHBOARD
    //==================================================

    const dashboard = {

        update: function () {

            const rows =
                getRowsFromSheet();


            console.log(
                "DASHBOARD - số dòng Google Sheets:",
                rows.length
            );


            if (
                rows.length === 0
            ) {

                console.warn(
                    "DASHBOARD - chưa có dữ liệu Google Sheets."
                );

                return;

            }


            //================================================
            // BIẾN TỔNG
            //================================================

            const stat = {

                // -----------------------------------------
                // DTLCP
                // -----------------------------------------

                dtlcpLuyKe: 0,

                dtlcpDangDich: 0,

                dtlcpTieuHuy: 0,

                dtlcpKhoiLuong: 0,


                // -----------------------------------------
                // CGC
                // -----------------------------------------

                cgcLuyKe: 0,

                cgcDangDich: 0,

                cgcTieuHuy: 0,

                cgcKhoiLuong: 0,


                // -----------------------------------------
                // VDNC
                // -----------------------------------------

                vdncLuyKe: 0,

                vdncDangDich: 0,

                vdncMac: 0,

                vdncChet: 0,


                // -----------------------------------------
                // DẠI
                // -----------------------------------------

                daiLuyKe: 0,

                daiDangDich: 0,

                daiChet: 0,

                daiTieuHuy: 0,


                // -----------------------------------------
                // VSKTTĐ
                // -----------------------------------------

                tvskttdXa: 0,


                // -----------------------------------------
                // KSGM
                // -----------------------------------------

                ksgmXa: 0,

                ksgmCoSo: 0,


                // -----------------------------------------
                // THUỐC THÚ Y
                // -----------------------------------------

                csbbttyCoSo: 0

            };


            //================================================
            // DUYỆT TỪNG XÃ
            //================================================

            rows.forEach(
                function (row) {

                    if (!row) {

                        return;

                    }


                    //========================================
                    // 1. DỊCH TẢ LỢN CHÂU PHI
                    //========================================

                    if (
                        hasDiseaseHistory(
                            row,
                            "DTLCP_Trạng thái",
                            "DTLCP_Ổ dịch",
                            "DTLCP_Chết"
                        )
                    ) {

                        stat.dtlcpLuyKe++;

                    }


                    if (
                        isCurrentlyDisease(
                            row[
                                "DTLCP_Trạng thái"
                            ]
                        )
                    ) {

                        stat.dtlcpDangDich++;

                    }


                    stat.dtlcpTieuHuy +=
                        toNumber(
                            row[
                                "DTLCP_Chết"
                            ]
                        );


                    stat.dtlcpKhoiLuong +=
                        toNumber(
                            row[
                                "DTLCP_Trọng lượng"
                            ]
                        );


                    //========================================
                    // 2. CÚM GIA CẦM
                    //========================================

                    if (
                        hasDiseaseHistory(
                            row,
                            "CGC_Trạng thái",
                            "CGC_Ổ dịch",
                            "CGC_Chết"
                        )
                    ) {

                        stat.cgcLuyKe++;

                    }


                    if (
                        isCurrentlyDisease(
                            row[
                                "CGC_Trạng thái"
                            ]
                        )
                    ) {

                        stat.cgcDangDich++;

                    }


                    stat.cgcTieuHuy +=
                        toNumber(
                            row[
                                "CGC_Chết"
                            ]
                        );


                    stat.cgcKhoiLuong +=
                        toNumber(
                            row[
                                "CGC_Trọng lượng"
                            ]
                        );


                    //========================================
                    // 3. VIÊM DA NỔI CỤC
                    //========================================

                    if (
                        hasDiseaseHistory(
                            row,
                            "VDNC_Trạng thái",
                            "VDNC_Ổ dịch",
                            "VDNC_Mắc",
                            "VDNC_Chết"
                        )
                    ) {

                        stat.vdncLuyKe++;

                    }


                    if (
                        isCurrentlyDisease(
                            row[
                                "VDNC_Trạng thái"
                            ]
                        )
                    ) {

                        stat.vdncDangDich++;

                    }


                    stat.vdncMac +=
                        toNumber(
                            row[
                                "VDNC_Mắc"
                            ]
                        );


                    stat.vdncChet +=
                        toNumber(
                            row[
                                "VDNC_Chết"
                            ]
                        );


                    //========================================
                    // 4. BỆNH DẠI
                    //========================================

                    if (
                        hasDiseaseHistory(
                            row,
                            "DAI_Trạng thái",
                            "DAI_Ổ dịch",
                            "DAI_Chết",
                            "DAI_Tiêu hủy"
                        )
                    ) {

                        stat.daiLuyKe++;

                    }


                    if (
                        isCurrentlyDisease(
                            row[
                                "DAI_Trạng thái"
                            ]
                        )
                    ) {

                        stat.daiDangDich++;

                    }


                    stat.daiChet +=
                        toNumber(
                            row[
                                "DAI_Chết"
                            ]
                        );


                    stat.daiTieuHuy +=
                        toNumber(
                            row[
                                "DAI_Tiêu hủy"
                            ]
                        );


                    //========================================
                    // 5. THỰC HIỆN THÁNG TVSKTTĐ
                    //
                    // CHỈ ĐẾM XÃ ĐÃ TRIỂN KHAI
                    //========================================

                    const phunTienDo =
                        cleanText(
                            row[
                                "PHUN_Tiến độ"
                            ]
                        );


                    const phunHo =
                        toNumber(
                            row[
                                "PHUN_Số hộ"
                            ]
                        );


                    const phunVong =
                        toNumber(
                            row[
                                "PHUN_Vòng"
                            ]
                        );


                    if (

                        phunHo > 0 ||

                        phunVong > 0 ||

                        phunTienDo !== ""

                    ) {

                        stat.tvskttdXa++;

                    }


                    //========================================
                    // 6. KIỂM SOÁT GIẾT MỔ
                    //========================================

                    const ksgmCoSo =
                        toNumber(
                            row[
                                "KSGM_Cơ sở"
                            ]
                        );


                    const ksgmTrangThai =
                        cleanText(
                            row[
                                "KSGM_Trạng thái"
                            ]
                        );


                    if (

                        ksgmTrangThai ===
                        "đã triển khai" ||

                        ksgmCoSo > 0

                    ) {

                        stat.ksgmXa++;

                    }


                    stat.ksgmCoSo +=
                        ksgmCoSo;


                    //========================================
                    // 7. CƠ SỞ BUÔN BÁN THUỐC THÚ Y
                    //========================================

                    stat.csbbttyCoSo +=
                        toNumber(
                            row[
                                "CSBBTTY_Cơ sở"
                            ]
                        );

                }
            );


            //================================================
            // ĐƯA SỐ LIỆU RA KPI
            //================================================


            //================================================
            // DTLCP
            //
            // Số lớn:
            // Xã đang có dịch
            //
            // Dòng phụ:
            // Xã có dịch (lũy kế)
            //================================================

            setText(
                "dbDTLCPXa",
                formatNumber(
                    stat.dtlcpDangDich
                )
            );


            setText(
                "dbDTLCPDang",
                formatNumber(
                    stat.dtlcpLuyKe
                )
            );


            setText(
                "dbDTLCPCon",
                formatNumber(
                    stat.dtlcpTieuHuy
                )
            );


            setText(
                "dbDTLCPKg",
                formatNumber(
                    stat.dtlcpKhoiLuong
                )
            );


            //================================================
            // CGC
            //================================================

            setText(
                "dbCGCXa",
                formatNumber(
                    stat.cgcDangDich
                )
            );


            setText(
                "dbCGCDang",
                formatNumber(
                    stat.cgcLuyKe
                )
            );


            setText(
                "dbCGCCon",
                formatNumber(
                    stat.cgcTieuHuy
                )
            );


            setText(
                "dbCGCKg",
                formatNumber(
                    stat.cgcKhoiLuong
                )
            );


            //================================================
            // VDNC
            //================================================

            setText(
                "dbVDNCXa",
                formatNumber(
                    stat.vdncDangDich
                )
            );


            setText(
                "dbVDNCDang",
                formatNumber(
                    stat.vdncLuyKe
                )
            );


            setText(
                "dbVDNCMac",
                formatNumber(
                    stat.vdncMac
                )
            );


            setText(
                "dbVDNChet",
                formatNumber(
                    stat.vdncChet
                )
            );


            //================================================
            // DẠI
            //================================================

            setText(
                "dbDAIXa",
                formatNumber(
                    stat.daiDangDich
                )
            );


            // Nếu index đang dùng dbDAIDang
            // thì vẫn cập nhật để tương thích.

            setText(
                "dbDAIDang",
                formatNumber(
                    stat.daiLuyKe
                )
            );


            // Nếu index đã đổi sang dbDAILuyKe
            // thì cập nhật thêm.

            setText(
                "dbDAILuyKe",
                formatNumber(
                    stat.daiLuyKe
                )
            );


            setText(
                "dbDAIChet",
                formatNumber(
                    stat.daiChet
                )
            );


            setText(
                "dbDAITieuHuy",
                formatNumber(
                    stat.daiTieuHuy
                )
            );


            //================================================
            // TVSKTTĐ
            // Chỉ số xã đã triển khai
            //================================================

            setText(
                "dbPhunXa",
                formatNumber(
                    stat.tvskttdXa
                )
            );


            //================================================
            // KSGM
            //================================================

            setText(
                "dbKSGMXa",
                formatNumber(
                    stat.ksgmXa
                )
            );


            setText(
                "dbKSGMCoSo",
                formatNumber(
                    stat.ksgmCoSo
                )
            );


            //================================================
            // CƠ SỞ BUÔN BÁN THUỐC THÚ Y
            //================================================

            setText(
                "dbCSBBTTY",
                formatNumber(
                    stat.csbbttyCoSo
                )
            );


            console.log(
                "DASHBOARD: Đã cập nhật toàn bộ số liệu KPI.",
                stat
            );

        }

    };


    //==================================================
    // ĐƯA DASHBOARD RA GLOBAL
    //==================================================

    window.dashboard =
        dashboard;


})();
