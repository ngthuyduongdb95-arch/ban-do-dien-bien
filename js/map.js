// ======================================================
// MAP.JS
// WEBGIS QUẢN LÝ DỊCH BỆNH ĐỘNG VẬT - ĐIỆN BIÊN
// ======================================================
// Quy ước:
// 1. Dữ liệu bệnh: Natural Breaks (Jenks) động.
// 2. 0 = xã không có dịch / không có số liệu, tách riêng.
// 3. Mức thiệt hại bắt đầu từ 1.
// 4. Mỗi lớp có 01 thang màu riêng, 6 mức sáng -> đậm.
// 5. Xã đang có dịch = 01 chấm đỏ, viền trắng, không pulse.
// 6. Click xã chỉ cập nhật panel bên phải.
// ======================================================

"use strict";

let map = null;
let geojsonData = null;
let geojsonLayer = null;
let labelLayer = null;
let diseaseMarkerLayer = null;
let legendControl = null;
let currentLayer = "DTLCP";
let selectedFeature = null;
let selectedLayer = null;
let currentBasemap = "street";
let damageRanges = [];

const STREET_URL =
    "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

const SATELLITE_URL =
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";

const layerConfig = {
    DTLCP: {
        name: "Dịch tả lợn Châu Phi",
        field: "DTLCP_Chết",
        status: "DTLCP_Trạng thái",
        outbreak: "DTLCP_Ổ dịch",
        unit: "con",
        colors: ["#FFE45E","#FFC43D","#FFA21A","#FF6A1A","#E6392E","#B71C1C"]
    },
    CGC: {
        name: "Cúm gia cầm",
        field: "CGC_Chết",
        status: "CGC_Trạng thái",
        outbreak: "CGC_Ổ dịch",
        unit: "con",
        colors: ["#C8E6C9","#A5D6A7","#66BB6A","#388E3C","#1B5E20","#0D3D17"]
    },
    VDNC: {
        name: "Viêm da nổi cục",
        field: "VDNC_Mắc",
        death: "VDNC_Chết",
        status: "VDNC_Trạng thái",
        outbreak: "VDNC_Ổ dịch",
        unit: "con",
        colors: ["#C6E2FF","#8CC5FF","#5AA6FF","#2F7DF6","#1558D6","#0A2E7D"]
    },
    DAI: {
        name: "Bệnh Dại",
        field: "DAI_Chết",
        death: "DAI_Tiêu hủy",
        status: "DAI_Trạng thái",
        outbreak: "DAI_Ổ dịch",
        unit: "con",
        colors: ["#E9D5FF","#D4B5FF","#9B5DE5","#8E5CF6","#6A35D1","#4A148C"]
    },
    PHUN: {
        name: "Phun khử trùng",
        field: "PHUN_Vòng",
        colors: ["#BFEDEE","#80E1E6","#3CC9D2","#19A7B3","#0D7F87","#094D4F"]
    },
    KSGM: {
        name: "Kiểm soát giết mổ",
        field: "KSGM_Cơ sở",
        status: "KSGM_Trạng thái",
        colors: ["#E8D8D2","#D7CCC8","#A1887F","#795548","#5D4037","#3E2723"]
    },
    CSBBTTY: {
        name: "Cơ sở buôn bán thuốc thú y",
        field: "CSBBTTY_Cơ sở",
        colors: ["#D7F3FF","#A7E6F7","#67D2E8","#29B6D1","#0288B8","#01579B"]
    }
};

// ------------------------------------------------------
// Khởi tạo
// ------------------------------------------------------

function initMap() {
    if (map) return map;

    map = L.map("map", {
    zoomControl: false,
    preferCanvas: false,
    minZoom: 7,
    maxZoom: 18
}).setView([21.386, 103.016], 9);

    L.control.zoom({ position: "topleft" }).addTo(map);
    L.control.scale({
        position: "bottomleft",
        imperial: false,
        maxWidth: 120
    }).addTo(map);

    addBaseLayers();
    addProvinceEmphasis();
    map.createPane("diseaseMarkers");
    map.getPane("diseaseMarkers").style.zIndex = 640;
    map.createPane("mapLabels");
    map.getPane("mapLabels").style.zIndex = 650;
    map.getPane("diseaseMarkers").style.pointerEvents = "none";
    map.getPane("mapLabels").style.pointerEvents = "none";
    bindControls();

    return map;
}

let streetLayer = null;
let satelliteLayer = null;

function addBaseLayers() {
    streetLayer = L.tileLayer(STREET_URL, {
        maxZoom: 19,
        attribution: "&copy; OpenStreetMap &copy; CARTO",
        subdomains: "abcd"
    });

    satelliteLayer = L.tileLayer(SATELLITE_URL, {
        maxZoom: 19,
        attribution: "Tiles &copy; Esri"
    });

    streetLayer.addTo(map);
}

function addProvinceEmphasis() {
    // Dùng lớp viền ngoài dựa trên GeoJSON tỉnh khi dữ liệu cung cấp.
    // Nếu GeoJSON chỉ có 45 xã/phường, ranh giới xã vẫn được làm nổi bật
    // và toàn bộ khu vực Điện Biên được đặt ở trung tâm bản đồ.
}

function refreshMapTitle() {
    const title = document.getElementById("mapTitle");
    if (title) title.textContent = layerConfig[currentLayer].name;
}

// ------------------------------------------------------
// Dữ liệu
// ------------------------------------------------------

function normalizeMapName(value) {
    return String(value ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/đ/g, "d")
        .replace(/\s+/g, " ")
        .trim()
        .replace(/^(xa|phuong|thi tran)\s+/i, "");
}

function getRows() {
    try {
        if (typeof sheetData !== "undefined" && sheetData && typeof sheetData === "object") {
            const rows = Object.values(sheetData);
            if (rows.length) return rows;
        }
    } catch (error) {
        console.warn("MAP: không đọc được sheetData", error);
    }

    if (typeof window.getRows === "function") {
        try {
            const rows = window.getRows();
            if (Array.isArray(rows)) return rows;
        } catch (error) {
            console.warn("MAP: getRows() lỗi", error);
        }
    }
    return [];
}

