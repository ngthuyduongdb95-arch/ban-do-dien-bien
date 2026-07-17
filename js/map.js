// Khởi tạo bản đồ
const map = L.map("map").setView([21.386, 103.023], 9);

// Bản đồ nền
L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        attribution: "© OpenStreetMap"
    }
).addTo(map);

// Đọc GeoJSON
fetch("data/dienbien_xa.geojson")
    .then(response => {
        console.log("Status:", response.status);
        console.log("Content-Type:", response.headers.get("content-type"));
        return response.text();
    })
    .then(text => {
        console.log("Nội dung đầu file:");
        console.log(text.substring(0, 200));

        const data = JSON.parse(text);

        L.geoJSON(data, {
            style: {
                color: "#1976D2",
                weight: 1.5,
                fillColor: "#64B5F6",
                fillOpacity: 0.35
            }
        }).addTo(map);
    })
    .catch(err => {
        console.error("Lỗi:", err);
    });
