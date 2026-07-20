// ================= KHỞI TẠO BẢN ĐỒ =================

const map = L.map("map").setView([21.386, 103.023], 9);

// Bản đồ nền
L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        attribution: "© OpenStreetMap"
    }
).addTo(map);

let geojson;

// ================= KIỂU HIỂN THỊ =================

function style(feature) {

    return {
        color: "#1976D2",
        weight: 1.5,
        fillColor: "#64B5F6",
        fillOpacity: 0.35
    };

}

// ================= HOVER =================

function highlightFeature(e) {

    const layer = e.target;

    layer.setStyle({
        weight: 3,
        color: "#ff0000",
        fillOpacity: 0.6
    });

}

function resetHighlight(e) {

    geojson.resetStyle(e.target);

}

// ================= CLICK =================

function zoomToFeature(e) {

    console.log(e.target.feature.properties);

    return;

}

// ================= GẮN SỰ KIỆN =================

function onEachFeature(feature, layer) {

    layer.on({
        mouseover: highlightFeature,
        mouseout: resetHighlight,
        click: zoomToFeature
    });

}

// ================= ĐỌC DỮ LIỆU =================

loadGISData().then(() => {

    fetch("data/dienbien_xa.geojson")
        .then(r => r.json())
        .then(data => {

            geojson = L.geoJSON(data, {
                style: style,
                onEachFeature: onEachFeature
            }).addTo(map);

        });

});