function getRow(feature) {
    if (!feature || !feature.properties) return null;
    const p = feature.properties;

    const rawId = p.ID ?? p.id ?? p.Id ?? p.id_xa ?? p.ID_XA;
    const id = Number(rawId);

    try {
        if (Number.isFinite(id) && typeof sheetData !== "undefined" && sheetData && sheetData[id]) {
            return sheetData[id];
        }
    } catch (_) {}

    const geoName = p["Tên xã"] || p["Tên xã/phường"] || p.TEN_XA || p.TENXA || p.NAME || p.Name || p.name || "";
    const target = normalizeMapName(geoName);
    if (!target) return null;

    return getRows().find(row => {
        const sheetName = row["Tên xã"] || row["Tên xã/phường"] || row.TEN_XA || row.TENXA || row.NAME || row.Name || row.name || "";
        return normalizeMapName(sheetName) === target;
    }) || null;
}

function num(value) {
    if (value === null || value === undefined || value === "") return 0;
    if (typeof value === "number") return Number.isFinite(value) ? value : 0;

    let s = String(value).trim().replace(/[^\d,.-]/g, "");
    if (!s) return 0;

    if (s.includes(".") && s.includes(",")) {
        s = s.replace(/\./g, "").replace(",", ".");
    } else if (s.includes(",")) {
        const p = s.split(",");
        s = p.length === 2 && p[1].length <= 2
            ? p[0] + "." + p[1]
            : s.replace(/,/g, "");
    } else if ((s.match(/\./g) || []).length > 1) {
        s = s.replace(/\./g, "");
    }

    const n = Number(s);
    return Number.isFinite(n) ? n : 0;
}

function fmt(value) {
    return num(value).toLocaleString("vi-VN", {
        maximumFractionDigits: 2
    });
}

function norm(value) {
    return String(value ?? "").trim().toLowerCase();
}

function getName(feature) {
    const row = getRow(feature);
    if (row) {
        const name = row["Tên xã"] || row["Tên xã/phường"] || row.TEN_XA || row.TENXA || row.NAME || row.Name || row.name;
        if (String(name || "").trim()) return String(name).trim();
    }
    const p = feature?.properties || {};
    return String(
        p["Tên xã"] || p["Tên xã/phường"] || p.TEN_XA || p.TENXA || p.NAME || p.Name || p.name || ""
    ).trim();
}

function isActive(row, config) {
    return !!row && !!config.status &&
        norm(row[config.status]) === "đang có dịch";
}

function hasData(feature) {
    const row = getRow(feature);
    if (!row) return false;

    const cfg = layerConfig[currentLayer];

    if (currentLayer === "PHUN") {
        return num(row["PHUN_Số hộ"]) > 0 ||
               num(row["PHUN_Vòng"]) > 0 ||
               norm(row["PHUN_Tiến độ"]) !== "";
    }

    if (currentLayer === "KSGM") {
        return num(row["KSGM_Cơ sở"]) > 0 ||
               norm(row["KSGM_Trạng thái"]) !== "";
    }

    if (currentLayer === "CSBBTTY") {
        return num(row["CSBBTTY_Cơ sở"]) > 0;
    }

    return num(row[cfg.field]) > 0 ||
           num(row[cfg.outbreak]) > 0 ||
           num(row[cfg.death]) > 0 ||
           norm(row[cfg.status]) === "đang có dịch";
}

// ------------------------------------------------------
// Natural Breaks (Jenks)
// ------------------------------------------------------

function jenks(values, classCount) {
    const data = values
        .filter(v => Number.isFinite(v) && v > 0)
        .map(v => Math.max(1, Math.round(v)))
        .sort((a, b) => a - b);

    const unique = [...new Set(data)];
    if (!unique.length) return [];
    if (unique.length === 1) {
        return [{ min: 1, max: unique[0] }];
    }

    const k = Math.min(classCount, unique.length);
    const n = data.length;

    const lower = Array.from({ length: n + 1 }, () => Array(k + 1).fill(0));
    const variance = Array.from({ length: n + 1 }, () => Array(k + 1).fill(Infinity));

    variance[0][0] = 0;

    for (let i = 1; i <= n; i++) {
        variance[i][1] = 0;
        lower[i][1] = 1;
    }

    for (let l = 2; l <= n; l++) {
        let sum = 0;
        let sumSq = 0;
        let weight = 0;

        for (let m = 1; m <= l; m++) {
            const idx = l - m + 1;
            const val = data[idx - 1];

            weight += 1;
            sum += val;
            sumSq += val * val;

            const varianceClass = sumSq - (sum * sum) / weight;

            if (idx === 1) {
                variance[l][1] = varianceClass;
                lower[l][1] = 1;
                continue;
            }

            for (let j = 2; j <= k; j++) {
                if (idx - 1 < j - 1) continue;

                const previous = variance[idx - 1][j - 1];
                if (!Number.isFinite(previous)) continue;

                const candidate = previous + varianceClass;

                if (candidate < variance[l][j]) {
                    variance[l][j] = candidate;
                    lower[l][j] = idx;
                }
            }
        }
    }

    if (!Number.isFinite(variance[n][k])) {
        return equalIntegerRanges(data, k);
    }

    const classStarts = Array(k + 1).fill(0);
    classStarts[k] = 1;

    let count = n;

    for (let j = k; j >= 2; j--) {
        const start = lower[count][j];
        if (!start) return equalIntegerRanges(data, k);
        classStarts[j - 1] = start;
        count = start - 1;
    }

    const ranges = [];

    for (let i = 1; i <= k; i++) {
        const startIndex = i === 1 ? 0 : classStarts[i] - 1;
        const endIndex = i === k ? n - 1 : classStarts[i + 1] - 2;

        if (startIndex < 0 || endIndex < startIndex || endIndex >= n) continue;

        const min = i === 1 ? 1 : data[startIndex];
        const max = data[endIndex];

        if (min <= max) ranges.push({ min, max });
    }

    if (!ranges.length) return equalIntegerRanges(data, k);

    ranges[0].min = 1;

    for (let i = 1; i < ranges.length; i++) {
        ranges[i].min = ranges[i - 1].max + 1;
    }

    ranges[ranges.length - 1].max = data[n - 1];

    return ranges;
}

function equalIntegerRanges(data, k) {
    if (!data.length) return [];
    if (k <= 1) return [{ min: 1, max: data[data.length - 1] }];

    const ranges = [];
    for (let i = 0; i < k; i++) {
        const start = Math.floor(i * data.length / k);
        const end = Math.max(start, Math.floor((i + 1) * data.length / k) - 1);

        const min = i === 0 ? 1 : data[start];
        const max = data[Math.min(end, data.length - 1)];

        if (min <= max) ranges.push({ min, max });
    }

    for (let i = 1; i < ranges.length; i++) {
        ranges[i].min = ranges[i - 1].max + 1;
    }

    ranges[ranges.length - 1].max = data[data.length - 1];
    return ranges;
}

