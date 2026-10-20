
// ======================================================
// DASHBOARD.JS
// Tổng quan và xem trước, tải bảng số liệu theo từng KPI
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
                ? parts[0] + "." + parts[1] : s.replace(/,/g, "");
        } else if ((s.match(/\./g) || []).length > 1) {
            s = s.replace(/\./g, "");
        }
        const n = Number(s);
        return Number.isFinite(n) ? n : 0;
    }

    function fmt(value) {
        return numberValue(value).toLocaleString("vi-VN", { maximumFractionDigits: 2 });
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
        return status === "đang có dịch" ||
            status === "đã hết dịch" ||
            numberValue(row[outbreakField]) > 0 ||
            numberValue(row[valueField]) > 0 ||
            numberValue(row[deathField]) > 0;
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

    // ======================================================
    // BIỂU ĐỒ DASHBOARD
    // ======================================================
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
            row["Tên xã/phường"] || row["Tên xã"] || row["Xã"] ||
            row["Xa"] || row["TEN_XA"] || row["TENXA"] || "Chưa xác định";

        const labels = rows.map(getCommuneName);
        const communeDatasets = diseases.map(disease => ({
            label: disease.label,
            data: rows.map(row => numberValue(row[disease.field])),
            borderWidth: 1
        }));

        if (dashboardCharts.xa) dashboardCharts.xa.destroy();
        if (typeof window.Chart.getChart === "function") {
            const old = window.Chart.getChart(canvasXa);
            if (old) old.destroy();
        }

        dashboardCharts.xa = new window.Chart(canvasXa, {
            type: "bar",
            data: { labels, datasets: communeDatasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { position: "bottom" } },
                scales: {
                    x: {
                        stacked: true,
                        ticks: { autoSkip: true, maxRotation: 60, minRotation: 0 }
                    },
                    y: {
                        stacked: true,
                        beginAtZero: true,
                        title: { display: true, text: "Số con chết ghi nhận" }
                    }
                }
            }
        });

        const totals = diseases.map(disease =>
            rows.reduce((sum, row) => sum + numberValue(row[disease.field]), 0)
        );

        if (dashboardCharts.benh) dashboardCharts.benh.destroy();
        if (typeof window.Chart.getChart === "function") {
            const old = window.Chart.getChart(canvasBenh);
            if (old) old.destroy();
        }

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
                plugins: { legend: { display: false } },
                scales: {
                    x: {
                        beginAtZero: true,
                        title: { display: true, text: "Số con chết ghi nhận" }
                    }
                }
            }
        });
    }

    // ======================================================
    // CẤU HÌNH DỮ LIỆU CHO TỪNG KPI
    // ======================================================
    const KPI_EXPORTS = {
        "card-dtlcp": {
            name: "Du_lieu_DTLCP",
            title: "Dịch tả lợn châu Phi",
            fields: [
                ["ID", "ID"], ["Tên xã/phường", "Tên xã"],
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
                ["ID", "ID"], ["Tên xã/phường", "Tên xã"],
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
                ["ID", "ID"], ["Tên xã/phường", "Tên xã"],
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
                ["ID", "ID"], ["Tên xã/phường", "Tên xã"],
                ["Trạng thái dịch", "DAI_Trạng thái"],
                ["Số ổ dịch", "DAI_Ổ dịch"],
                ["Số con mắc", "DAI_Mắc"],
                ["Số con chết", "DAI_Chết"],
                ["Số con tiêu hủy", "DAI_Tiêu hủy"],
                ["Ngày cuối ghi nhận", "DAI_Ngày cuối"],
                ["Số ngày", "DAI_Số ngày"]
            ],
            include: row => hasHistory(
                row, "DAI_Trạng thái", "DAI_Ổ dịch",
                "DAI_Chết", "DAI_Tiêu hủy"
            ) || numberValue(row["DAI_Mắc"]) > 0
        },
        "card-phun": {
            name: "Du_lieu_Phun_phong",
            title: "Thực hiện tháng tiêu độc, khử trùng",
            fields: [
                ["ID", "ID"], ["Tên xã/phường", "Tên xã"],
                ["Tiến độ", "PHUN_Tiến độ"], ["Số vòng", "PHUN_Vòng"],
                ["Số hộ", "PHUN_Số hộ"], ["Diện tích", "PHUN_Diện tích"],
                ["Hóa chất", "PHUN_Hóa chất"], ["Ngày thực hiện", "PHUN_Ngày"]
            ],
            include: row => numberValue(row["PHUN_Số hộ"]) > 0 ||
                numberValue(row["PHUN_Vòng"]) > 0 ||
                norm(row["PHUN_Tiến độ"]) !== ""
        },
        "card-ksgm": {
            name: "Du_lieu_KSGM",
            title: "Kiểm soát giết mổ",
            fields: [
                ["ID", "ID"], ["Tên xã/phường", "Tên xã"],
                ["Trạng thái triển khai", "KSGM_Trạng thái"],
                ["Số cơ sở", "KSGM_Cơ sở"]
            ],
            include: row => norm(row["KSGM_Trạng thái"]) !== "" ||
                numberValue(row["KSGM_Cơ sở"]) > 0
        },
        "card-drug": {
            name: "Du_lieu_Co_so_Thuoc_Thu_Y",
            title: "Cơ sở thuốc thú y",
            fields: [
                ["ID", "ID"], ["Tên xã/phường", "Tên xã"],
                ["Số cơ sở", "CSBBTTY_Cơ sở"]
            ],
            include: row => numberValue(row["CSBBTTY_Cơ sở"]) > 0
        }
    };
