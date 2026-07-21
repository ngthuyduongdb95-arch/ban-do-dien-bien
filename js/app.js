//======================================================
// APP.JS
//======================================================

document.addEventListener("DOMContentLoaded", async ()=>{

    // Load dữ liệu Google Sheets
    await loadSheet();

    // Load bản đồ
    await loadGeoJSON();

    // Dashboard
    dashboard.update();

    //==========================
    // Đổi lớp dữ liệu
    //==========================

    document
        .getElementById("layerSelect")
        .addEventListener("change",function(){

            setLayer(this.value);

        });

    //==========================
    // Tìm xã
    //==========================

    document
        .getElementById("btnSearch")
        .addEventListener("click",()=>{

            searchFeature(

                document
                    .getElementById("txtSearch")
                    .value

            );

        });

    document
        .getElementById("txtSearch")
        .addEventListener("keypress",(e)=>{

            if(e.key==="Enter"){

                searchFeature(e.target.value);

            }

        });

    //==========================
    // Refresh
    //==========================

    document
        .getElementById("btnRefresh")
        .addEventListener("click",async()=>{

            await reloadData();

        });

});