function calculateDamageRanges() {
    const cfg = layerConfig[currentLayer];

    if (!['DTLCP', 'CGC', 'VDNC', 'DAI'].includes(currentLayer)) {
        damageRanges = [];
        return damageRanges;
    }

    const values = getRows()
        .map(row => num(row[cfg.field]))
        .filter(v => v > 0);

    damageRanges = jenks(values, 6);
    return damageRanges;
}

function getDamageClass(value, ranges) {
    if (value <= 0 || !ranges.length) return -1;

    for (let i = 0; i < ranges.length; i++) {
        if (value >= ranges[i].min && value <= ranges[i].max) return i;
    }

    return ranges.length - 1;
}

// ------------------------------------------------------
// Màu
// ------------------------------------------------------

function getDiseaseStyle(row) {
    const cfg = layerConfig[currentLayer];
    const value = num(row?.[cfg.field]);

    if (value <= 0) {
        return {
            fillColor: cfg.colors[0],
            fillOpacity: 0.62,
            color: "#FFFFFF",
            weight: 0.85
        };
    }

    const ranges = damageRanges;
    const idx = getDamageClass(value, ranges);

    return {
        fillColor: cfg.colors[Math.min(Math.max(idx, 0), cfg.colors.length - 1)],
        fillOpacity: 0.86,
        color: "#FFFFFF",
        weight: 0.85
    };
}

function getPhunStyle(row) {
    const v = num(row?.["PHUN_Vòng"]);

    if (v <= 0) {
        return {
            fillColor: layerConfig.PHUN.colors[0],
            fillOpacity: 0.62,
            color: "#FFFFFF",
            weight: 0.85
        };
    }

    const idx = Math.min(Math.max(Math.ceil(v) - 1, 0), 5);
    return {
        fillColor: layerConfig.PHUN.colors[idx],
        fillOpacity: 0.82,
        color: "#FFFFFF",
        weight: 0.85
    };
}

function getKsgmStyle(row) {
    const count = num(row?.["KSGM_Cơ sở"]);
    const active = norm(row?.["KSGM_Trạng thái"]) === "đã triển khai";

    if (!active && count <= 0) {
        return {
            fillColor: layerConfig.KSGM.colors[0],
            fillOpacity: 0.62,
            color: "#FFFFFF",
            weight: 0.85
        };
    }

    const idx = Math.min(Math.max(Math.ceil(count) - 1, 0), 5);

    return {
        fillColor: layerConfig.KSGM.colors[idx],
        fillOpacity: 0.82,
        color: "#FFFFFF",
        weight: 0.85
    };
}

function getDrugStyle(row) {
    const count = num(row?.["CSBBTTY_Cơ sở"]);

    if (count <= 0) {
        return {
            fillColor: layerConfig.CSBBTTY.colors[0],
            fillOpacity: 0.62,
            color: "#FFFFFF",
            weight: 0.85
        };
    }

    const idx = Math.min(Math.max(Math.ceil(count) - 1, 0), 5);

    return {
        fillColor: layerConfig.CSBBTTY.colors[idx],
        fillOpacity: 0.82,
        color: "#FFFFFF",
        weight: 0.85
    };
}

function getFeatureStyle(feature) {
    const row = getRow(feature);

    if (!row) {
        return {
            fillColor: "#DCE3E8",
            fillOpacity: 0.38,
            color: "#B7C0C7",
            weight: 0.75
        };
    }

    if (["DTLCP", "CGC", "VDNC", "DAI"].includes(currentLayer)) {
        return getDiseaseStyle(row);
    }

    if (currentLayer === "PHUN") return getPhunStyle(row);
    if (currentLayer === "KSGM") return getKsgmStyle(row);
    if (currentLayer === "CSBBTTY") return getDrugStyle(row);

    return {
        fillColor: "#DCE3E8",
        fillOpacity: 0.4,
        color: "#B7C0C7",
        weight: 0.75
    };
}

// ------------------------------------------------------
// Nhãn xã - chỉ hiện khi có số liệu, tự động theo zoom
// ------------------------------------------------------

/*
 * Vị trí nhãn thủ công theo pixel.
 * Không dùng thuật toán tự ẩn nhãn: xã đã có số liệu thì luôn hiện tên.
 * Có thể tinh chỉnh từng xã mà không ảnh hưởng dữ liệu.
 */
const labelPixelOffsets = {
    "Điện Biên Phủ": [0, 15],
    "Thanh Yên": [0, 18],
    "Thanh Nưa": [0, -18],
    "Thanh Xương": [-8, 18],
    "Thanh An": [12, -12],
    "Noong Hẹt": [15, 10],
    "Noong Luống": [-12, -14],
    "Sam Mứn": [0, 18],
    "Núa Ngam": [15, -10],
    "Mường Phăng": [0, -16],
    "Mường Lạn": [15, 10],
    "Mường Ảng": [0, 18],
    "Búng Lao": [15, -10],
    "Mường Đăng": [-15, 10],
    "Mường Lói": [0, -16],
    "Nà Tấu": [12, 8],
    "Nà Nhạn": [-12, -10],
    "Nậm Nhừ": [12, -12],
    "Nậm Kè": [0, -15],
    "Nà Hỳ": [-12, 10],
    "Nà Bủng": [0, 18],
    "Sín Thầu": [0, -16],
    "Mường Nhé": [12, 10],
    "Mường Toong": [-12, -10],
    "Chà Cang": [0, 16],
    "Chà Tở": [12, -12],
    "Mường Tùng": [0, 18],
    "Mường Mươn": [-14, 10],
    "Mường Chà": [12, -12],
    "Ma Thì Hồ": [0, 16],
    "Pa Ham": [14, -10],
    "Si Pa Phìn": [0, 18],
    "Na Sang": [12, -12],
    "Nậm Nèn": [0, -16],
    "Mường Lay": [12, 10],
    "Lay Nưa": [0, -15],
    "Tủa Chùa": [12, -10],
    "Tủa Thàng": [0, 18],
    "Mường Báng": [-12, -10],
    "Sính Phình": [12, 12],
    "Sín Chải": [0, -16],
    "Xá Nhè": [12, 10],
    "Mường Đun": [0, 16],
    "Quài Tở": [12, -12],
    "Quài Nưa": [0, 16],
    "Chiềng Sinh": [0, -15]
};

function featureCenter(feature) {
    const temp = L.geoJSON(feature);
    const bounds = temp.getBounds();
    return bounds.isValid() ? bounds.getCenter() : null;
}

function labelVisibleAtZoom() {
    return map.getZoom() >= 8;
}

