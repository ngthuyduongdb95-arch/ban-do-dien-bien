//======================================================
// APP.JS
// WEBGIS ĐIỆN BIÊN
//======================================================

document.addEventListener("DOMContentLoaded", async () => {

    console.log("WEBGIS APP: Khởi tạo...");


    //==================================================
    // 1. LOAD DỮ LIỆU GOOGLE SHEETS
    //==================================================

    try {

        await loadSheet();

        console.log(
            "Google Sheets: Đã tải",
            getRows().length,
            "xã/phường"
        );

    }
    catch(err){

        console.error(
            "Lỗi tải Google Sheets:",
            err
        );

    }


    //==================================================
    // 2. LOAD BẢN ĐỒ
    //==================================================

    try {

        await loadGeoJSON();

        console.log(
            "GeoJSON: Đã tải"
        );

    }
    catch(err){

        console.error(
            "Lỗi tải GeoJSON:",
            err
        );

    }


    //==================================================
    // 3. DASHBOARD
    //==================================================

    if(typeof dashboard !== "undefined"){

        dashboard.update();

    }


    //==================================================
    // 4. THANH CÔNG CỤ BẢN ĐỒ
    //==================================================

    if(typeof addMapTools === "function"){

        addMapTools();

    }


    //==================================================
    // 5. ĐỔI LỚP DỮ LIỆU
    //==================================================

    const layerSelect =
        document.getElementById("layerSelect");

    if(layerSelect){

        layerSelect.addEventListener(
            "change",
            function(){

                setLayer(this.value);

            }
        );

    }


    //==================================================
    // 6. TÌM XÃ
    //==================================================

    const searchInput =
        document.getElementById("txtSearch");

    const searchButton =
        document.getElementById("btnSearch");


    if(searchButton){

        searchButton.addEventListener(
            "click",
            function(){

                searchFeature(
                    searchInput
                        ? searchInput.value
                        : ""
                );

            }
        );

    }


    if(searchInput){

        searchInput.addEventListener(
            "keypress",
            function(e){

                if(e.key === "Enter"){

                    searchFeature(
                        this.value
                    );

                }

            }
        );

    }


    //==================================================
    // 7. LÀM MỚI DỮ LIỆU
    //==================================================

    const refreshButton =
        document.getElementById("btnRefresh");

    if(refreshButton){

        refreshButton.addEventListener(
            "click",
            async function(){

                this.disabled = true;

                try{

                    await reloadData();

                }
                finally{

                    this.disabled = false;

                }

            }
        );

    }


    //==================================================
    // 8. NÚT LÀM MỚI TỔNG QUAN
    //==================================================

    const overviewRefresh =
        document.getElementById(
            "btnOverviewRefresh"
        );

    if(overviewRefresh){

        overviewRefresh.addEventListener(
            "click",
            async function(){

                this.disabled = true;

                try{

                    await reloadData();

                }
                finally{

                    this.disabled = false;

                }

            }
        );

    }


    //==================================================
    // 9. TẢI BẢN ĐỒ
    //==================================================

    const exportButton =
        document.getElementById("btnExportMap");

    if(exportButton){

        exportButton.addEventListener(
            "click",
            function(){

                if(
                    typeof printer === "undefined" ||
                    !printer
                ){

                    console.warn(
                        "Không tìm thấy công cụ in bản đồ."
                    );

                    return;

                }


                const today =
                    new Date();


                const filename =
                    `WEBGIS_${currentLayer}_` +
                    `${today.getFullYear()}-` +
                    `${String(
                        today.getMonth()+1
                    ).padStart(2,"0")}-` +
                    `${String(
                        today.getDate()
                    ).padStart(2,"0")}`;


                printer.print(
                    "CurrentSize",
                    filename
                );

            }

        );

    }


    console.log(
        "WEBGIS APP: Khởi tạo hoàn tất."
    );

});
