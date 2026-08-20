//======================================================
// DASHBOARD.JS
// WebGIS quản lý thú y tỉnh Điện Biên
//======================================================

(function () {

    "use strict";


    //==================================================
    // CHUYỂN SỐ
    //==================================================

    function numberValue(value) {

        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {

            return 0;

        }


        if (
            typeof value === "number"
        ) {

            return Number.isFinite(value)
                ? value
                : 0;

        }


        let s =
            String(value)
                .trim()
                .replace(/[^\d,.-]/g, "");


        if (!s) {

            return 0;

        }


        // Ví dụ: 1.234,56
        if (
            s.includes(".") &&
            s.includes(",")
        ) {

            s =
                s.replace(/\./g, "");

            s =
                s.replace(",", ".");

        }

        // Ví dụ: 1,5 hoặc 1,234
        else if (
            s.includes(",")
        ) {

            const parts =
                s.split(",");


            if (
                parts.length === 2 &&
                parts[1].length <= 2
            ) {

                s =
                    parts[0] +
                    "." +
                    parts[1];

            }
            else {

                s =
                    s.replace(/,/g, "");

            }

        }

        // Ví dụ 1.234.567
        else if (
            (s.match(/\./g) || []).length > 1
        ) {

            s =
                s.replace(/\./g, "");

        }


        const n =
            Number(s);


        return Number.isFinite(n)
            ? n
            : 0;

    }


    //==================================================
    // FORMAT
    //==================================================

    function formatNumber(value) {

        return numberValue(value)
            .toLocaleString(
                "vi-VN",
                {
                    maximumFractionDigits: 2
                }
            );

    }


    //==================================================
    // CHUẨN HÓA TRẠNG THÁI
    //==================================================

    function normalizeStatus(value) {

        return String(
            value ?? ""
        )
        .trim()
        .toLowerCase();

    }


    //==================================================
    // XÃ ĐANG CÓ DỊCH
    //==================================================

    function isActive(
        row,
        field
    ) {

        return (
            normalizeStatus(
                row[field]
            ) ===
            "đang có dịch"
        );

    }


    //==================================================
    // XÃ CÓ DỊCH LŨY KẾ
    //
    // Có một trong các điều kiện:
    // - đang có dịch
    // - đã hết dịch
    // - có ổ dịch
    // - có số con
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
            normalizeStatus(
                row[statusField]
            );


        const outbreak =
            numberValue(
                row[outbreakField]
            );


        const value =
            numberValue(
                row[valueField]
            );


        const death =
            numberValue(
                row[deathField]
            );


        return (

            status === "đang có dịch" ||

            status === "đã hết dịch" ||

            outbreak > 0 ||

            value > 0 ||

            death > 0

        );

    }


    //==================================================
    // LẤY DỮ LIỆU
    //==================================================

    function getDashboardRows() {

        if (
            typeof window.getRows ===
            "function"
        ) {

            try {

                const rows =
                    window.getRows();


                if (
                    Array.isArray(rows)
                ) {

                    return rows;

                }

            }
            catch (error) {

                console.warn(
                    "Dashboard getRows:",
                    error
                );

            }

        }


        if (
            typeof window.sheetData !==
            "undefined" &&
            window.sheetData
        ) {

            return Object.values(
                window.sheetData
            );

        }


        return [];

    }


    //==================================================
    // GÁN TEXT
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
    // DASHBOARD
    //==================================================

    const dashboard = {

        update: function () {

            const rows =
                getDashboardRows();


            if (
                !Array.isArray(rows) ||
                rows.length === 0
            ) {

                return;

            }


            //================================================
            // BIẾN TỔNG HỢP
            //================================================

            const stat = {

                // DTLCP
                dtlcpXaLuyKe: 0,
                dtlcpDangDich: 0,
                dtlcpCon: 0,
                dtlcpKg: 0,

                // CGC
                cgcXaLuyKe: 0,
                cgcDangDich: 0,
                cgcCon: 0,
                cgcKg: 0,

                // VDNC
                vdncXaLuyKe: 0,
                vdncDangDich: 0,
                vdncMac: 0,
                vdncChet: 0,

                // DẠI
                daiXaLuyKe: 0,
                daiDangDich: 0,
                daiChet: 0,
                daiTieuHuy: 0,

                // VSKTTĐ / PHUN
                phunXa: 0,

                // KSGM
                ksgmXa: 0,
                ksgmCoSo: 0,

                // THUỐC THÚ Y
                csbbtty: 0

            };


            //================================================
            // DUYỆT TỪNG XÃ
            //================================================

            rows.forEach(
                function (row) {


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

                        stat.dtlcpXaLuyKe++;

                    }


                    if (
                        isActive(
                            row,
                            "DTLCP_Trạng thái"
                        )
                    ) {

                        stat.dtlcpDangDich++;

                    }


                    stat.dtlcpCon +=
                        numberValue(
                            row["DTLCP_Chết"]
                        );


                    stat.dtlcpKg +=
                        numberValue(
                            row["DTLCP_Trọng lượng"]
                        );


                    //========================================
                    // CÚM GIA CẦM
                    //========================================

                    if (
                        hasDiseaseHistory(
                            row,
                            "CGC_Trạng thái",
                            "CGC_Ổ dịch",
                            "CGC_Chết"
                        )
                    ) {

                        stat.cgcXaLuyKe++;

                    }


                    if (
                        isActive(
                            row,
                            "CGC_Trạng thái"
                        )
                    ) {

                        stat.cgcDangDich++;

                    }


                    stat.cgcCon +=
                        numberValue(
                            row["CGC_Chết"]
                        );


                    stat.cgcKg +=
                        numberValue(
                            row["CGC_Trọng lượng"]
                        );


                    //========================================
                    // VIÊM DA NỔI CỤC
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

                        stat.vdncXaLuyKe++;

                    }


                    if (
                        isActive(
                            row,
                            "VDNC_Trạng thái"
                        )
                    ) {

                        stat.vdncDangDich++;

                    }


                    stat.vdncMac +=
                        numberValue(
                            row["VDNC_Mắc"]
                        );


                    stat.vdncChet +=
                        numberValue(
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

                        stat.daiXaLuyKe++;

                    }


                    if (
                        isActive(
                            row,
                            "DAI_Trạng thái"
                        )
                    ) {

                        stat.daiDangDich++;

                    }


                    stat.daiChet +=
                        numberValue(
                            row["DAI_Chết"]
                        );


                    stat.daiTieuHuy +=
                        numberValue(
                            row["DAI_Tiêu hủy"]
                        );


                    //========================================
                    // VỆ SINH, KHỬ TRÙNG, TIÊU ĐỘC
                    //
                    // CHỈ LẤY:
                    // XÃ ĐÃ TRIỂN KHAI
                    //========================================

                    const phunTienDo =
                        normalizeStatus(
                            row["PHUN_Tiến độ"]
                        );


                    const phunHo =
                        numberValue(
                            row["PHUN_Số hộ"]
                        );


                    const phunVong =
                        numberValue(
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
                    // KIỂM SOÁT GIẾT MỔ
                    //========================================

                    const ksgmCoSo =
                        numberValue(
                            row["KSGM_Cơ sở"]
                        );


                    if (
                        normalizeStatus(
                            row["KSGM_Trạng thái"]
                        ) ===
                        "đã triển khai"
                    ) {

                        stat.ksgmXa++;

                    }
                    else if (
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
                        numberValue(
                            row["CSBBTTY_Cơ sở"]
                        );

                }
            );


            //================================================
            // DTLCP
            //
            // Dòng lớn:
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
                    stat.dtlcpXaLuyKe
                )
            );


            setText(
                "dbDTLCPCon",
                formatNumber(
                    stat.dtlcpCon
                )
            );


            setText(
                "dbDTLCPKg",
                formatNumber(
                    stat.dtlcpKg
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
                    stat.cgcXaLuyKe
                )
            );


            setText(
                "dbCGCCon",
                formatNumber(
                    stat.cgcCon
                )
            );


            setText(
                "dbCGCKg",
                formatNumber(
                    stat.cgcKg
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
                    stat.vdncXaLuyKe
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


            setText(
                "dbDAIDang",
                formatNumber(
                    stat.daiXaLuyKe
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
            // VSKTTĐ
            //
            // Chỉ hiển thị:
            // Xã đã triển khai
            //================================================

            setText(
                "dbPhunXa",
                formatNumber(
                    stat.phunXa
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
            // THUỐC THÚ Y
            //================================================

            setText(
                "dbCSBBTTY",
                formatNumber(
                    stat.csbbtty
                )
            );

        }

    };


    //==================================================
    // GÁN RA WINDOW
    //==================================================

    window.dashboard =
        dashboard;


    window.updateDashboard =
        function () {

            dashboard.update();

        };


})();