function renderLabels() {
    if (!map || !geojsonData) return;
    if (!labelLayer) labelLayer = L.layerGroup().addTo(map);
    labelLayer.clearLayers();
    if (!labelVisibleAtZoom()) return;

    geojsonData.features.forEach(feature => {
        if (!hasData(feature)) return;
        const name = getName(feature);
        if (!name) return;
        const center = featureCenter(feature);
        if (!center) return;

        const basePoint = map.latLngToLayerPoint(center);
        const offset = getLabelOffset(name);
        const labelPoint = L.point(basePoint.x + offset[0], basePoint.y + offset[1]);
        const latlng = map.layerPointToLatLng(labelPoint);
        const width = Math.max(42, Math.min(150, name.length * 5.7 + 8));

        const marker = L.marker(latlng, {
            interactive: false,
            keyboard: false,
            bubblingMouseEvents: false,
            zIndexOffset: 0,
            pane: "mapLabels",
            icon: L.divIcon({
                className: "map-label-wrap",
                html: `<span class="map-label">${escapeHtml(name)}</span>`,
                iconSize: [width, 18],
                iconAnchor: [width / 2, 9]
            })
        });
        labelLayer.addLayer(marker);
    });
}


function getLabelOffset(name) {
    const raw = String(name || "").trim();
    if (labelPixelOffsets[raw]) return labelPixelOffsets[raw];
    const clean = raw.replace(/^(xã|phường|thị trấn)\s+/i, "").trim();
    return labelPixelOffsets[clean] || [0, 12];
}

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ------------------------------------------------------
// Chấm đỏ: xã đang có dịch
// ------------------------------------------------------

function renderDiseaseMarkers() {
    if (!diseaseMarkerLayer) {
        diseaseMarkerLayer = L.layerGroup().addTo(map);
    }

    diseaseMarkerLayer.clearLayers();

    const cfg = layerConfig[currentLayer];

    if (!cfg.status || !geojsonData) return;

    geojsonData.features.forEach(feature => {
        const row = getRow(feature);
        if (!row || !isActive(row, cfg)) return;

        const center = featureCenter(feature);
        if (!center) return;

        L.circleMarker(center, {
            pane: "diseaseMarkers",
            radius: 4.5,
            color: "#FFFFFF",
            weight: 2.5,
            fillColor: "#E00000",
            fillOpacity: 1,
            opacity: 1,
            interactive: false
        }).addTo(diseaseMarkerLayer);
    });
}

// ------------------------------------------------------
// Panel bên phải
// ------------------------------------------------------

function statusBadge(value) {
    const text = String(value || "--").trim();
    const n = normalizeMapName(text);
    let cls = "neutral";
    if (n === "dang co dich") cls = "danger";
    else if (n === "da het dich") cls = "success";
    else if (n === "da trien khai" || n === "hoan thanh") cls = "success";
    return `<span class="info-status ${cls}">${escapeHtml(text)}</span>`;
}

function infoSection(title, rows, tone="blue") {
    return `
        <section class="info-section info-${tone}">
            <div class="info-section-title">${escapeHtml(title)}</div>
            <div class="info-table">
                ${rows.map(([label, value, type]) => `
                    <div class="info-row">
                        <span>${escapeHtml(label)}</span>
                        <b>${type === "status" ? statusBadge(value) : escapeHtml(value)}</b>
                    </div>
                `).join("")}
            </div>
        </section>
    `;
}
function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
function infoRows(items) {
    return items.map(function(item) {

        const label = item[0];
        const value = item[1];

        return `
            <div class="info-row">
                <div class="info-label">
                    ${escapeHtml(label)}
                </div>

                <div class="info-value">
                    ${escapeHtml(value ?? "--")}
                </div>
            </div>
        `;

    }).join("");
}
function hasData(feature) {

    const row = getRow(feature);

    if (!row) return false;

    const cfg = layerConfig[currentLayer];

    if (!cfg) return false;


    if (currentLayer === "PHUN") {

        return (
            num(row["PHUN_Số hộ"]) > 0 ||
            num(row["PHUN_Vòng"]) > 0 ||
            norm(row["PHUN_Tiến độ"]) !== ""
        );

    }


    if (currentLayer === "KSGM") {

        return (
            num(row["KSGM_Cơ sở"]) > 0 ||
            norm(row["KSGM_Trạng thái"]) !== ""
        );

    }


    if (currentLayer === "CSBBTTY") {

        return num(row["CSBBTTY_Cơ sở"]) > 0;

    }


    return (
        num(row[cfg.field]) > 0 ||
        num(row[cfg.outbreak]) > 0 ||
        num(row[cfg.death]) > 0 ||
        norm(row[cfg.status]) === "đang có dịch"
    );
}

