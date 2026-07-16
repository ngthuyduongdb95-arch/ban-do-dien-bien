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

    let geojson;

fetch("dienbien_xa.geojson")
  .then(response => response.json())
  .then(data => {

    geojson = L.geoJSON(data, {

      style: {
        color: "#0066cc",
        weight: 2,
        fillColor: "#66ccff",
        fillOpacity: 0.3
      },

      onEachFeature: function (feature, layer) {

        console.log(feature.properties);

        layer.bindPopup("Đây là một xã");

      }

    }).addTo(map);

  });
