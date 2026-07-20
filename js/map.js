// ================= KHỞI TẠO BẢN ĐỒ =================

const map = L.map("map").setView([21.386, 103.023], 9);

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

    e.target.setStyle({
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

    map.fitBounds(e.target.getBounds());

    const idXa = e.target.feature.properties.ID;
    const tenXa = e.target.feature.properties.TenXa;

    const d = gisData[idXa];

    console.log("ID:", idXa);
    console.log("Tên:", tenXa);
    console.log("Dữ liệu:", d);

    const panel = document.getElementById("info-panel");

    if (!panel) return;

    if (!d) {

        panel.innerHTML = `
            <h2>${tenXa}</h2>
            <hr>
            <p style="color:red"><b>Không tìm thấy dữ liệu cho ID: ${idXa}</b></p>
        `;

        return;

    }

    panel.innerHTML = `
<h2>${tenXa}</h2>

<hr>

<div class="info-section">

<h4>🐷 DỊCH TẢ LỢN CHÂU PHI</h4>

<p><b>Trạng thái:</b> ${d["DTLCP_Trạng thái"] || "--"}</p>
<p><b>Số ổ dịch:</b> ${d["DTLCP_Ổ dịch"] || 0}</p>
<p><b>Tiêu hủy:</b> ${d["DTLCP_Chết"] || 0} con</p>
<p><b>Trọng lượng:</b> ${d["DTLCP_Trọng lượng"] || 0} kg</p>
<p><b>Ngày cuối:</b> ${d["DTLCP_Ngày cuối"] || "--"}</p>
<p><b>Số ngày:</b> ${d["DTLCP_Số ngày"] || "--"}</p>

</div>

<div class="info-section">

<h4>🐔 CÚM GIA CẦM</h4>

<p><b>Trạng thái:</b> ${d["CGC_Trạng thái"] || "--"}</p>
<p><b>Số ổ dịch:</b> ${d["CGC_Ổ dịch"] || 0}</p>
<p><b>Tiêu hủy:</b> ${d["CGC_Chết"] || 0} con</p>
<p><b>Trọng lượng:</b> ${d["CGC_Trọng lượng"] || 0} kg</p>
<p><b>Ngày cuối:</b> ${d["CGC_Ngày cuối"] || "--"}</p>
<p><b>Số ngày:</b> ${d["CGC_Số ngày"] || "--"}</p>

</div>

<div class="info-section">

<h4>🐄 VIÊM DA NỔI CỤC</h4>

<p><b>Trạng thái:</b> ${d["VDNC_Trạng thái"] || "--"}</p>
<p><b>Số ổ dịch:</b> ${d["VDNC_Ổ dịch"] || 0}</p>
<p><b>Mắc bệnh:</b> ${d["VDNC_Mắc"] || 0} con</p>
<p><b>Chết:</b> ${d["VDNC_Chết"] || 0} con</p>
<p><b>Trọng lượng:</b> ${d["VDNC_Trọng lượng"] || 0} kg</p>
<p><b>Ngày cuối:</b> ${d["VDNC_Ngày cuối"] || "--"}</p>
<p><b>Số ngày:</b> ${d["VDNC_Số ngày"] || "--"}</p>

</div>

<div class="info-section">

<h4>🧴 PHUN PHÒNG</h4>

<p><b>Tiến độ:</b> ${d["PHUN_Tiến độ"] || "--"}</p>
<p><b>Vòng:</b> ${d["PHUN_Vòng"] || "--"}</p>
<p><b>Số hộ:</b> ${d["PHUN_Số hộ"] || 0}</p>
<p><b>Diện tích:</b> ${d["PHUN_Diện tích"] || 0}</p>
<p><b>Hóa chất:</b> ${d["PHUN_Hóa chất"] || "--"}</p>
<p><b>Ngày:</b> ${d["PHUN_Ngày"] || "--"}</p>

</div>

<div class="info-section">

<h4>💊 CƠ SỞ BUÔN BÁN THUỐC THÚ Y</h4>

<p><b>Số cơ sở:</b> ${d["CSBBTTY_Cơ sở"] || 0}</p>

</div>

<div class="info-section">

<h4>🏭 KIỂM SOÁT GIẾT MỔ</h4>

<p><b>Trạng thái:</b> ${d["KSGM_Trạng thái"] || "--"}</p>
<p><b>Số cơ sở:</b> ${d["KSGM_Cơ sở"] || 0}</p>

</div>
`;

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