function showPanel(feature, layer) {

    selectedFeature = feature;

    /* ===============================
       XÁC ĐỊNH XÃ + DỮ LIỆU
    =============================== */

    const name = getName(feature);
    const row = getRow(feature);


    /* ===============================
       HIGHLIGHT XÃ ĐƯỢC CHỌN
    =============================== */

    if (
        selectedLayer &&
        selectedLayer !== layer &&
        geojsonLayer
    ) {
        try {
            geojsonLayer.resetStyle(selectedLayer);
        } catch (_) {}
    }

    if (layer) {

        selectedLayer = layer;

        layer.setStyle({
            weight: 2.8,
            color: "#0B57D0",
            fillOpacity: 0.95
        });

        layer.bringToFront();
    }


    /* ===============================
       PANEL
    =============================== */

    const title = document.getElementById("panel-title");
    const panel = document.getElementById("info-panel");

    if (title) {
        title.textContent = name || "Xã/phường";
    }

    if (!panel) {
        console.error("Không tìm thấy #info-panel");
        return;
    }


    /* ===============================
       KHÔNG CÓ DÒNG DỮ LIỆU
    =============================== */

    if (!row) {

        panel.innerHTML = `
            <div class="empty-panel">
                <div class="empty-title">
                    ${escapeHtml(name || "Xã/phường")}
                </div>

                <p>Chưa có dữ liệu cho xã/phường này.</p>
            </div>
        `;

        return;
    }


    /* ===============================
       KIỂM TRA GIÁ TRỊ CÓ DỮ LIỆU
       0 VẪN ĐƯỢC COI LÀ CÓ DỮ LIỆU
    =============================== */

    function hasValue(value) {

        return !(
            value === null ||
            value === undefined ||
            value === "" ||
            value === "--" ||
            value === "—" ||
            value === "N/A" ||
            value === "null" ||
            value === "undefined"
        );

    }


    /* ===============================
       LỌC CÁC DÒNG CÓ DỮ LIỆU
    =============================== */

    function makeRows(items) {

        return items.filter(function(item) {
            return hasValue(item[1]);
        });

    }
function hasPanelData(type, row) {

    if (!row) return false;

    /* ===============================
       CÁC BỆNH DỊCH
    =============================== */

    if (
        type === "DTLCP" ||
        type === "CGC" ||
        type === "VDNC" ||
        type === "DAI"
    ) {

        const status = norm(row[type + "_Trạng thái"]);

        const activeStatus =
            status === "đang có dịch" ||
            status === "có dịch" ||
            status === "đang xảy ra dịch";

        if (activeStatus) return true;

        const outbreak = num(row[type + "_Ổ dịch"]);

        const death = num(
            row[
                type === "VDNC"
                    ? "VDNC_Chết"
                    : type === "DAI"
                        ? "DAI_Chết"
                        : type + "_Chết"
            ]
        );

        if (outbreak > 0 || death > 0) return true;

        if (type === "DTLCP" || type === "CGC") {

            const weight = num(row[type + "_Trọng lượng"]);

            if (weight > 0) return true;
        }

        if (type === "VDNC") {

            const sick = num(row["VDNC_Mắc"]);

            if (sick > 0) return true;
        }

        return false;
    }


    /* ===============================
       THÁNG TVSKTTĐ
    =============================== */

    if (type === "PHUN") {

        return (
            num(row["PHUN_Số hộ"]) > 0 ||
            num(row["PHUN_Vòng"]) > 0 ||
            norm(row["PHUN_Tiến độ"]) !== ""
        );
    }


    /* ===============================
       KIỂM SOÁT GIẾT MỔ
    =============================== */

    if (type === "KSGM") {

        return (
            num(row["KSGM_Cơ sở"]) > 0 ||
            (
                norm(row["KSGM_Trạng thái"]) !== "" &&
                norm(row["KSGM_Trạng thái"]) !== "không có"
            )
        );
    }


    /* ===============================
       CƠ SỞ THUỐC THÚ Y
    =============================== */

    if (type === "CSBBTTY") {

        return num(row["CSBBTTY_Cơ sở"]) > 0;
    }


    return false;
}

    /* ===============================
       THÔNG TIN CHUNG
    =============================== */

    let html = "";


    /* =====================================================
       1. DỊCH TẢ LỢN CHÂU PHI
    ===================================================== */

    const dtlcpRows = makeRows([

        [
            "Trạng thái",
            row["DTLCP_Trạng thái"]
        ],

        [
            "Ổ dịch",
            row["DTLCP_Ổ dịch"]
        ],

        [
            "Tiêu hủy",
            hasValue(row["DTLCP_Chết"])
                ? `${fmt(row["DTLCP_Chết"])} con`
                : ""
        ],

        [
            "Khối lượng",
            hasValue(row["DTLCP_Trọng lượng"])
                ? `${fmt(row["DTLCP_Trọng lượng"])} kg`
                : ""
        ],

        [
            "Ngày cuối",
            formatDate(row["DTLCP_Ngày cuối"])
        ]

    ]);


    if (hasPanelData("DTLCP", row)) {

        html += `
    <div class="info-section">

        <div class="info-section-title info-title-dtlcp">

            <span class="panel-section-icon">
                <i class="fa-solid fa-paw"></i>
            </span>

            <span>Dịch tả lợn Châu Phi</span>

        </div>

        ${infoRows(dtlcpRows)}

    </div>
`;

    /* =====================================================
       2. CÚM GIA CẦM
    ===================================================== */

    const cgcRows = makeRows([

        [
            "Trạng thái",
            row["CGC_Trạng thái"]
        ],

        [
            "Ổ dịch",
            row["CGC_Ổ dịch"]
        ],

        [
            "Tiêu hủy",
            hasValue(row["CGC_Chết"])
                ? `${fmt(row["CGC_Chết"])} con`
                : ""
        ],

        [
            "Khối lượng",
            hasValue(row["CGC_Trọng lượng"])
                ? `${fmt(row["CGC_Trọng lượng"])} kg`
                : ""
        ],

        [
            "Ngày cuối",
            formatDate(row["CGC_Ngày cuối"])
        ]

    ]);


    if (hasPanelData("CGC", row)) {

        html += `

            <div class="info-section">

<div class="info-section-title info-title-cgc">
    <span class="panel-section-icon">
        <i class="fa-solid fa-egg"></i>
    </span>
    <span>Cúm gia cầm</span>
</div>
                ${infoRows(cgcRows)}

            </div>

        `;
    }


    /* =====================================================
       3. VIÊM DA NỔI CỤC
    ===================================================== */

    const vdncRows = makeRows([

        [
            "Trạng thái",
            row["VDNC_Trạng thái"]
        ],

        [
            "Ổ dịch",
            row["VDNC_Ổ dịch"]
        ],

        [
            "Mắc",
            hasValue(row["VDNC_Mắc"])
                ? `${fmt(row["VDNC_Mắc"])} con`
                : ""
        ],

        [
            "Chết",
            hasValue(row["VDNC_Chết"])
                ? `${fmt(row["VDNC_Chết"])} con`
                : ""
        ],

        [
            "Ngày cuối",
            formatDate(row["VDNC_Ngày cuối"])
        ]

    ]);


    if (hasPanelData("VDNC", row)) {

        html += `

            <div class="info-section">

<div class="info-section-title info-title-vdnc">
    <span class="panel-section-icon">
        <i class="fa-solid fa-cow"></i>
    </span>
    <span>Viêm da nổi cục</span>
</div>

                ${infoRows(vdncRows)}

            </div>

        `;
    }


    /* =====================================================
       4. BỆNH DẠI
    ===================================================== */

    const daiRows = makeRows([

        [
            "Trạng thái",
            row["DAI_Trạng thái"]
        ],

        [
            "Ổ dịch",
            row["DAI_Ổ dịch"]
        ],

        [
            "Chết",
            hasValue(row["DAI_Chết"])
                ? `${fmt(row["DAI_Chết"])} con`
                : ""
        ],

        [
            "Tiêu hủy",
            hasValue(row["DAI_Tiêu hủy"])
                ? `${fmt(row["DAI_Tiêu hủy"])} con`
                : ""
        ],

        [
            "Ngày cuối",
            formatDate(row["DAI_Ngày cuối"])
        ]

    ]);


    if (hasPanelData("DAI", row)) {

        html += `

            <div class="info-section">

<div class="info-section-title info-title-dai">
    <span class="panel-section-icon">
        <i class="fa-solid fa-dog"></i>
    </span>
    <span>Bệnh Dại</span>
</div>

                ${infoRows(daiRows)}

            </div>

        `;
    }


    /* =====================================================
       5. THỰC HIỆN THÁNG TVSKTTĐ
    ===================================================== */

    const phunRows = makeRows([

        [
            "Tiến độ",
            row["PHUN_Tiến độ"]
        ],

        [
            "Số hộ",
            row["PHUN_Số hộ"]
        ],

        [
            "Vòng",
            row["PHUN_Vòng"]
        ],

        [
            "Diện tích",
            row["PHUN_Diện tích"]
        ],

        [
            "Ngày",
            formatDate(row["PHUN_Ngày"])
        ]

    ]);


    if (hasPanelData("PHUN", row)) {

        html += `

            <div class="info-section">

<div class="info-section-title info-title-phun">
    <span class="panel-section-icon">
        <i class="fa-solid fa-spray-can"></i>
    </span>
    <span>Thực hiện tháng TVSKTTĐ</span>
</div>
                ${infoRows(phunRows)}

            </div>

        `;
    }


    /* =====================================================
       6. KIỂM SOÁT GIẾT MỔ
    ===================================================== */

    const ksgmRows = makeRows([

        [
            "Trạng thái",
            row["KSGM_Trạng thái"]
        ],

        [
            "Số cơ sở",
            row["KSGM_Cơ sở"]
        ]

    ]);


    if (hasPanelData("KSGM", row)) {

        html += `

            <div class="info-section">

<div class="info-section-title info-title-ksgm">
    <span class="panel-section-icon">
        <i class="fa-solid fa-clipboard-check"></i>
    </span>
    <span>Kiểm soát giết mổ</span>
</div>

                ${infoRows(ksgmRows)}

            </div>

        `;
    }


    /* =====================================================
       7. CƠ SỞ BUÔN BÁN THUỐC THÚ Y
    ===================================================== */

    const csbbttyRows = makeRows([

        [
            "Số cơ sở",
            row["CSBBTTY_Cơ sở"]
        ]

    ]);


    if (hasPanelData("CSBBTTY", row)) {

        html += `
<div class="info-section">

            <div class="info-section-title info-title-drug">
    <span class="panel-section-icon">
        <i class="fa-solid fa-store"></i>
    </span>
    <span>Cơ sở buôn bán thuốc thú y</span>
</div>

            ${infoRows(csbbttyRows)}

        </div>

    `;
}


    /* ===============================
       HIỂN THỊ PANEL
    =============================== */

    panel.innerHTML = html;


    /* ===============================
       DEBUG
    =============================== */

    console.log(
        "Đã chọn xã:",
        name,
        "Dữ liệu:",
        row
    );
}

function clearPanel() {
    if (selectedLayer && geojsonLayer) {
        try { geojsonLayer.resetStyle(selectedLayer); } catch (_) {}
    }
    selectedLayer = null;
    selectedFeature = null;
    const title = document.getElementById("panel-title");
    const panel = document.getElementById("info-panel");
    if (title) title.textContent = "Chưa chọn xã/phường";
    if (panel) {
        panel.innerHTML = `
            <div class="empty-panel">
                <i class="fa-solid fa-arrow-pointer"></i>
                <p>Nhấn vào một xã/phường trên bản đồ để xem thông tin chi tiết.</p>
            </div>`;
    }
}

function formatDate(value) {
    if (!value) return "--";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString("vi-VN");
}

// ------------------------------------------------------
// Legend
// ------------------------------------------------------

function updateLegend() {
    if (legendControl) {
        map.removeControl(legendControl);
        legendControl = null;
    }

    legendControl = L.control({ position: 'bottomright' });

    legendControl.onAdd = function () {
        const div = L.DomUtil.create('div', 'legend');
        const cfg = layerConfig[currentLayer];

        // Bệnh: giữ cách chú giải cũ, chỉ thay khoảng màu bằng Jenks động.
        if (['DTLCP', 'CGC', 'VDNC', 'DAI'].includes(currentLayer)) {
            const ranges = damageRanges;

            let html = `
                <h4>${escapeHtml(cfg.name)}</h4>

                <div class="legend-dot-row">
                    <span class="legend-red-dot"></span>
                    <span>Xã đang có dịch</span>
                </div>

                <div class="legend-row">
                    <i style="background:${cfg.colors[0]}"></i>
                    <span>Xã không có dịch</span>
                </div>
            `;

            if (ranges.length) {
                html += `<hr><div class="legend-section-title">Mức độ thiệt hại</div>`;

                ranges.forEach((range, index) => {
                    const color = cfg.colors[Math.min(index, cfg.colors.length - 1)];
                    const label = range.min === range.max
                        ? `${fmt(range.min)} con`
                        : `${fmt(range.min)}–${fmt(range.max)} con`;

                    html += `
                        <div class="legend-row">
                            <i style="background:${color}"></i>
                            <span>${label}</span>
                        </div>
                    `;
                });
            } else {
                html += `<hr><div class="legend-empty">Chưa có số liệu thiệt hại</div>`;
            }

            div.innerHTML = html;
            L.DomEvent.disableClickPropagation(div);
            return div;
        }

        // Phun: giữ cách chú giải cũ, theo vòng.
        if (currentLayer === 'PHUN') {
            div.innerHTML = `
                <h4>Phun khử trùng</h4>
                <div class="legend-row"><i style="background:${cfg.colors[0]}"></i><span>Vòng 1</span></div>
                <div class="legend-row"><i style="background:${cfg.colors[1]}"></i><span>Vòng 2</span></div>
                <div class="legend-row"><i style="background:${cfg.colors[2]}"></i><span>Vòng 3</span></div>
                <div class="legend-row"><i style="background:${cfg.colors[3]}"></i><span>Vòng 4</span></div>
                <div class="legend-row"><i style="background:${cfg.colors[4]}"></i><span>Vòng 5 trở lên</span></div>
                <hr>
                <div class="legend-row"><i style="background:${cfg.colors[0]}"></i><span>Chưa triển khai / 0</span></div>
            `;
            L.DomEvent.disableClickPropagation(div);
            return div;
        }

        // KSGM và CSBBTTY: giữ cách chú giải cũ theo số cơ sở.
        if (currentLayer === 'KSGM') {
            div.innerHTML = `
                <h4>Kiểm soát giết mổ</h4>
                <div class="legend-row"><i style="background:${cfg.colors[0]}"></i><span>1 cơ sở</span></div>
                <div class="legend-row"><i style="background:${cfg.colors[1]}"></i><span>2 cơ sở</span></div>
                <div class="legend-row"><i style="background:${cfg.colors[2]}"></i><span>3 cơ sở</span></div>
                <div class="legend-row"><i style="background:${cfg.colors[3]}"></i><span>4 cơ sở</span></div>
                <div class="legend-row"><i style="background:${cfg.colors[4]}"></i><span>5 cơ sở</span></div>
                <div class="legend-row"><i style="background:${cfg.colors[5]}"></i><span>6 cơ sở trở lên</span></div>
                <hr>
                <div class="legend-row"><i style="background:${cfg.colors[0]}"></i><span>0 cơ sở / chưa triển khai</span></div>
            `;
            L.DomEvent.disableClickPropagation(div);
            return div;
        }

        div.innerHTML = `
            <h4>Cơ sở thuốc thú y</h4>
            <div class="legend-row"><i style="background:${cfg.colors[0]}"></i><span>1 cơ sở</span></div>
            <div class="legend-row"><i style="background:${cfg.colors[1]}"></i><span>2 cơ sở</span></div>
            <div class="legend-row"><i style="background:${cfg.colors[2]}"></i><span>3 cơ sở</span></div>
            <div class="legend-row"><i style="background:${cfg.colors[3]}"></i><span>4 cơ sở</span></div>
            <div class="legend-row"><i style="background:${cfg.colors[4]}"></i><span>5 cơ sở</span></div>
            <div class="legend-row"><i style="background:${cfg.colors[5]}"></i><span>6 cơ sở trở lên</span></div>
            <hr>
            <div class="legend-row"><i style="background:${cfg.colors[0]}"></i><span>0 cơ sở</span></div>
        `;

        L.DomEvent.disableClickPropagation(div);
        return div;
    };

    legendControl.addTo(map);
}

// ------------------------------------------------------
// Render
// ------------------------------------------------------

function renderGeoJSON() {
    if (!map || !geojsonData) return;

    calculateDamageRanges();

    if (geojsonLayer) {
        map.removeLayer(geojsonLayer);
        geojsonLayer = null;
    }
    selectedLayer = null;

    if (labelLayer) {
        map.removeLayer(labelLayer);
    }
    labelLayer = L.layerGroup().addTo(map);

    if (diseaseMarkerLayer) {
        map.removeLayer(diseaseMarkerLayer);
    }
    diseaseMarkerLayer = L.layerGroup().addTo(map);

    geojsonLayer = L.geoJSON(geojsonData, {
        style: getFeatureStyle,

        onEachFeature(feature, layer) {

    layer.on({

        mouseover: function () {

            if (selectedLayer !== this) {
                this.setStyle({
                    weight: 2.2,
                    color: "#243B53",
                    fillOpacity: 0.95
                });
            }

            this.bringToFront();
        },


        mouseout: function () {

            if (selectedLayer !== this && geojsonLayer) {
                try {
                    geojsonLayer.resetStyle(this);
                } catch (_) {}
            }
        },


        click: function (e) {

            /* =========================================
               CHẶN CLICK LAN RA MAP
               ========================================= */

            if (e) {
                L.DomEvent.stopPropagation(e);
                L.DomEvent.preventDefault(e);
            }


            /* =========================================
               BỎ HIGHLIGHT XÃ CŨ
               ========================================= */

            if (
                selectedLayer &&
                selectedLayer !== this &&
                geojsonLayer
            ) {
                try {
                    geojsonLayer.resetStyle(selectedLayer);
                } catch (_) {}
            }


            /* =========================================
               GHI NHẬN XÃ ĐANG CHỌN
               ========================================= */

            selectedLayer = this;


            /* =========================================
               HIGHLIGHT XÃ
               ========================================= */

            this.setStyle({

                weight: 2.8,

                color: "#0B57D0",

                fillOpacity: 0.95
            });


            /* Đưa xã lên trên */

            this.bringToFront();


            /* =========================================
               HIỂN THỊ PANEL
               ========================================= */

            if (typeof showPanel === "function") {

                showPanel(
                    feature,
                    this
                );

            } else {

                console.error(
                    "Không tìm thấy hàm showPanel()"
                );

            }


            /* =========================================
               DEBUG - KIỂM TRA CLICK
               ========================================= */

            console.log(
                "ĐÃ CLICK XÃ:",
                feature.properties
            );
        }
    });
}
    }).addTo(map);

    renderLabels();
    renderDiseaseMarkers();
    updateLegend();
    refreshMapTitle();

    if (selectedFeature) {
        const row = getRow(selectedFeature);
        const freshLayer = findLayer(selectedFeature);
        if (row) {
            selectedLayer = freshLayer;
            showPanel(selectedFeature, freshLayer);
        }
    }
}

function refreshMap() {
    if (!map || !geojsonData) return;
    renderGeoJSON();
}

// ------------------------------------------------------
// Load GeoJSON
// ------------------------------------------------------

async function loadGeoJSON() {
    const urls = [
        "data/dienbien_xa.geojson",
        "https://ngthuyduongb95-arch.github.io/ban-do-dien-bien/data/dienbien_xa.geojson"
    ];

    let response = null;
    let lastError = null;

    for (const url of urls) {
        try {
            const res = await fetch(url, { cache: "no-store" });
            if (res.ok) {
                response = res;
                break;
            }
            lastError = new Error("HTTP " + res.status + " - " + url);
        } catch (err) {
            lastError = err;
        }
    }

    if (!response) {
        throw new Error("Không đọc được GeoJSON. " + (lastError?.message || ""));
    }

    const data = await response.json();
    if (!data || data.type !== "FeatureCollection") {
        throw new Error("GeoJSON phải là FeatureCollection.");
    }

    geojsonData = data;
    const matchedFeatures = data.features.filter(f => !!getRow(f));
    const matched = matchedFeatures.length;
    const unmatched = data.features.filter(f => !getRow(f)).map(getName).filter(Boolean);
    console.log(`MAP: Ghép dữ liệu ${matched}/${data.features.length} xã/phường`);
    if (unmatched.length) console.warn("MAP: Chưa ghép được:", unmatched);
    if (matched === 0) {
        console.error("MAP: 0 xã/phường được ghép dữ liệu. Kiểm tra ID hoặc tên xã trong Google Sheets/GeoJSON.");
    }
    renderGeoJSON();

    const bounds = L.geoJSON(data).getBounds();
    if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [28, 28] });
    }
}

