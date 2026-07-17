// Khởi tạo bản đồ
const map = L.map("map").setView([21.386, 103.023], 9);

// Bản đồ nền
L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        attribution: "© OpenStreetMap"
    }
).addTo(map);

let geojson;

// Kiểu hiển thị mặc định
function style(feature) {
    return {
        color: "#1976D2",
        weight: 1.5,
        fillColor: "#64B5F6",
        fillOpacity: 0.35
    };
}

// Khi di chuột vào
function highlightFeature(e) {
    const layer = e.target;

    layer.setStyle({
        weight: 3,
        color: "#ff0000",
        fillOpacity: 0.6
    });

}

// Khi di chuột ra
function resetHighlight(e) {
    geojson.resetStyle(e.target);
}

// Khi click
function zoomToFeature(e) {

    map.fitBounds(e.target.getBounds());

    const tenXa = e.target.feature.properties.TenXa;

    const panel = document.getElementById("info-panel");

    console.log(panel);

    if (!panel) {
        alert("Không tìm thấy info-panel");
        return;
    }

    panel.innerHTML = `
        <h2>${tenXa}</h2>
        <p>Đã click thành công</p>
    `;
}

// Gắn sự kiện
function onEachFeature(feature, layer) {

    console.log("Đã gắn sự kiện:", feature.properties.TenXa);

    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: zoomToFeature
    });
}

// Đọc GeoJSON
fetch("data/dienbien_xa.geojson")
    .then(r => r.json())
    .then(data => {

        geojson = L.geoJSON(data, {
            style: style,
            onEachFeature: onEachFeature
        }).addTo(map);

    });
