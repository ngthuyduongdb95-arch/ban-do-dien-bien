
// ======================================================
// DASHBOARD.JS
// Tổng quan và tải bảng số liệu theo từng KPI
// ======================================================

(function () {
    "use strict";

    function numberValue(value) {
        if (value === null || value === undefined || value === "") return 0;
        if (typeof value === "number") return Number.isFinite(value) ? value : 0;

        let s = String(value).trim().replace(/[^\d,.-]/g, "");
        if (!s) return 0;

        if (s.includes(".") && s.includes(",")) {
            s = s.replace(/\./g, "").replace(",", ".");
        } else if (s.includes(",")) {
            const parts = s.split(",");
            s = parts.length === 2 && parts[1].length <= 2
                ? parts[0] + "." + parts[1]
                : s.replace(/,/g, "");
        } else if ((s.match(/\./g) || []).length > 1) {
            s = s.replace(/\./g, "");
        }

        const n = Number(s);
        return Number.isFinite(n) ? n : 0;
    }

    function fmt(value) {
        return numberValue(value).toLocaleString("vi-VN", {
            maximumFractionDigits: 2
        });
    }

    function norm(value) {
        return String(value ?? "").trim().toLowerCase();
    }

    function isActive(row, field) {
        return norm(row[field]) === "đang có dịch";
    }

    function hasHistory(row, statusField, outbreakField, valueField, deathField) {
        if (!row) return false;

        const status = norm(row[statusField]);
        const outbreak = numberValue(row[outbreakField]);
        const value = numberValue(row[valueField]);
        const death = numberValue(row[deathField]);

        return (
            status === "đang có dịch" ||
            status === "đã hết dịch" ||
            outbreak > 0 ||
            value > 0 ||
            death > 0
        );
    }

    function getRows() {
        if (typeof window.getRows === "function") {
            try {
                const rows = window.getRows();
                if (Array.isArray(rows)) return rows;
            } catch (_) {}
        }

        if (typeof window.sheetData !== "undefined" && window.sheetData) {
            return Object.values(window.sheetData);
        }

        return [];
    }

    function setText(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    }

    // ================= BIỂU ĐỒ DASHBOARD =================
    const dashboardCharts = {};

    function renderDashboardCharts(rows) {
        if (typeof window.Chart === "undefined") return;

        const canvasXa = document.getElementById("chartDamageXa");
        const canvasBenh = document.getElementById("chartSpecies");

        if (!canvasXa || !canvasBenh || !Array.isArray(rows)) return;

        const diseases = [
            { label: "DTLCP", field: "DTLCP_Chết" },
            { label: "Cúm gia cầm", field: "CGC_Chết" },
            { label: "VDNC", field: "VDNC_Chết" },
            { label: "Dại", field: "DAI_Chết" }
        ];

        const getCommuneName = row =>
            row["Tên xã/phường"] ||
            row["Tên xã"] ||
            row["Xã"] ||
            row["Xa"] ||
            row["TEN_XA"] ||
            row["TENXA"] ||
            "Chưa xác định";

        const labels = rows.map(getCommuneName);

        const communeDatasets = diseases.map(disease => ({
            label: disease.label,
            data: rows.map(row => numberValue(row[disease.field])),
            borderWidth: 1
        }));

        if (dashboardCharts.xa) dashboardCharts.xa.destroy();

        const oldChartXa = window.Chart.getChart(canvasXa);
        if (oldChartXa) oldChartXa.destroy();

        dashboardCharts.xa = new window.Chart(canvasXa, {
            type: "bar",
            data: {
                labels,
                datasets: communeDatasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: "bottom" }
                },
                scales: {
                    x: {
                        stacked: true,
                        ticks: {
                            autoSkip: true,
                            maxRotation: 60,
                            minRotation: 0
                        }
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: "Số con chết ghi nhận"
                        }
                    }
                }
            }
        });

        const totals = diseases.map(disease =>
            rows.reduce(
                (sum, row) => sum + numberValue(row[disease.field]),
                0
            )
        );

        if (dashboardCharts.benh) dashboardCharts.benh.destroy();

        const oldChartBenh = window.Chart.getChart(canvasBenh);
        if (oldChartBenh) oldChartBenh.destroy();

        dashboardCharts.benh = new window.Chart(canvasBenh, {
            type: "bar",
            data: {
                labels: diseases.map(disease => disease.label),
                datasets: [{
                    label: "Số con chết ghi nhận",
                    data: totals,
                    borderWidth: 1
                }]
            },
            options: {
                indexAxis: "y",
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false }
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: "Số con chết ghi nhận"
                        }
                    }
                }
            }
        });
    }

    // ================= XUẤT BẢNG SỐ LIỆU THEO KPI =================
    const KPI_EXPORTS = {
        "card-dtlcp": {
            name: "Du_lieu_DTLCP",
            title: "Dịch tả lợn châu Phi",
            fields: [
                ["ID", "ID"],
                ["Tên xã/phường", "Tên xã"],
                ["Trạng thái dịch", "DTLCP_Trạng thái"],
                ["Số ổ dịch", "DTLCP_Ổ dịch"],
                ["Số con tiêu hủy", "DTLCP_Chết"],
                ["Khối lượng (kg)", "DTLCP_Trọng lượng"],
                ["Ngày cuối ghi nhận", "DTLCP_Ngày cuối"],
                ["Số ngày", "DTLCP_Số ngày"]
            ],
            include: row => hasHistory(
                row, "DTLCP_Trạng thái", "DTLCP_Ổ dịch", "DTLCP_Chết"
            )
        },

        "card-cgc": {
            name: "Du_lieu_CGC",
            title: "Cúm gia cầm",
            fields: [
                ["ID", "ID"],
                ["Tên xã/phường", "Tên xã"],
                ["Trạng thái dịch", "CGC_Trạng thái"],
                ["Số ổ dịch", "CGC_Ổ dịch"],
                ["Số con tiêu hủy", "CGC_Chết"],
                ["Khối lượng (kg)", "CGC_Trọng lượng"],
                ["Ngày cuối ghi nhận", "CGC_Ngày cuối"],
                ["Số ngày", "CGC_Số ngày"]
            ],
            include: row => hasHistory(
                row, "CGC_Trạng thái", "CGC_Ổ dịch", "CGC_Chết"
            )
        },

        "card-vdnc": {
            name: "Du_lieu_VDNC",
            title: "Viêm da nổi cục",
            fields: [
                ["ID", "ID"],
                ["Tên xã/phường", "Tên xã"],
                ["Trạng thái dịch", "VDNC_Trạng thái"],
                ["Số ổ dịch", "VDNC_Ổ dịch"],
                ["Số con mắc", "VDNC_Mắc"],
                ["Số con chết", "VDNC_Chết"],
                ["Khối lượng (kg)", "VDNC_Trọng lượng"],
                ["Ngày cuối ghi nhận", "VDNC_Ngày cuối"],
                ["Số ngày", "VDNC_Số ngày"]
            ],
            include: row => hasHistory(
                row, "VDNC_Trạng thái", "VDNC_Ổ dịch",
                "VDNC_Mắc", "VDNC_Chết"
            )
        },

        "card-dai": {
            name: "Du_lieu_Benh_Dai",
            title: "Bệnh dại",
            fields: [
                ["ID", "ID"],
                ["Tên xã/phường", "Tên xã"],
                ["Trạng thái dịch", "DAI_Trạng thái"],
                ["Số ổ dịch", "DAI_Ổ dịch"],
                ["Số con mắc", "DAI_Mắc"],
                ["Số con chết", "DAI_Chết"],
                ["Số con tiêu hủy", "DAI_Tiêu hủy"],
                ["Ngày cuối ghi nhận", "DAI_Ngày cuối"],
                ["Số ngày", "DAI_Số ngày"]
            ],
            include: row =>
                hasHistory(
                    row, "DAI_Trạng thái", "DAI_Ổ dịch",
                    "DAI_Chết", "DAI_Tiêu hủy"
                ) || numberValue(row["DAI_Mắc"]) > 0
        },

        "card-phun": {
            name: "Du_lieu_Phun_phong",
            title: "Thực hiện tháng tiêu độc, khử trùng",
            fields: [
                ["ID", "ID"],
                ["Tên xã/phường", "Tên xã"],
                ["Tiến độ", "PHUN_Tiến độ"],
                ["Số vòng", "PHUN_Vòng"],
                ["Số hộ", "PHUN_Số hộ"],
                ["Diện tích", "PHUN_Diện tích"],
                ["Hóa chất", "PHUN_Hóa chất"],
                ["Ngày thực hiện", "PHUN_Ngày"]
            ],
            include: row =>
                numberValue(row["PHUN_Số hộ"]) > 0 ||
                numberValue(row["PHUN_Vòng"]) > 0 ||
                norm(row["PHUN_Tiến độ"]) !== ""
        },

        "card-ksgm": {
            name: "Du_lieu_KSGM",
            title: "Kiểm soát giết mổ",
            fields: [
                ["ID", "ID"],
                ["Tên xã/phường", "Tên xã"],
                ["Trạng thái triển khai", "KSGM_Trạng thái"],
                ["Số cơ sở", "KSGM_Cơ sở"]
            ],
            include: row =>
                norm(row["KSGM_Trạng thái"]) !== "" ||
                numberValue(row["KSGM_Cơ sở"]) > 0
        },

        "card-drug": {
            name: "Du_lieu_Co_so_Thuoc_Thu_Y",
            title: "Cơ sở thuốc thú y",
            fields: [
                ["ID", "ID"],
                ["Tên xã/phường", "Tên xã"],
                ["Số cơ sở", "CSBBTTY_Cơ sở"]
            ],
            include: row => numberValue(row["CSBBTTY_Cơ sở"]) > 0
        }
    };

    function installKpiDownloadButtons() {
        if (document.getElementById("kpi-download-style")) return;

        const style = document.createElement("style");
        style.id = "kpi-download-style";
        style.textContent = `
            .kpi-download-btn {
                display:flex;
                align-items:center;
                justify-content:center;
                gap:6px;
                width:100%;
                margin-top:8px;
                padding:6px 8px;
                border:1px solid #d7e0e7;
                border-radius:7px;
                background:#f8fafc;
                color:#334b5d;
                font-size:10px;
                line-height:14px;
                font-weight:700;
                cursor:pointer;
            }
            .kpi-download-btn:hover {
                background:#eaf3f8;
                border-color:#9db8c8;
            }
            .kpi-download-btn:disabled {
                opacity:.55;
                cursor:wait;
            }
        `;
        document.head.appendChild(style);

        Object.keys(KPI_EXPORTS).forEach(className => {
            const card = document.querySelector(".summary-card." + className);
            if (!card || card.querySelector(".kpi-download-btn")) return;

            const cfg = KPI_EXPORTS[className];
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "kpi-download-btn";
            btn.innerHTML =
                '<i class="fa-solid fa-file-arrow-down" aria-hidden="true"></i>' +
                '<span>Tải bảng số liệu</span>';

            btn.title = "Tải bảng số liệu của " + cfg.title +
                " (tệp CSV mở được bằng Excel)";

            btn.addEventListener("click", () => downloadKpiCsv(cfg));
            card.appendChild(btn);
        });
    }

    function csvCell(value) {
        let s = value === null || value === undefined ? "" : String(value);

        // Hạn chế nội dung bị bảng tính hiểu nhầm là công thức.
        if (/^[=+@]/.test(s) || /^-[^0-9]/.test(s)) s = "'" + s;

        return '"' + s.replace(/"/g, '""') + '"';
    }

    function downloadKpiCsv(cfg) {
        const rows = getRows();

        if (!rows.length) {
            alert("Chưa tải được dữ liệu Google Sheets. Vui lòng tải lại trang rồi thử lại.");
            return;
        }

        const filtered = rows.filter(row => cfg.include(row));

        if (!filtered.length) {
            alert("Chưa có dữ liệu để xuất cho KPI " + cfg.title + ".");
            return;
        }

        const headers = cfg.fields.map(field => field[0]);
        const lines = [headers.map(csvCell).join(";")];

        filtered.forEach(row => {
            const values = cfg.fields.map(field => {
                if (field[1] === "Tên xã") {
                    return row["Tên xã"] ||
                        row["Tên xã/phường"] ||
                        row["Xã"] ||
                        row["TEN_XA"] ||
                        "";
                }
                return row[field[1]];
            });

            lines.push(values.map(csvCell).join(";"));
        });

        // BOM UTF-8 giúp Excel hiển thị đúng tiếng Việt.
        const blob = new Blob(
            ["\uFEFF" + lines.join("\r\n")],
            { type: "text/csv;charset=utf-8;" }
        );

        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        const date = new Date();
        const stamp =
            date.getFullYear() +
            String(date.getMonth() + 1).padStart(2, "0") +
            String(date.getDate()).padStart(2, "0");

        link.href = url;
        link.download = cfg.name + "_" + stamp + ".csv";
        document.body.appendChild(link);
        link.click();
        link.remove();

        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }

    // ================= CẬP NHẬT DASHBOARD =================
    const dashboard = {
        update() {
            installKpiDownloadButtons();

            const rows = getRows();
            if (!rows.length) return;

            const stat = {
                dtlcpXa: 0, dtlcpDang: 0, dtlcpCon: 0, dtlcpKg: 0,
                cgcXa: 0, cgcDang: 0, cgcCon: 0, cgcKg: 0,
                vdncXa: 0, vdncDang: 0, vdncMac: 0, vdncChet: 0,
                daiXa: 0, daiDang: 0, daiChet: 0, daiTieuHuy: 0,
                phunXa: 0, phunHo: 0, phunVong: 0,
                ksgmXa: 0, ksgmCoSo: 0,
                csbbtty: 0
            };

            rows.forEach(row => {
                // DỊCH TẢ LỢN CHÂU PHI
                if (hasHistory(
                    row, "DTLCP_Trạng thái", "DTLCP_Ổ dịch", "DTLCP_Chết"
                )) stat.dtlcpXa++;

                if (isActive(row, "DTLCP_Trạng thái")) stat.dtlcpDang++;
                stat.dtlcpCon += numberValue(row["DTLCP_Chết"]);
                stat.dtlcpKg += numberValue(row["DTLCP_Trọng lượng"]);

                // CÚM GIA CẦM
                if (hasHistory(
                    row, "CGC_Trạng thái", "CGC_Ổ dịch", "CGC_Chết"
                )) stat.cgcXa++;

                if (isActive(row, "CGC_Trạng thái")) stat.cgcDang++;
                stat.cgcCon += numberValue(row["CGC_Chết"]);
                stat.cgcKg += numberValue(row["CGC_Trọng lượng"]);

                // VIÊM DA NỔI CỤC
                if (hasHistory(
                    row, "VDNC_Trạng thái", "VDNC_Ổ dịch",
                    "VDNC_Mắc", "VDNC_Chết"
                )) stat.vdncXa++;

                if (isActive(row, "VDNC_Trạng thái")) stat.vdncDang++;
                stat.vdncMac += numberValue(row["VDNC_Mắc"]);
                stat.vdncChet += numberValue(row["VDNC_Chết"]);

                // BỆNH DẠI
                if (hasHistory(
                    row, "DAI_Trạng thái", "DAI_Ổ dịch",
                    "DAI_Chết", "DAI_Tiêu hủy"
                )) stat.daiXa++;

                if (isActive(row, "DAI_Trạng thái")) stat.daiDang++;
                stat.daiChet += numberValue(row["DAI_Chết"]);
                stat.daiTieuHuy += numberValue(row["DAI_Tiêu hủy"]);

                // PHUN PHÒNG
                const phunHo = numberValue(row["PHUN_Số hộ"]);
                const phunVong = numberValue(row["PHUN_Vòng"]);

                if (
                    phunHo > 0 ||
                    phunVong > 0 ||
                    norm(row["PHUN_Tiến độ"]) !== ""
                ) stat.phunXa++;

                stat.phunHo += phunHo;
                stat.phunVong += phunVong;

                // KIỂM SOÁT GIẾT MỔ
                const ksgmCoSo = numberValue(row["KSGM_Cơ sở"]);

                if (norm(row["KSGM_Trạng thái"]) === "đã triển khai") {
                    stat.ksgmXa++;
                } else if (ksgmCoSo > 0) {
                    stat.ksgmXa++;
                }

                stat.ksgmCoSo += ksgmCoSo;

                // CƠ SỞ THUỐC THÚ Y
                stat.csbbtty += numberValue(row["CSBBTTY_Cơ sở"]);
            });

            setText("dbDTLCPXa", fmt(stat.dtlcpXa));
            setText("dbDTLCPDang", fmt(stat.dtlcpDang));
            setText("dbDTLCPCon", fmt(stat.dtlcpCon));
            setText("dbDTLCPKg", fmt(stat.dtlcpKg));

            setText("dbCGCXa", fmt(stat.cgcXa));
            setText("dbCGCDang", fmt(stat.cgcDang));
            setText("dbCGCCon", fmt(stat.cgcCon));
            setText("dbCGCKg", fmt(stat.cgcKg));

            setText("dbVDNCXa", fmt(stat.vdncXa));
            setText("dbVDNCDang", fmt(stat.vdncDang));
            setText("dbVDNCMac", fmt(stat.vdncMac));
            setText("dbVDNChet", fmt(stat.vdncChet));

            setText("dbDAIXa", fmt(stat.daiXa));
            setText("dbDAIDang", fmt(stat.daiDang));
            setText("dbDAIChet", fmt(stat.daiChet));
            setText("dbDAITieuHuy", fmt(stat.daiTieuHuy));

            setText("dbPhunXa", fmt(stat.phunXa));
            setText("dbPhunHo", fmt(stat.phunHo));
            setText("dbPhunVong", fmt(stat.phunVong));

            setText("dbKSGMXa", fmt(stat.ksgmXa));
            setText("dbKSGMCoSo", fmt(stat.ksgmCoSo));

            setText("dbCSBBTTY", fmt(stat.csbbtty));

            // Tổng quan ở sidebar
            setText("sideOverviewXa", rows.length);
            setText(
                "sideOverviewDang",
                stat.dtlcpDang + stat.cgcDang + stat.vdncDang + stat.daiDang
            );
            setText(
                "sideOverviewCon",
                stat.dtlcpCon + stat.cgcCon + stat.vdncMac + stat.daiChet
            );
            setText(
                "sideOverviewKg",
                stat.dtlcpKg + stat.cgcKg
            );
        }
    };

    window.dashboard = dashboard;

    window.updateDashboard = function () {
        dashboard.update();
    };
})();
