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

        // 1.234.567,89
        if (
            text.includes(".") &&
            text.includes(",")
        ) {

            text =
                text.replace(/\./g, "");

            text =
                text.replace(",", ".");

        }

        // 1,5 hoặc 1,234
        else if (text.includes(",")) {

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

        // 1.234.567
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
    // FORMAT
    //==================================================

    function formatNumber(value) {

        return toNumber(value)
            .toLocaleString(
                "vi-VN"
            );

    }


    //==================================================
    // CHUẨN HÓA TRẠNG THÁI
    //==================================================

    function cleanStatus(value) {

        return String(
            value ?? ""
        )
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");

    }


    //==================================================
    // LẤY TOÀN BỘ ROW
    //==================================================

    function getDashboardRows() {

        // Ưu tiên hàm getRows() từ sheets.js
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
                    "Dashboard - getRows():",
                    error
                );

            }
        }


        // Phương án dự phòng
        if (
            typeof sheetData !==
            "undefined"
        ) {

            if (
                sheetData &&
                typeof sheetData ===
                "object"
            ) {

                return Object.values(
                    sheetData
                );

            }

        }


        return [];

    }


    //==================================================
    // GÁN TEXT
    //==================================================

    function setValue(
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
    // XÁC ĐỊNH XÃ ĐANG CÓ DỊCH
    //
    // Chấp nhận:
    // "Đang có dịch"
    // "Đang xảy ra dịch"
    // "ĐANG CÓ DỊCH"
    //==================================================

    function isCurrentlyDisease(
        value
    ) {

        const status =
            cleanStatus(value);

        return (
            status.includes(
                "đang có dịch"
            ) ||
            status.includes(
                "đang xảy ra dịch"
            )
        );

    }


    //==================================================
    // XÁC ĐỊNH XÃ CÓ DỊCH LŨY KẾ
    //
    // Không phụ thuộc riêng vào chữ trạng thái.
    //
    // Chỉ cần có một trong các dữ liệu:
    // - trạng thái
    // - ổ dịch
    // - số mắc/chết
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
            cleanStatus(
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
                getDashboardRows();


            console.log(
                "DASHBOARD: số dòng dữ liệu =",
                rows.length
            );


            if (
                !rows.length
            ) {

                console.warn(
                    "DASHBOARD: chưa nhận được dữ liệu Google Sheets."
                );

                return;

            }


            //================================================
            // BIẾN TỔNG
            //================================================

            const stat = {

                // DTLCP
                dtlcpLuyKe: 0,
                dtlcpDang: 0,
                dtlcpTieuHuy: 0,
                dtlcpKg: 0,

                // CGC
                cgcLuyKe: 0,
                cgcDang: 0,
                cgcTieuHuy: 0,
                cgcKg: 0,

                // VDNC
                vdncLuyKe: 0,
                vdncDang: 0,
                vdncMac: 0,
                vdncChet: 0,

                // DẠI
                daiLuyKe: 0,
                daiDang: 0,
                daiChet: 0,
                daiTieuHuy: 0,

                // VSKTTĐ
                phunXa: 0,

                // KSGM
                ksgmXa: 0,
                ksgmCoSo: 0,

                // THUỐC THÚ Y
                csbbtty: 0
            };


            //================================================
            // DUYỆT ROW
            //================================================

            rows.forEach(
                function (row) {

                    if (!row) {
                        return;
                    }


                    //========================================
                    // DTLCP
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

                        stat.dtlcpDang++;

                    }


                    stat.dtlcpTieuHuy +=
                        toNumber(
                            row["DTLCP_Chết"]
                        );


                    stat.dtlcpKg +=
                        toNumber(
                            row[
                                "DTLCP_Trọng lượng"
                            ]
                        );


                    //========================================
                    // CGC
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

                        stat.cgcDang++;

                    }


                    stat.cgcTieuHuy +=
                        toNumber(
                            row["CGC_Chết"]
                        );


                    stat.cgcKg +=
                        toNumber(
                            row[
                                "CGC_Trọng lượng"
                            ]
                        );


                    //========================================
                    // VDNC
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

                        stat.vdncDang++;

                    }


                    stat.vdncMac +=
                        toNumber(
                            row["VDNC_Mắc"]
                        );


                    stat.vdncChet +=
                        toNumber(
                            row["VDNC_Chết"]
                        );


                    //========================================
                    // DẠI
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

                        stat.daiDang++;

                    }


                    stat.daiChet +=
                        toNumber(
                            row["DAI_Chết"]
                        );


                    stat.daiTieuHuy +=
                        toNumber(
                            row["DAI_Tiêu hủy"]
                        );


                    //========================================
                    // TVSKTTĐ
                    //
                    // CHỈ: XÃ ĐÃ TRIỂN KHAI
                    //========================================

                    const phunTienDo =
                        cleanStatus(
                            row[
                                "PHUN_Tiến độ"
                            ]
                        );


                    const phunHo =
                        toNumber(
                            row["PHUN_Số hộ"]
                        );


                    const phunVong =
                        toNumber(
                            row["PHUN_Vòng"]
                        );


                    if (

                        phunHo > 0 ||

                        phunVong > 0 ||

                        phunTienDo !== ""

                    ) {

                        stat.phunXa++;

                    }


                    //========================================
                    // KSGM
                    //========================================

                    const ksgmCoSo =
                        toNumber(
                            row[
                                "KSGM_Cơ sở"
                            ]
                        );


                    const ksgmStatus =
                        cleanStatus(
                            row[
                                "KSGM_Trạng thái"
                            ]
                        );


                    if (

                        ksgmStatus ===
                        "đã triển khai" ||

                        ksgmCoSo > 0

                    ) {

                        stat.ksgmXa++;

                    }


                    stat.ksgmCoSo +=
                        ksgmCoSo;


                    //========================================
                    // CƠ SỞ BUÔN BÁN THUỐC THÚ Y
                    //========================================

                    stat.csbbtty +=
                        toNumber(
                            row[
                                "CSBBTTY_Cơ sở"
                            ]
                        );

                }
            );


            //================================================
            // ĐƯA SỐ LIỆU RA HTML
            //
            // SỐ LỚN:
            // XÃ ĐANG CÓ DỊCH
            //
            // DÒNG PHỤ:
            // XÃ CÓ DỊCH (LŨY KẾ)
            //================================================


            // DTLCP

            setValue(
                "dbDTLCPXa",
                formatNumber(
                    stat.dtlcpDang
                )
            );

            setValue(
                "dbDTLCPDang",
                formatNumber(
                    stat.dtlcpLuyKe
                )
            );

            setValue(
                "dbDTLCPCon",
                formatNumber(
                    stat.dtlcpTieuHuy
                )
            );

            setValue(
                "dbDTLCPKg",
                formatNumber(
                    stat.dtlcpKg
                )
            );


            // CGC

            setValue(
                "dbCGCXa",
                formatNumber(
                    stat.cgcDang
                )
            );

            setValue(
                "dbCGCDang",
                formatNumber(
                    stat.cgcLuyKe
                )
            );

            setValue(
                "dbCGCCon",
                formatNumber(
                    stat.cgcTieuHuy
                )
            );

            setValue(
                "dbCGCKg",
                formatNumber(
                    stat.cgcKg
                )
            );


            // VDNC

            setValue(
                "dbVDNCXa",
                formatNumber(
                    stat.vdncDang
                )
            );

            setValue(
                "dbVDNCDang",
                formatNumber(
                    stat.vdncLuyKe
                )
            );

            setValue(
                "dbVDNCMac",
                formatNumber(
                    stat.vdncMac
                )
            );

            setValue(
                "dbVDNChet",
                formatNumber(
                    stat.vdncChet
                )
            );


            // DẠI

            setValue(
                "dbDAIXa",
                formatNumber(
                    stat.daiDang
                )
            );

            setValue(
                "dbDAIDang",
                formatNumber(
                    stat.daiLuyKe
                )
            );

            setValue(
                "dbDAIChet",
                formatNumber(
                    stat.daiChet
                )
            );

            setValue(
                "dbDAITieuHuy",
                formatNumber(
                    stat.daiTieuHuy
                )
            );


            // TVSKTTĐ

            setValue(
                "dbPhunXa",
                formatNumber(
                    stat.phunXa
                )
            );


            // KSGM

            setValue(
                "dbKSGMXa",
                formatNumber(
                    stat.ksgmXa
                )
            );

            setValue(
                "dbKSGMCoSo",
                formatNumber(
                    stat.ksgmCoSo
                )
            );


            // THUỐC THÚ Y

            setValue(
                "dbCSBBTTY",
                formatNumber(
                    stat.csbbtty
                )
            );


            console.log(
                "DASHBOARD: đã cập nhật KPI."
            );

        }

    };


    window.dashboard =
        dashboard;

})();
