//======================================================
// DASHBOARD.JS
// WEBGIS ĐIỆN BIÊN
//======================================================
//
// TỔNG QUAN:
//
// 1. DTLCP
//    - Xã có dịch (lũy kế)
//    - Xã đang có dịch
//    - Tiêu hủy
//    - Khối lượng
//
// 2. CGC
//    - Xã có dịch (lũy kế)
//    - Xã đang có dịch
//    - Tiêu hủy
//    - Khối lượng
//
// 3. VDNC
//    - Xã có dịch (lũy kế)
//    - Xã đang có dịch
//    - Mắc
//    - Chết
//
// 4. PHUN KHỬ TRÙNG
//    - Xã triển khai
//    - Số hộ
//    - Vòng
//
// 5. KSGM
//    - Xã triển khai
//    - Số cơ sở
//
// 6. THUỐC THÚ Y
//    - Số cơ sở
//
//======================================================


//======================================================
// DASHBOARD
//======================================================

const dashboard = {

    update:function(){

        //================================================
        // KIỂM TRA DỮ LIỆU
        //================================================

        if(typeof sheetData === "undefined"){

            console.warn(
                "Dashboard: sheetData chưa tồn tại."
            );

            return;

        }


        const rows = Object.values(sheetData);


        //================================================
        // KHỞI TẠO THỐNG KÊ
        //================================================

        const stat = {

            // DTLCP
            dtlcpXaLuyKe:0,
            dtlcpXaDangDich:0,
            dtlcpTieuHuy:0,
            dtlcpKhoiLuong:0,

            // CGC
            cgcXaLuyKe:0,
            cgcXaDangDich:0,
            cgcTieuHuy:0,
            cgcKhoiLuong:0,

            // VDNC
            vdncXaLuyKe:0,
            vdncXaDangDich:0,
            vdncMac:0,
            vdncChet:0,

            // PHUN
            phunXa:0,
            phunHo:0,
            phunVong:0,

            // KSGM
            ksgmXa:0,
            ksgmCoSo:0,

            // THUỐC THÚ Y
            csbbtty:0

        };


        //================================================
        // DUYỆT TOÀN BỘ XÃ/PHƯỜNG
        //================================================

        rows.forEach(row => {

            if(!row) return;


            //================================================
            // DTLCP
            //================================================

            const dtlcpTrangThai =
                String(
                    row["DTLCP_Trạng thái"] || ""
                ).trim();

            const dtlcpO =
                toNumber(
                    row["DTLCP_Ổ dịch"]
                );

            const dtlcpChet =
                toNumber(
                    row["DTLCP_Chết"]
                );

            const dtlcpKhoiLuong =
                toNumber(
                    row["DTLCP_Trọng lượng"]
                );


            /*
             * Xã có dịch lũy kế:
             *
             * Có thông tin ổ dịch hoặc có số liệu
             * dịch bệnh thì được tính vào lũy kế.
             */

            if(
                dtlcpO > 0 ||
                dtlcpChet > 0 ||
                dtlcpTrangThai !== ""
            ){

                stat.dtlcpXaLuyKe++;

            }


            /*
             * Xã đang có dịch:
             *
             * Bám đúng logic mà map.js đang sử dụng.
             */

            if(
                dtlcpTrangThai === "Đang có dịch"
            ){

                stat.dtlcpXaDangDich++;

            }


            stat.dtlcpTieuHuy +=
                dtlcpChet;

            stat.dtlcpKhoiLuong +=
                dtlcpKhoiLuong;


            //================================================
            // CGC
            //================================================

            const cgcTrangThai =
                String(
                    row["CGC_Trạng thái"] || ""
                ).trim();

            const cgcO =
                toNumber(
                    row["CGC_Ổ dịch"]
                );

            const cgcChet =
                toNumber(
                    row["CGC_Chết"]
                );

            const cgcKhoiLuong =
                toNumber(
                    row["CGC_Trọng lượng"]
                );


            /*
             * Xã có dịch lũy kế
             */

            if(
                cgcO > 0 ||
                cgcChet > 0 ||
                cgcTrangThai !== ""
            ){

                stat.cgcXaLuyKe++;

            }


            /*
             * Xã đang có dịch
             */

            if(
                cgcTrangThai === "Đang có dịch"
            ){

                stat.cgcXaDangDich++;

            }


            stat.cgcTieuHuy +=
                cgcChet;

            stat.cgcKhoiLuong +=
                cgcKhoiLuong;


            //================================================
            // VDNC
            //================================================

            const vdncTrangThai =
                String(
                    row["VDNC_Trạng thái"] || ""
                ).trim();

            const vdncO =
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


            /*
             * Xã có dịch lũy kế
             */

            if(
                vdncO > 0 ||
                vdncMac > 0 ||
                vdncChet > 0 ||
                vdncTrangThai !== ""
            ){

                stat.vdncXaLuyKe++;

            }


            /*
             * Xã đang có dịch
             */

            if(
                vdncTrangThai === "Đang có dịch"
            ){

                stat.vdncXaDangDich++;

            }


            stat.vdncMac +=
                vdncMac;

            stat.vdncChet +=
                vdncChet;


            //================================================
            // PHUN KHỬ TRÙNG
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
             * Có vòng triển khai hoặc có số hộ
             * hoặc có thông tin tiến độ.
             */

            if(
                phunVong > 0 ||
                phunHo > 0 ||
                phunTienDo !== ""
            ){

                stat.phunXa++;

            }


            stat.phunHo +=
                phunHo;


            /*
             * Vòng:
             *
             * Tổng quan cần thể hiện vòng cao nhất
             * đã triển khai trên toàn tỉnh.
             */

            if(phunVong > stat.phunVong){

                stat.phunVong =
                    phunVong;

            }


            //================================================
            // KIỂM SOÁT GIẾT MỔ
            //================================================

            const ksgmTrangThai =
                String(
                    row["KSGM_Trạng thái"] || ""
                ).trim();

            const ksgmCoSo =
                toNumber(
                    row["KSGM_Cơ sở"]
                );


            /*
             * Xã triển khai KSGM
             */

            if(
                ksgmTrangThai === "Đã triển khai"
            ){

                stat.ksgmXa++;

            }


            stat.ksgmCoSo +=
                ksgmCoSo;


            //================================================
            // CƠ SỞ BUÔN BÁN THUỐC THÚ Y
            //================================================

            stat.csbbtty +=
                toNumber(
                    row["CSBBTTY_Cơ sở"]
                );

        });


        //================================================
        // DTLCP
        //================================================

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


        //================================================
        // CGC
        //================================================

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


        //================================================
        // VDNC
        //================================================

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


        //================================================
        // PHUN KHỬ TRÙNG
        //================================================

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


        //================================================
        // KIỂM SOÁT GIẾT MỔ
        //================================================

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


        //================================================
        // CƠ SỞ THUỐC THÚ Y
        //================================================

        setText(
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
// CHUYỂN GIÁ TRỊ SANG NUMBER
//======================================================

function toNumber(value){

    if(
        value === null ||
        value === undefined ||
        value === ""
    ){

        return 0;

    }


    if(typeof value === "number"){

        return isNaN(value)
            ? 0
            : value;

    }


    let str =
        String(value)
            .trim();


    if(!str){

        return 0;

    }


    /*
     * Loại bỏ đơn vị:
     *
     * "1.234 con"
     * "1.234 kg"
     *
     */

    str =
        str.replace(
            /[^\d,.-]/g,
            ""
        );


    /*
     * Dữ liệu Việt Nam:
     *
     * 1.234 = 1234
     * 12,5 = 12.5
     */

    if(
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
    else if(
        str.includes(".")
    ){

        /*
         * Dấu chấm được hiểu là
         * phân cách hàng nghìn.
         */

        str =
            str.replace(
                /\./g,
                ""
            );

    }
    else if(
        str.includes(",")
    ){

        /*
         * Một dấu phẩy có thể là
         * số thập phân.
         */

        const parts =
            str.split(",");

        if(
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


    if(
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


    if(el){

        el.textContent =
            value;

    }

}
