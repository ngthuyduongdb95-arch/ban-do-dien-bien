//======================================================
// DASHBOARD.JS
// WEBGIS ĐIỆN BIÊN
//======================================================

const dashboard = {

    update: function () {

        if (typeof sheetData === "undefined") {
            console.warn("Dashboard: sheetData chưa sẵn sàng.");
            return;
        }


        const rows = Object.values(sheetData);


        const stat = {

            //==========================================
            // DTLCP
            //==========================================

            dtlcpXaLuyKe: 0,
            dtlcpXaDangDich: 0,
            dtlcpTieuHuy: 0,
            dtlcpKhoiLuong: 0,


            //==========================================
            // CGC
            //==========================================

            cgcXaLuyKe: 0,
            cgcXaDangDich: 0,
            cgcTieuHuy: 0,
            cgcKhoiLuong: 0,


            //==========================================
            // VDNC
            //==========================================

            vdncXaLuyKe: 0,
            vdncXaDangDich: 0,
            vdncMac: 0,
            vdncChet: 0,


            //==========================================
            // DẠI
            //==========================================

            daiXaLuyKe: 0,
            daiXaDangDich: 0,
            daiChet: 0,


            //==========================================
            // PHUN KHỬ TRÙNG
            //==========================================

            phunXa: 0,
            phunHo: 0,
            phunVongMax: 0,


            //==========================================
            // KSGM
            //==========================================

            ksgmXa: 0,
            ksgmCoSo: 0,


            //==========================================
            // THUỐC THÚ Y
            //==========================================

            csbbtty: 0

        };


        //================================================
        // DUYỆT TỪNG XÃ/PHƯỜNG
        //================================================

        rows.forEach(function (row) {

            if (!row) return;


            //================================================
            // DTLCP
            //================================================

            const dtlcpStatus =
                normalizeStatus(
                    row["DTLCP_Trạng thái"]
                );

            const dtlcpODich =
                toNumber(
                    row["DTLCP_Ổ dịch"]
                );

            const dtlcpTieuHuy =
                toNumber(
                    row["DTLCP_Chết"]
                );

            const dtlcpKhoiLuong =
                toNumber(
                    row["DTLCP_Trọng lượng"]
                );


            // Xã có dịch lũy kế
            if (
                dtlcpODich > 0 ||
                dtlcpTieuHuy > 0 ||
                dtlcpStatus === "đang có dịch" ||
                dtlcpStatus === "đã hết dịch"
            ) {

                stat.dtlcpXaLuyKe++;

            }


            // Xã đang có dịch
            if (
                dtlcpStatus === "đang có dịch"
            ) {

                stat.dtlcpXaDangDich++;

            }


            stat.dtlcpTieuHuy +=
                dtlcpTieuHuy;

            stat.dtlcpKhoiLuong +=
                dtlcpKhoiLuong;


            //================================================
            // CGC
            //================================================

            const cgcStatus =
                normalizeStatus(
                    row["CGC_Trạng thái"]
                );

            const cgcODich =
                toNumber(
                    row["CGC_Ổ dịch"]
                );

            const cgcTieuHuy =
                toNumber(
                    row["CGC_Chết"]
                );

            const cgcKhoiLuong =
                toNumber(
                    row["CGC_Trọng lượng"]
                );


            if (
                cgcODich > 0 ||
                cgcTieuHuy > 0 ||
                cgcStatus === "đang có dịch" ||
                cgcStatus === "đã hết dịch"
            ) {

                stat.cgcXaLuyKe++;

            }


            if (
                cgcStatus === "đang có dịch"
            ) {

                stat.cgcXaDangDich++;

            }


            stat.cgcTieuHuy +=
                cgcTieuHuy;

            stat.cgcKhoiLuong +=
                cgcKhoiLuong;


            //================================================
            // VDNC
            //================================================

            const vdncStatus =
                normalizeStatus(
                    row["VDNC_Trạng thái"]
                );

            const vdncODich =
                toNumber(
                    row["VDNC_Ổ dịch"]
                );

            const vdncMac =
                toNumber(
                    row["VDNC_Mắc"]
                );

            const vdncChet =
                toNumber(
                    row["VDNC_Chết"]
                );


            if (
                vdncODich > 0 ||
                vdncMac > 0 ||
                vdncChet > 0 ||
                vdncStatus === "đang có dịch" ||
                vdncStatus === "đã hết dịch"
            ) {

                stat.vdncXaLuyKe++;

            }


            if (
                vdncStatus === "đang có dịch"
            ) {

                stat.vdncXaDangDich++;

            }


            stat.vdncMac +=
                vdncMac;

            stat.vdncChet +=
                vdncChet;


            //================================================
            // DẠI
            //================================================

            const daiStatus =
                normalizeStatus(
                    row["DAI_Trạng thái"]
                );

            const daiODich =
                toNumber(
                    row["DAI_Ổ dịch"]
                );

            const daiChet =
                toNumber(
                    row["DAI_Chết"]
                );


            if (
                daiODich > 0 ||
                daiChet > 0 ||
                daiStatus === "đang có dịch" ||
                daiStatus === "đã hết dịch"
            ) {

                stat.daiXaLuyKe++;

            }


            if (
                daiStatus === "đang có dịch"
            ) {

                stat.daiXaDangDich++;

            }


            stat.daiChet +=
                daiChet;


            //================================================
            // PHUN KHỬ TRÙNG
            //================================================

            const phunHo =
                toNumber(
                    row["PHUN_Số hộ"]
                );

            const phunVong =
                toNumber(
                    row["PHUN_Vòng"]
                );

            const phunTienDo =
                String(
                    row["PHUN_Tiến độ"] || ""
                ).trim();


            if (
                phunHo > 0 ||
                phunVong > 0 ||
                phunTienDo !== ""
            ) {

                stat.phunXa++;

            }


            stat.phunHo +=
                phunHo;


            if (
                phunVong >
                stat.phunVongMax
            ) {

                stat.phunVongMax =
                    phunVong;

            }


            //================================================
            // KSGM
            //================================================

            const ksgmStatus =
                normalizeStatus(
                    row["KSGM_Trạng thái"]
                );

            const ksgmCoSo =
                toNumber(
                    row["KSGM_Cơ sở"]
                );


            if (
                ksgmStatus === "đã triển khai"
            ) {

                stat.ksgmXa++;

            }


            stat.ksgmCoSo +=
                ksgmCoSo;


            //================================================
            // CƠ SỞ THUỐC THÚ Y
            //================================================

            stat.csbbtty +=
                toNumber(
                    row["CSBBTTY_Cơ sở"]
                );

        });


        //================================================
        // ĐỔ SỐ LIỆU RA HTML
        //================================================

        // DTLCP

        setDashboardText(
            "dbDTLCPXaLuyKe",
            formatNumber(
                stat.dtlcpXaLuyKe
            )
        );

        setDashboardText(
            "dbDTLCPXaDangDich",
            formatNumber(
                stat.dtlcpXaDangDich
            )
        );

        setDashboardText(
            "dbDTLCPCon",
            formatNumber(
                stat.dtlcpTieuHuy
            )
        );

        setDashboardText(
            "dbDTLCPKhoiLuong",
            formatNumber(
                stat.dtlcpKhoiLuong
            )
        );


        // CGC

        setDashboardText(
            "dbCGCXaLuyKe",
            formatNumber(
                stat.cgcXaLuyKe
            )
        );

        setDashboardText(
            "dbCGCXaDangDich",
            formatNumber(
                stat.cgcXaDangDich
            )
        );

        setDashboardText(
            "dbCGCCon",
            formatNumber(
                stat.cgcTieuHuy
            )
        );

        setDashboardText(
            "dbCGCKhoiLuong",
            formatNumber(
                stat.cgcKhoiLuong
            )
        );


        // VDNC

        setDashboardText(
            "dbVDNCXaLuyKe",
            formatNumber(
                stat.vdncXaLuyKe
            )
        );

        setDashboardText(
            "dbVDNCXaDangDich",
            formatNumber(
                stat.vdncXaDangDich
            )
        );

        setDashboardText(
            "dbVDNCMac",
            formatNumber(
                stat.vdncMac
            )
        );

        setDashboardText(
            "dbVDNCChet",
            formatNumber(
                stat.vdncChet
            )
        );


        // DẠI

        setDashboardText(
            "dbDAIXaLuyKe",
            formatNumber(
                stat.daiXaLuyKe
            )
        );

        setDashboardText(
            "dbDAIXaDangDich",
            formatNumber(
                stat.daiXaDangDich
            )
        );

        setDashboardText(
            "dbDAIChet",
            formatNumber(
                stat.daiChet
            )
        );


        // PHUN

        setDashboardText(
            "dbPhunXa",
            formatNumber(
                stat.phunXa
            )
        );

        setDashboardText(
            "dbPhunHo",
            formatNumber(
                stat.phunHo
            )
        );

        setDashboardText(
            "dbPhunVong",
            formatNumber(
                stat.phunVongMax
            )
        );


        // KSGM

        setDashboardText(
            "dbKSGMXa",
            formatNumber(
                stat.ksgmXa
            )
        );

        setDashboardText(
            "dbKSGM",
            formatNumber(
                stat.ksgmCoSo
            )
        );


        // THUỐC THÚ Y

        setDashboardText(
            "dbCSBBTTY",
            formatNumber(
                stat.csbbtty
            )
        );


        console.log(
            "Dashboard:",
            stat
        );

    }

};