// ------------------------------------------------------
// Lớp nền
// ------------------------------------------------------

function setBasemap(mode) {
    if (!map) return;

    if (mode === "satellite") {
        if (map.hasLayer(streetLayer)) map.removeLayer(streetLayer);
        if (!map.hasLayer(satelliteLayer)) map.addLayer(satelliteLayer);
        currentBasemap = "satellite";
    } else {
        if (map.hasLayer(satelliteLayer)) map.removeLayer(satelliteLayer);
        if (!map.hasLayer(streetLayer)) map.addLayer(streetLayer);
        currentBasemap = "street";
    }

    document.getElementById("btnStreet")?.classList.toggle("active", mode === "street");
    document.getElementById("btnSatellite")?.classList.toggle("active", mode === "satellite");
}

// ------------------------------------------------------
// Điều khiển
// ------------------------------------------------------

function bindControls() {
    document.getElementById("layerSelect")?.addEventListener("change", e => {
        setLayer(e.target.value);
    });

    document.getElementById("btnStreet")?.addEventListener("click", () => {
        setBasemap("street");
    });

    document.getElementById("btnSatellite")?.addEventListener("click", () => {
        setBasemap("satellite");
    });

    document.getElementById("btnFullscreen")?.addEventListener("click", toggleFullscreen);

    document.getElementById("btnExport")?.addEventListener("click", exportMapImage);

    document.getElementById("btnRefresh")?.addEventListener("click", reloadData);

    document.getElementById("btnLocate")?.addEventListener("click", locateUser);

    document.getElementById("btnSearch")?.addEventListener("click", () => {
        searchFeature(document.getElementById("txtSearch")?.value || "");
    });

    document.getElementById("txtSearch")?.addEventListener("keydown", e => {
        if (e.key === "Enter") {
            searchFeature(e.target.value);
        }
    });

    map.on("zoomend moveend", () => {
        renderLabels();
    });
}

