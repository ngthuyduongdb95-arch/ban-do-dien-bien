// ================= API GOOGLE SHEETS =================

const API_URL = "https://script.google.com/macros/s/AKfycbxvF3U6jCOPVrV-9iSivSiX4ynVeusbjSF4nJmCrMuSok_dEaKSvGi-CRSXCPlrQ43d/exec";

let gisData = {};

// ================= ĐỌC DỮ LIỆU =================

async function loadGISData() {

    try {

        const response = await fetch(API_URL);

        const data = await response.json();

        gisData = {};

        data.forEach(item => {

            // Lưu theo ID
            gisData[Number(item["ID"])] = item;

        });

        console.log("Đã tải", Object.keys(gisData).length, "xã");
        console.log(gisData);

    } catch (err) {

        console.error("Lỗi tải dữ liệu:", err);

    }

}
