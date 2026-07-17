const API_URL = "https://script.google.com/macros/s/AKfycbxvF3U6jCOPVrV-9iSivSiX4ynVeusbjSF4nJmCrMuSok_dEaKSvGi-CRSXCPlrQ43d/exec";

let gisData = {};

async function loadGISData() {

    const response = await fetch(API_URL);

    const data = await response.json();

    gisData = {};

    data.forEach(item => {

        gisData[item["ID"]] = item;

    });

    console.log("Đã tải", Object.keys(gisData).length, "xã");

}