function setLayer(layerName) {
    if (!layerConfig[layerName]) return;

    currentLayer = layerName;

    const select = document.getElementById("layerSelect");
    if (select) select.value = layerName;

    clearPanel();
    refreshMap();
}

function searchFeature(keyword) {
    const text = norm(keyword);
    if (!text || !geojsonData) return;

    const feature = geojsonData.features.find(f =>
        norm(getName(f)).includes(text)
    );

    if (!feature) {
        alert("Không tìm thấy xã/phường: " + keyword);
        return;
    }

    const layer = findLayer(feature);

    if (layer) {
        if (selectedLayer && selectedLayer !== layer && geojsonLayer) {
            try { geojsonLayer.resetStyle(selectedLayer); } catch (_) {}
        }
        selectedLayer = layer;
        layer.setStyle({ weight: 2.8, color: "#0B57D0", fillOpacity: 0.95 });
        layer.bringToFront();
        map.fitBounds(layer.getBounds(), {
            padding: [40, 40],
            maxZoom: 13
        });
    }

    showPanel(feature, layer);
}

function findLayer(feature) {
    let found = null;

    if (geojsonLayer) {
        geojsonLayer.eachLayer(layer => {
            if (layer.feature === feature) found = layer;
        });
    }

    return found;
}

function locateUser() {
    if (!navigator.geolocation) {
        alert("Trình duyệt không hỗ trợ định vị.");
        return;
    }

    navigator.geolocation.getCurrentPosition(
        position => {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;

            map.setView([lat, lng], 13);

            L.circleMarker([lat, lng], {
                radius: 6,
                color: "#FFFFFF",
                weight: 2,
                fillColor: "#1976D2",
                fillOpacity: 1
            }).addTo(map).bindPopup("Vị trí hiện tại").openPopup();
        },
        () => alert("Không thể lấy vị trí hiện tại.")
    );
}

