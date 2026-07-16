// Khởi tạo bản đồ
const map = L.map('map').setView([21.386,103.023],9);

// Bản đồ nền OpenStreetMap
L.tileLayer(
'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
{
    attribution:'© OpenStreetMap'
}
).addTo(map);
