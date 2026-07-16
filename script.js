// Khởi tạo bản đồ
const map = L.map('map').setView([21.386,103.023],9);

// Bản đồ nền OpenStreetMap
L.tileLayer(
'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
{
    attribution:'© OpenStreetMap'
}
).addTo(map);
fetch("dienbien_xa.geojson")
  .then(response => response.json())
  .then(data => {

    L.geoJSON(data,{
      style:{
        color:"#0066cc",
        weight:2,
        fillColor:"#66ccff",
        fillOpacity:0.3
      }
    }).addTo(map);

  });