function toggleFullscreen() {
    const container = document.querySelector(".main-map");

    if (!document.fullscreenElement) {
        container?.requestFullscreen?.();
    } else {
        document.exitFullscreen?.();
    }

    setTimeout(() => map.invalidateSize(), 300);
}

// ------------------------------------------------------
// Xuất ảnh: chụp nguyên khung bản đồ, gồm Legend + tiêu đề + tỷ lệ
// ------------------------------------------------------

async function exportMapImage() {
    const mapElement = document.getElementById("map");
    if (!mapElement || typeof html2canvas !== "function") {
        alert("Chưa sẵn sàng công cụ xuất ảnh.");
        return;
    }

    const button = document.getElementById("btnExport");
    if (button) button.classList.add("loading");

    try {
        // Chỉ ẩn cụm zoom khi xuất; giữ nguyên Legend + tiêu đề + tỷ lệ.
        const controls = mapElement.querySelectorAll(".leaflet-control-zoom");
        controls.forEach(el => el.classList.add("export-hide"));

        const canvas = await html2canvas(mapElement, {
            useCORS: true,
            allowTaint: false,
            backgroundColor: "#F7F9FB",
            scale: 2,
            logging: false,
            imageTimeout: 15000
        });

        controls.forEach(el => el.classList.remove("export-hide"));

        const link = document.createElement("a");
        const date = new Date().toISOString().slice(0, 10);

        link.download =
            `WEBGIS_DienBien_${currentLayer}_${date}.png`;

        link.href = canvas.toDataURL("image/png");
        link.click();

    } catch (err) {
        console.error("Lỗi xuất ảnh:", err);
        alert(
            "Không xuất được ảnh. Nếu bản đồ vệ tinh bị chặn CORS, hãy chuyển sang Bản đồ đường phố rồi xuất lại."
        );
    } finally {
        mapElement
            .querySelectorAll(".export-hide")
            .forEach(el => el.classList.remove("export-hide"));

        if (button) button.classList.remove("loading");
    }
}

// ------------------------------------------------------
// Làm mới dữ liệu
// ------------------------------------------------------

async function reloadData() {
    try {
        if (typeof window.loadSheet === "function") {
            await window.loadSheet();
        }

        if (!geojsonData) {
            await loadGeoJSON();
        } else {
            refreshMap();
        }

        if (typeof window.updateDashboard === "function") {
            window.updateDashboard();
        }

    } catch (err) {
        console.error("Lỗi cập nhật dữ liệu:", err);
    }
}

// ------------------------------------------------------
// API khởi tạo - app.js gọi các hàm này theo đúng thứ tự:
// loadSheet -> loadGeoJSON -> dashboard.update
// ------------------------------------------------------

window.initMap = initMap;
window.loadGeoJSON = loadGeoJSON;
window.setLayer = setLayer;
window.reloadData = reloadData;
window.searchFeature = searchFeature;
window.exportCurrentMap = exportMapImage;
