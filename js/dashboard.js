```javascript
//======================================================
// DASHBOARD.JS
// WEBGIS QUẢN LÝ DỊCH BỆNH ĐỘNG VẬT ĐIỆN BIÊN
//======================================================
//
// DTLCP
// - Xã có dịch (lũy kế)
// - Xã đang có dịch
// - Tiêu hủy
// - Khối lượng
//
// CGC
// - Xã có dịch (lũy kế)
// - Xã đang có dịch
// - Tiêu hủy
// - Khối lượng
//
// VDNC
// - Xã có dịch (lũy kế)
// - Xã đang có dịch
// - Mắc
// - Chết
//
// DẠI
// - Xã có dịch (lũy kế)
// - Xã đang có dịch
// - Số chết, tiêu hủy
//
// PHUN KHỬ TRÙNG
// - Xã triển khai
// - Số hộ
// - Vòng
//
// KSGM
// - Xã triển khai
// - Số cơ sở
//
// THUỐC THÚ Y
// - Số cơ sở
//
//======================================================


//======================================================
// DASHBOARD
//======================================================

const dashboard = {

    update: function () {

        //==================================================
        // KIỂM TRA DỮ LIỆU
        //==================================================

        if (typeof sheetData === "undefined") {

            console.warn(
                "Dashboard: sheetData chưa tồn tại."
            );

            return;

        }


        const rows = Object.values(sheetData);


        //==================================================
        // KHỞI TẠO THỐNG KÊ
        //==================================================

        const stat = {

            //================================================
            // DTLCP
            //================================================

            dtlcpXaLuyKe: 0,
            dtlcpXaDangDich: 0,
            dtlcpTieuHuy: 0,
            dtlcpKhoiLuong: 0,


            //================================================
            // CGC
            //================================================

            cgcXaLuyKe: 0,
            cgcXaDangDich: 0,
            cgcTieuHuy: 0,
            cgcKhoiLuong: 0,


            //================================================
            // VDNC
            //================================================

            vdncXaLuyKe: 0,
            vdncXaDangDich: 0,
            vdncMac: 0,
            vdncChet: 0,


            //================================================
            // DẠI
            //================================================

            daiXaLuyKe: 0,
            daiXaDangDich: 0,
            daiChet: 0,


            //================================================
            // PHUN KHỬ TRÙNG
            //================================================

            phunXa: 0,
            phunHo: 0,
            phunVong: 0,


            //================================================
            // KIỂM SOÁT GIẾT MỔ
            //================================================

            ksgmXa: 0,
            ksgmCoSo: 0,


            //================================================
            // CƠ SỞ THUỐC THÚ Y
            //================================================

            csbbtty: 0

        };


        //==================================================
        // DUYỆT DỮ LIỆU TỪNG XÃ/PHƯỜNG
        //==================================================

        rows.forEach(row => {

            if (!row) return;


            //================================================
            // 1. DỊCH TẢ LỢN CHÂU PHI - DTLCP
            //================================================

            const dtlcpTrangThai =
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
                dtlcpTrangThai === "đang có dịch" ||
                dtlcpTrangThai === "đã hết dịch"
            ) {

                stat.dtlcpXaLuyKe++;

            }


            // Xã đang có dịch

            if (
                dtlcpTrangThai === "đang có dịch"
            ) {

                stat.dtlcpXaDangDich++;

            }


            // Tổng số tiêu hủy

            stat.dtlcpTieuHuy +=
                dtlcpTieuHuy;


            // Tổng khối lượng

            stat.dtlcpKhoiLuong +=
                dtlcpKhoiLuong;


            //================================================
            // 2. CÚM GIA CẦM - CGC
            //================================================

            const cgcTrangThai =
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


            // Xã có dịch lũy kế

            if (
                cgcODich > 0 ||
                cgcTieuHuy > 0 ||
                cgcTrangThai === "đang có dịch" ||
                cgcTrangThai === "đã hết dịch"
            ) {

                stat.cgcXaLuyKe++;

            }


            // Xã đang có dịch

            if (
                cgcTrangThai === "đang có dịch"
            ) {

                stat.cgcXaDangDich++;

            }


            // Tổng số tiêu hủy

            stat.cgcTieuHuy +=
                cgcTieuHuy;


            // Tổng khối lượng

            stat.cgcKhoiLuong +=
                cgcKhoiLuong;


            //================================================
            // 3. VIÊM DA NỔI CỤC - VDNC
            //================================================

            const vdncTrangThai =
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


            // Xã có dịch lũy kế

            if (
                vdncODich > 0 ||
                vdncMac > 0 ||
                vdncChet > 0 ||
                vdncTrangThai === "đang có dịch" ||
                vdncTrangThai === "đã hết dịch"
            ) {

                stat.vdncXaLuyKe++;

            }


            // Xã đang có dịch

            if (
                vdncTrangThai === "đang có dịch"
            ) {

                stat.vdncXaDangDich++;

            }


            // Tổng số mắc

            stat.vdncMac +=
                vdncMac;


            // Tổng số chết

            stat.vdncChet +=
                vdncChet;


            //================================================
            // 4. BỆNH DẠI
            //================================================

            const daiTrangThai =
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


            // Xã có dịch lũy kế

            if (
                daiODich > 0 ||
                daiChet > 0 ||
                daiTrangThai === "đang có dịch" ||
                daiTrangThai === "đã hết dịch"
            ) {

                stat.daiXaLuyKe++;

            }


            // Xã đang có dịch

            if (
                daiTrangThai === "đang có dịch"
            ) {

                stat.daiXaDangDich++;

            }


            /*
             * Hiển thị trên Dashboard là:
             * "Số chết, tiêu hủy"
             *
             * Dữ liệu hiện tại sử dụng trường DAI_Chết.
             */

            stat.daiChet +=
                daiChet;


            //================================================
            // 5. PHUN KHỬ TRÙNG
            //================================================

            const phunVong =
                toNumber(
                    row["PHUN_Vòng"]
                );

            const phunHo =
                toNumber(
                    row["PHUN_Số hộ"]
                );

            const phunTienDo =
                String(
                    row["PHUN_Tiến độ"] || ""
                ).trim();


            /*
             * Xã triển khai:
             *
             * Có vòng triển khai
             * hoặc có số hộ
             * hoặc có thông tin tiến độ.
             */

            if (
                phunVong > 0 ||
                phunHo > 0 ||
                phunTienDo !== ""
            ) {

                stat.phunXa++;

            }


            // Tổng số hộ

            stat.phunHo +=
                phunHo;


            /*
             * Lấy vòng cao nhất đã triển khai
             * trên toàn tỉnh.
             */

            if (
                phunVong > stat.phunVong
            ) {

                stat.phunVong =
                    phunVong;

            }


            //================================================
            // 6. KIỂM SOÁT GIẾT MỔ - KSGM
            //================================================

            const ksgmTrangThai =
                normalizeStatus(
                    row["KSGM_Trạng thái"]
                );

            const ksgmCoSo =
                toNumber(
                    row["KSGM_Cơ sở"]
                );


            // Xã triển khai KSGM

            if (
                ksgmTrangThai === "đã triển khai"
            ) {

                stat.ksgmXa++;

            }


            // Tổng số cơ sở

            stat.ksgmCoSo +=
                ksgmCoSo;


            //================================================
            // 7. CƠ SỞ BUÔN BÁN THUỐC THÚ Y
            //================================================

            stat.csbbtty +=
                toNumber(
                    row["CSBBTTY_Cơ sở"]
                );

        });


        //==================================================
        // ĐƯA DỮ LIỆU RA GIAO DIỆN
        //==================================================


        //==================================================
        // DTLCP
        //==================================================

        setText(
            "dbDTLCPXaLuyKe",
            formatNumber(
                stat.dtlcpXaLuyKe
            )
        );

        setText(
            "dbDTLCPXaDangDich",
            formatNumber(
                stat.dtlcpXaDangDich
            )
        );

        setText(
            "dbDTLCPCon",
            formatNumber(
                stat.dtlcpTieuHuy
            )
        );

        setText(
            "dbDTLCPKhoiLuong",
            formatNumber(
                stat.dtlcpKhoiLuong
            )
        );


        //==================================================
        // CGC
        //==================================================

        setText(
            "dbCGCXaLuyKe",
            formatNumber(
                stat.cgcXaLuyKe
            )
        );

        setText(
            "dbCGCXaDangDich",
            formatNumber(
                stat.cgcXaDangDich
            )
        );

        setText(
            "dbCGCCon",
            formatNumber(
                stat.cgcTieuHuy
            )
        );

        setText(
            "dbCGCKhoiLuong",
            formatNumber(
                stat.cgcKhoiLuong
            )
        );


        //==================================================
        // VDNC
        //==================================================

        setText(
            "dbVDNCXaLuyKe",
            formatNumber(
                stat.vdncXaLuyKe
            )
        );

        setText(
            "dbVDNCXaDangDich",
            formatNumber(
                stat.vdncXaDangDich
            )
        );

        setText(
            "dbVDNCMac",
            formatNumber(
                stat.vdncMac
            )
        );

        setText(
            "dbVDNCChet",
            formatNumber(
                stat.vdncChet
            )
        );


        //==================================================
        // DẠI
        //==================================================

        setText(
            "dbDAIXaLuyKe",
            formatNumber(
                stat.daiXaLuyKe
            )
        );

        setText(
            "dbDAIXaDangDich",
            formatNumber(
                stat.daiXaDangDich
            )
        );

        setText(
            "dbDAIChet",
            formatNumber(
                stat.daiChet
            )
        );


        //==================================================
        // PHUN KHỬ TRÙNG
        //==================================================

        setText(
            "dbPhunXa",
            formatNumber(
                stat.phunXa
            )
        );

        setText(
            "dbPhunHo",
            formatNumber(
                stat.phunHo
            )
        );

        setText(
            "dbPhunVong",
            formatNumber(
                stat.phunVong
            )
        );


        //==================================================
        // KIỂM SOÁT GIẾT MỔ
        //==================================================

        setText(
            "dbKSGMXa",
            formatNumber(
                stat.ksgmXa
            )
        );

        setText(
            "dbKSGM",
            formatNumber(
                stat.ksgmCoSo
            )
        );


        //==================================================
        // CƠ SỞ THUỐC THÚ Y
        //==================================================

        setText(
            "dbCSBBTTY",
            formatNumber(
                stat.csbbtty
            )
        );


        //==================================================
        // DEBUG
        //==================================================

        console.log(
            "WEBGIS DASHBOARD:",
            stat
        );

    }

};


//======================================================
// CHUẨN HÓA TRẠNG THÁI
//======================================================

function normalizeStatus(value){

    if (
        value === null ||
        value === undefined
    ){

        return "";

    }

    return String(value)
        .trim()
        .toLowerCase();

}


//======================================================
// CHUYỂN GIÁ TRỊ SANG NUMBER
//======================================================

function toNumber(value){

    if (
        value === null ||
        value === undefined ||
        value === ""
    ){

        return 0;

    }


    if (
        typeof value === "number"
    ){

        return isNaN(value)
            ? 0
            : value;

    }


    let str =
        String(value)
            .trim();


    if (!str){

        return 0;

    }


    /*
     * Loại bỏ đơn vị:
     *
     * 1.234 con
     * 1.234 kg
     */

    str =
        str.replace(
            /[^\d,.-]/g,
            ""
        );


    /*
     * 1.234,56
     * → 1234.56
     */

    if (
        str.includes(".") &&
        str.includes(",")
    ){

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


    /*
     * 1.234
     * → 1234
     */

    else if (
        str.includes(".")
    ){

        str =
            str.replace(
                /\./g,
                ""
            );

    }


    /*
     * 1234,5
     * → 1234.5
     */

    else if (
        str.includes(",")
    ){

        const parts =
            str.split(",");


        if (
            parts.length === 2 &&
            parts[1].length <= 2
        ){

            str =
                parts[0] +
                "." +
                parts[1];

        }
        else{

            str =
                str.replace(
                    /,/g,
                    ""
                );

        }

    }


    const number =
        Number(str);


    return isNaN(number)
        ? 0
        : number;

}


//======================================================
// FORMAT SỐ
//======================================================

function formatNumber(value){

    const number =
        Number(value);


    if (
        isNaN(number)
    ){

        return "0";

    }


    return number.toLocaleString(
        "vi-VN"
    );

}


//======================================================
// GÁN TEXT
//======================================================

function setText(id,value){

    const el =
        document.getElementById(id);


    if (el){

        el.textContent =
            value;

    }

}
```