//======================================================
// CHUẨN HÓA TRẠNG THÁI
//======================================================

function normalizeStatus(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "";

    }


    return String(value)
        .trim()
        .toLowerCase();

}


//======================================================
// CHUYỂN SANG SỐ
//======================================================

function toNumber(value) {

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


    let str =
        String(value).trim();


    if (!str) {
        return 0;
    }


    str =
        str.replace(
            /[^\d,.-]/g,
            ""
        );


    if (
        str.includes(".") &&
        str.includes(",")
    ) {

        str =
            str.replace(
                /\./g,
                ""
            );

        str =
            str.replace(
                ",",
                "."
            );

    }
    else if (
        str.includes(".")
    ) {

        const parts =
            str.split(".");


        if (
            parts.length > 2
        ) {

            str =
                str.replace(
                    /\./g,
                    ""
                );

        }

    }
    else if (
        str.includes(",")
    ) {

        const parts =
            str.split(",");


        if (
            parts.length === 2 &&
            parts[1].length <= 2
        ) {

            str =
                parts[0] +
                "." +
                parts[1];

        }
        else {

            str =
                str.replace(
                    /,/g,
                    ""
                );

        }

    }


    const result =
        Number(str);


    return Number.isFinite(result)
        ? result
        : 0;

}


//======================================================
// FORMAT SỐ
//======================================================

function formatNumber(value) {

    const number =
        Number(value);


    if (
        !Number.isFinite(number)
    ) {

        return "0";

    }


    return number.toLocaleString(
        "vi-VN"
    );

}


//======================================================
// GÁN TEXT
//======================================================

function setDashboardText(
    id,
    value
) {

    const el =
        document.getElementById(id);


    if (el) {

        el.textContent =
            value;

    }

}


//======================================================
// HẾT DASHBOARD.JS
//======================================================
