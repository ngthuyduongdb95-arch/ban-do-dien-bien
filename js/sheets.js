// ================= API GOOGLE SHEETS =================

// Thay thế URL bằng Web App URL của bạn từ Google Apps Script
const API_URL = "https://script.google.com/macros/s/AKfycbxvF3U6jCOPVrV-9iSivSiX4ynVeusbjSF4nJmCrMuSok_dEaKSvGi-CRSXCPlrQ43d/exec";

let gisData = {};

// ================= ĐỌC DỮ LIỆU TỪ GOOGLE SHEETS =================

async function loadGISData() {
    try {
        const response = await fetch(API_URL);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        gisData = {};

        data.forEach(item => {
            // Lưu dữ liệu theo khóa là ID của xã (ép kiểu Number)
            const id = Number(item["ID"]);
            if (!isNaN(id)) {
                gisData[id] = item;
            }
        });

        console.log("Đã tải thành công dữ liệu cho", Object.keys(gisData).length, "xã");

    } catch (err) {
        console.error("Lỗi tải dữ liệu từ Google Sheets:", err);
        alert("Không thể tải dữ liệu từ Google Sheets. Vui lòng kiểm tra lại quyền truy cập Apps Script hoặc kết nối mạng!");
    }
}
