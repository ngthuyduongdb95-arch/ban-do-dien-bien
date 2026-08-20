//======================================================
// DASHBOARD.JS
// WEBGIS QUẢN LÝ THÚ Y TỈNH ĐIỆN BIÊN
//======================================================

(function () {

    "use strict";


    //==================================================
    // CHUYỂN SỐ
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

        // 1,5
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

        // 1.234.567
        else if (
            (text.match(/\./g) || []).length > 1
        ) {

            text =
                text.replace(/\./g, "");

        }


        const n =
            Number(text);


        return Number.isFinite(n)
            ? n
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
    // CHUẨN HÓA TRẠNG THÁI
    //==================================================

    function normalize(value) {

        return String(
            value ?? ""
        )
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");

    }


    //==================================================
    // LẤY DỮ LIỆU GOOGLE SHEETS
    //
    // QUAN TRỌNG:
    // dùng trực tiếp sheetData
    // KHÔNG dùng window.sheetData
    //==================================================

    function getDashboardRows() {

        try {

            if (
                typeof sheetData !==
                "undefined" &&
                sheetData &&
                typeof sheetData ===
                "object"
            ) {

                return Object.values(
                    sheetData
                );

            }

        }
        catch (error) {

            console.error(
                "DASHBOARD: Không đọc được sheetData",
                error
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
    // XÃ ĐANG CÓ DỊCH
    //==================================================

    function isActive(value) {

        const status =
            normalize(value);


        return (

            status ===
            "đang có dịch" ||

            status ===
            "đang xảy ra dịch"

        );

    }


    //==================================================
    // XÃ CÓ DỊCH LŨY KẾ
    //==================================================

    function hasHistory(
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
            normalize(
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
    // UPDATE DASHBOARD
    //==================================================

    function updateDashboard() {

        const rows =
            getDashboardRows();


        console.log(
            "DASHBOARD: rows =",
            rows.length
        );


        if (
            rows.length === 0
        ) {

            console.warn(
                "DASHBOARD: sheetData chưa có dữ liệu."
            );

            return false;

        }


        //================================================
        // BIẾN TỔNG
        //================================================

        let dtlcpLuyKe = 0;
        let dtlcpDang = 0;
        let dtlcpCon = 0;
        let dtlcpKg = 0;

        let cgcLuyKe = 0;
        let cgcDang = 0;
        let cgcCon = 0;
        let cgcKg = 0;

        let vdncLuyKe = 0;
        let vdncDang = 0;
        let vdncMac = 0;
        let vdncChet = 0;

        let daiLuyKe = 0;
        let daiDang = 0;
        let daiChet = 0;
        let daiTieuHuy = 0;

        let tvskttdXa = 0;

        let ksgmXa = 0;
        let ksgmCoSo = 0;

        let thuocThuYCoSo = 0;


        //================================================
        // DUYỆT DỮ LIỆU
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
                    hasHistory(
                        row,
                        "DTLCP_Trạng thái",
                        "DTLCP_Ổ dịch",
                        "DTLCP_Chết"
                    )
                ) {

                    dtlcpLuyKe++;

                }


                if (
                    isActive(
                        row[
                            "DTLCP_Trạng thái"
                        ]
                    )
                ) {

                    dtlcpDang++;

                }


                dtlcpCon +=
                    toNumber(
                        row[
                            "DTLCP_Chết"
                        ]
                    );


                dtlcpKg +=
                    toNumber(
                        row[
                            "DTLCP_Trọng lượng"
                        ]
                    );


                //========================================
                // CGC
                //========================================

                if (
                    hasHistory(
                        row,
                        "CGC_Trạng thái",
                        "CGC_Ổ dịch",
                        "CGC_Chết"
                    )
                ) {

                    cgcLuyKe++;

                }


                if (
                    isActive(
                        row[
                            "CGC_Trạng thái"
                        ]
                    )
                ) {

                    cgcDang++;

                }


                cgcCon +=
                    toNumber(
                        row[
                            "CGC_Chết"
                        ]
                    );


                cgcKg +=
                    toNumber(
                        row[
                            "CGC_Trọng lượng"
                        ]
                    );


                //========================================
                // VDNC
                //========================================

                if (
                    hasHistory(
                        row,
                        "VDNC_Trạng thái",
                        "VDNC_Ổ dịch",
                        "VDNC_Mắc",
                        "VDNC_Chết"
                    )
                ) {

                    vdncLuyKe++;

                }


                if (
                    isActive(
                        row[
                            "VDNC_Trạng thái"
                        ]
                    )
                ) {

                    vdncDang++;

                }


                vdncMac +=
                    toNumber(
                        row[
                            "VDNC_Mắc"
                        ]
                    );


                vdncChet +=
                    toNumber(
                        row[
                            "VDNC_Chết"
                        ]
                    );


                //========================================
                // DẠI
                //========================================

                if (
                    hasHistory(
                        row,
                        "DAI_Trạng thái",
                        "DAI_Ổ dịch",
                        "DAI_Chết",
                        "DAI_Tiêu hủy"
                    )
                ) {

                    daiLuyKe++;

                }


                if (
                    isActive(
                        row[
                            "DAI_Trạng thái"
                        ]
                    )
                ) {

                    daiDang++;

                }


                daiChet +=
                    toNumber(
                        row[
                            "DAI_Chết"
                        ]
                    );


                daiTieuHuy +=
                    toNumber(
                        row[
                            "DAI_Tiêu hủy"
                        ]
                    );


                //========================================
                // TVSKTTĐ
                //
                // CHỈ ĐẾM XÃ ĐÃ TRIỂN KHAI
                //========================================

                const phunTienDo =
                    normalize(
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

                    tvskttdXa++;

                }


                //========================================
                // KSGM
                //========================================

                const ksgmCoSoRow =
                    toNumber(
                        row[
                            "KSGM_Cơ sở"
                        ]
                    );


                const ksgmTrangThai =
                    normalize(
                        row[
                            "KSGM_Trạng thái"
                        ]
                    );


                if (

                    ksgmTrangThai ===
                    "đã triển khai" ||

                    ksgmCoSoRow > 0

                ) {

                    ksgmXa++;

                }


                ksgmCoSo +=
                    ksgmCoSoRow;


                //========================================
                // CƠ SỞ BUÔN BÁN THUỐC THÚ Y
                //========================================

                thuocThuYCoSo +=
                    toNumber(
                        row[
                            "CSBBTTY_Cơ sở"
                        ]
                    );

            }
        );


        //================================================
        // DTLCP
        //================================================

        setText(
            "dbDTLCPXa",
            formatNumber(
                dtlcpDang
            )
        );

        setText(
            "dbDTLCPDang",
            formatNumber(
                dtlcpLuyKe
            )
        );

        setText(
            "dbDTLCPCon",
            formatNumber(
                dtlcpCon
            )
        );

        setText(
            "dbDTLCPKg",
            formatNumber(
                dtlcpKg
            )
        );


        //================================================
        // CGC
        //================================================

        setText(
            "dbCGCXa",
            formatNumber(
                cgcDang
            )
        );

        setText(
            "dbCGCDang",
            formatNumber(
                cgcLuyKe
            )
        );

        setText(
            "dbCGCCon",
            formatNumber(
                cgcCon
            )
        );

        setText(
            "dbCGCKg",
            formatNumber(
                cgcKg
            )
        );


        //================================================
        // VDNC
        //================================================

        setText(
            "dbVDNCXa",
            formatNumber(
                vdncDang
            )
        );

        setText(
            "dbVDNCDang",
            formatNumber(
                vdncLuyKe
            )
        );

        setText(
            "dbVDNCMac",
            formatNumber(
                vdncMac
            )
        );

        setText(
            "dbVDNChet",
            formatNumber(
                vdncChet
            )
        );


        //================================================
        // DẠI
        //================================================

        setText(
            "dbDAIXa",
            formatNumber(
                daiDang
            )
        );

        setText(
            "dbDAIDang",
            formatNumber(
                daiLuyKe
            )
        );

        setText(
            "dbDAILuyKe",
            formatNumber(
                daiLuyKe
            )
        );

        setText(
            "dbDAIChet",
            formatNumber(
                daiChet
            )
        );

        setText(
            "dbDAITieuHuy",
            formatNumber(
                daiTieuHuy
            )
        );


        //================================================
        // TVSKTTĐ
        //================================================

        setText(
            "dbPhunXa",
            formatNumber(
                tvskttdXa
            )
        );


        //================================================
        // KSGM
        //================================================

        setText(
            "dbKSGMXa",
            formatNumber(
                ksgmXa
            )
        );

        setText(
            "dbKSGMCoSo",
            formatNumber(
                ksgmCoSo
            )
        );


        //================================================
        // THUỐC THÚ Y
        //================================================

        setText(
            "dbCSBBTTY",
            formatNumber(
                thuocThuYCoSo
            )
        );


        console.log(
            "DASHBOARD: đã cập nhật dữ liệu."
        );


        return true;

    }


    //==================================================
    // GLOBAL
    //==================================================

    window.dashboard = {

        update:
            updateDashboard

    };


    window.updateDashboard =
        updateDashboard;


    //==================================================
    // CHỜ GOOGLE SHEETS TẢI XONG
    //==================================================

    let attempts = 0;

    const maxAttempts = 20;


    const timer =
        setInterval(
            function () {

                attempts++;


                const ok =
                    updateDashboard();


                if (
                    ok ||
                    attempts >= maxAttempts
                ) {

                    clearInterval(
                        timer
                    );

                }

            },
            500
        );

})();
