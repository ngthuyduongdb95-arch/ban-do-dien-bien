//======================================================
// DASHBOARD.JS
// WEBGIS QUẢN LÝ DỊCH BỆNH ĐỘNG VẬT ĐIỆN BIÊN
//======================================================

const dashboard = {

    update:function(){

        if(typeof sheetData === "undefined"){

            console.warn("sheetData chưa được tải.");

            return;

        }

        const rows = Object.values(sheetData);


        //==================================================
        // KHỞI TẠO THỐNG KÊ
        //==================================================

        const stat = {

            // DTLCP
            dtlcpXa:0,
            dtlcpMac:0,
            dtlcpCon:0,

            // CGC
            cgcXa:0,
            cgcMac:0,
            cgcCon:0,

            // VDNC
            vdncXa:0,
            vdncMac:0,

            // PHUN
            phunXa:0,
            phunHo:0,

            // KSGM
            ksgm:0,

            // CƠ SỞ THUỐC THÚ Y
            csbbtty:0

        };


        //==================================================
        // DUYỆT DỮ LIỆU
        //==================================================

        rows.forEach(row => {

            if(!row) return;


            //------------------------------------------------
            // DTLCP
            //------------------------------------------------

            const dtlcpChet =
                toNumber(row["DTLCP_Chết"]);

            const dtlcpMac =
                toNumber(
                    row["DTLCP_Mắc"] ??
                    row["DTLCP_Mac"]
                );

            /*
             * Số xã có DTLCP:
             * Ưu tiên căn cứ vào số con chết/tiêu hủy.
             * Nếu không có trường này nhưng có trường mắc
             * thì vẫn tính xã có dịch.
             */

            if(dtlcpChet > 0 || dtlcpMac > 0){

                stat.dtlcpXa++;

            }

            stat.dtlcpMac += dtlcpMac;

            stat.dtlcpCon += dtlcpChet;


            //------------------------------------------------
            // CÚM GIA CẦM
            //------------------------------------------------

            const cgcChet =
                toNumber(row["CGC_Chết"]);

            const cgcMac =
                toNumber(
                    row["CGC_Mắc"] ??
                    row["CGC_Mac"]
                );

            if(cgcChet > 0 || cgcMac > 0){

                stat.cgcXa++;

            }

            stat.cgcMac += cgcMac;

            stat.cgcCon += cgcChet;


            //------------------------------------------------
            // VIÊM DA NỔI CỤC
            //------------------------------------------------

            const vdnc =
                toNumber(row["VDNC_Mắc"]);

            if(vdnc > 0){

                stat.vdncXa++;

                stat.vdncMac += vdnc;

            }


            //------------------------------------------------
            // PHUN KHỬ TRÙNG
            //------------------------------------------------

            const phun =
                toNumber(row["PHUN_Số hộ"]);

            if(phun > 0){

                stat.phunXa++;

                stat.phunHo += phun;

            }


            //------------------------------------------------
            // KIỂM SOÁT GIẾT MỔ
            //------------------------------------------------

            stat.ksgm +=
                toNumber(row["KSGM_Cơ sở"]);


            //------------------------------------------------
            // CƠ SỞ THUỐC THÚ Y
            //------------------------------------------------

            stat.csbbtty +=
                toNumber(row["CSBBTTY_Cơ sở"]);

        });


        //==================================================
        // ĐỔ DỮ LIỆU RA GIAO DIỆN
        //==================================================


        // DTLCP

        setText(
            "dbDTLCPXa",
            formatNumber(stat.dtlcpXa)
        );

        setText(
            "dbDTLCPCon",
            formatNumber(stat.dtlcpCon)
        );

        /*
         * Chỉ hiển thị số mắc nếu Sheet thực sự
         * có trường DTLCP_Mắc / DTLCP_Mac.
         */

        setText(
            "dbDTLCPMac",
            statHasValue(stat.dtlcpMac)
                ? formatNumber(stat.dtlcpMac)
                : "--"
        );


        // CGC

        setText(
            "dbCGCXa",
            formatNumber(stat.cgcXa)
        );

        setText(
            "dbCGCCon",
            formatNumber(stat.cgcCon)
        );

        setText(
            "dbCGCMac",
            statHasValue(stat.cgcMac)
                ? formatNumber(stat.cgcMac)
                : "--"
        );


        // VDNC

        setText(
            "dbVDNCXa",
            formatNumber(stat.vdncXa)
        );

        setText(
            "dbVDNCMac",
            formatNumber(stat.vdncMac)
        );


        // PHUN

        setText(
            "dbPhunXa",
            formatNumber(stat.phunXa)
        );

        setText(
            "dbPhunHo",
            formatNumber(stat.phunHo)
        );


        // KSGM

        setText(
            "dbKSGM",
            formatNumber(stat.ksgm)
        );


        // CƠ SỞ THUỐC THÚ Y

        setText(
            "dbCSBBTTY",
            formatNumber(stat.csbbtty)
        );


        //==================================================
        // CẬP NHẬT THỜI GIAN
        //==================================================

        updateDashboardDate();

    }

};


//======================================================
// CHUYỂN GIÁ TRỊ SANG NUMBER
//======================================================

function toNumber(value){

    if(value === null || value === undefined){

        return 0;

    }

    if(typeof value === "number"){

        return isNaN(value) ? 0 : value;

    }

    /*
     * Xử lý các dạng:
     *
     * 1.234
     * 1,234
     * 1234
     * "1.234 con"
     */

    let str = String(value).trim();

    if(str === ""){

        return 0;

    }

    str = str
        .replace(/[^\d,.-]/g,"")
        .replace(/\./g,"")
        .replace(/,/g,".");

    const number = Number(str);

    return isNaN(number) ? 0 : number;

}


//======================================================
// KIỂM TRA CÓ SỐ LIỆU THỰC
//======================================================

function statHasValue(value){

    return Number(value) > 0;

}


//======================================================
// GÁN TEXT
//======================================================

function setText(id,value){

    const el = document.getElementById(id);

    if(el){

        el.textContent = value;

    }

}


//======================================================
// FORMAT SỐ
//======================================================

function formatNumber(value){

    const number = Number(value);

    if(isNaN(number)){

        return "0";

    }

    return number.toLocaleString("vi-VN");

}


//======================================================
// NGÀY CẬP NHẬT
//======================================================

function updateDashboardDate(){

    const el =
        document.getElementById("dbLastUpdate");

    if(!el) return;


    /*
     * Nếu hệ thống sau này có biến thời gian
     * cập nhật thực tế từ Google Sheets thì ưu tiên
     * sử dụng biến đó.
     */

    if(typeof lastDataUpdate !== "undefined" &&
       lastDataUpdate){

        const date =
            new Date(lastDataUpdate);

        if(!isNaN(date.getTime())){

            el.textContent =
                formatDate(date);

            return;

        }

    }


    /*
     * Tạm thời không ghi ngày giả.
     * Cho biết hệ thống chưa nhận được thời gian
     * cập nhật thực tế từ nguồn dữ liệu.
     */

    el.textContent = "Chưa xác định";

}


//======================================================
// FORMAT NGÀY
//======================================================

function formatDate(date){

    const day =
        String(date.getDate()).padStart(2,"0");

    const month =
        String(date.getMonth()+1).padStart(2,"0");

    const year =
        date.getFullYear();

    return `${day}/${month}/${year}`;

}
