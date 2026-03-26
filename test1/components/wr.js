let duringData = [];
let postData = [];
let assetData = [];

let duringPage = 1;
let postPage = 1;

const perPage = 5;


/*load data asset*/
async function loadWarranty(){

showLoading();

const data = await fetchData("https://script.google.com/macros/s/AKfycbwHDAybRqO3zs6SXSaP3wQcdkNH9bU6v2QAGNy2yKT2GqfRRfcOczkCCI94oWxZEVcbPw/exec?action=getAssets");

if(!data){

return;
}

renderWarranty(data);

hideLoading();
assetData = data;

}

/*pisah warranty*/
function renderWarranty(data){

const today = new Date();

duringData = [];
postData = [];

data.forEach(asset=>{

const end = new Date(asset.endDate);

const diffTime = end - today;
const daysLeft = Math.ceil(diffTime / (1000*60*60*24));

let statusClass="";
let statusText="";

if(daysLeft < 0){ statusClass="badge-expired" ; statusText="Expired" ; postData.push({...asset,daysLeft,statusClass,statusText}); }else if(daysLeft <=90){ statusClass="badge-warning" ; statusText="Expiring Soon" ; duringData.push({...asset,daysLeft,statusClass,statusText}); }else{ statusClass="badge-active" ; statusText="Active" ; duringData.push({...asset,daysLeft,statusClass,statusText}); } }); renderDuringTable(); renderPostTable(); } /*export*/ function exportPostWarranty(){ const today=new Date(); let exportData=[]; assetData.forEach(asset=>{

    const end = new Date(asset.endDate);

    if(end < today){ exportData.push({ ID: asset.id, Equipment: asset.equipmentName || "-" , StartDate: asset.startDate || "-" , EndDate: asset.endDate || "-" , Status: "Expired" }); } }); /* convert to CSV */ let csv="ID,Equipment,Start Date,End Date,Status\n" ; exportData.forEach(r=>{
        csv += `${r.ID},"${r.Equipment}",${r.StartDate},${r.EndDate},${r.Status}\n`;
        });

        /* download */
        const blob = new Blob([csv],{type:"text/csv"});
        const url = URL.createObjectURL(blob);

        const a = document.createElement("a");
        a.href = url;
        a.download = "Post_Warranty_Report.csv";
        a.click();

        }


        function formatDate(dateStr){

        if(!dateStr) return "-";

        const d = new Date(dateStr);

        const day = String(d.getDate()).padStart(2,"0");
        const month = String(d.getMonth()+1).padStart(2,"0");
        const year = d.getFullYear();

        return `${day}/${month}/${year}`;

        }

        /*render table*/
        function renderDuringTable(){

        const table = document.getElementById("duringWarranty");
        table.innerHTML="";

        const start = (duringPage-1)*perPage;
        const end = start+perPage;

        const pageData = duringData.slice(start,end);

        pageData.forEach((asset,index)=>{

        const realIndex = start + index;

        table.innerHTML += `
        <tr>
            <td onclick="showDetailById('${asset.id}')" style="cursor:pointer;color:#00e5ff;">
                ${asset.id}
            </td>
            <td>${asset.equipmentName || "-"}</td>
            <td>${formatDate(asset.startDate)}</td>
            <td>${formatDate(asset.endDate)}</td>
            <td>${asset.daysLeft} days</td>
            <td><span class="badge ${asset.statusClass}">${asset.statusText}</span></td>
        </tr>
        `;
        });
        renderDuringPagination();
        }

        /*rendertablepost*/
        function renderPostTable(){

        const table = document.getElementById("postWarranty");
        table.innerHTML="";

        const start = (postPage-1)*perPage;
        const end = start+perPage;

        const pageData = postData.slice(start,end);

        pageData.forEach(asset=>{

        table.innerHTML += `
        <tr>
            <td>${asset.id}</td>
            <td>${asset.equipmentName || "-"}</td>
            <td>${asset.supplier || "-"}</td>
            <td>${formatDate(asset.startDate)}</td>
            <td>${formatDate(asset.endDate)}</td>
            <td><span class="badge badge-expired">Expired</span></td>
        </tr>
        `;

        });

        renderPostPagination();

        }

        /*paginationdw*/
        function renderDuringPagination(){

        const container = document.getElementById("duringWarranty");

        const totalPages = Math.ceil(duringData.length/perPage);

        let html=`<tr>
            <td colspan="6">
                <div class="pagination">`;

                    if(duringPage>1){
                    html+=`<button onclick="changeDuringPage(${duringPage-1})">Prev</button>`;
                    }

                    html+=` Page ${duringPage} / ${totalPages} `;

                    if(duringPage<totalPages){ html+=`<button onclick="changeDuringPage(${duringPage+1})">Next</button>`;
                        }

                        html+=`</div>
            </td>
        </tr>`;

        container.innerHTML+=html;

        }

        function changeDuringPage(p){

        duringPage=p;
        renderDuringTable();

        }

        /*paginationpw*/
        function renderPostPagination(){

        const container = document.getElementById("postWarranty");

        const totalPages = Math.ceil(postData.length/perPage);

        let html=`<tr>
            <td colspan="7">
                <div class="pagination">`;

                    if(postPage>1){
                    html+=`<button onclick="changePostPage(${postPage-1})">Prev</button>`;
                    }

                    html+=` Page ${postPage} / ${totalPages} `;

                    if(postPage<totalPages){ html+=`<button onclick="changePostPage(${postPage+1})">Next</button>`;
                        }

                        html+=`</div>
            </td>
        </tr>`;

        container.innerHTML+=html;

        }

        function changePostPage(p){

        postPage=p;
        renderPostTable();

        }

        /**/
        function showDetailById(id){

        const asset = assetData.find(a => a.id === id);
        if(!asset) return;

        document.getElementById("detailModal").style.display="flex";

        const detail=document.getElementById("assetDetail");

        /* kira status */
        const today = new Date();
        const end = new Date(asset.endDate);
        const daysLeft = Math.ceil((end - today)/(1000*60*60*24));

        let statusClass="";
        let statusText="";

        if(daysLeft < 0){ statusClass="badge-expired" ; statusText="Expired" ; }else if(daysLeft <=90){ statusClass="badge-warning" ; statusText="Expiring Soon" ; }else{ statusClass="badge-active" ; statusText="Active" ; } detail.innerHTML=` <div class="asset-grid">

            <!-- BASIC -->
            <div class="asset-card">
                <h4>Basic Info</h4>

                <b>ID</b>
                <div>${asset.id}</div>
                <b>Asset No</b>
                <div>${asset.assetNo || "-"}</div>
                <b>Asset No Hosza</b>
                <div>${asset.assetNoHosza || "-"}</div>
                <b>Equipment</b>
                <div>${asset.equipmentName || "-"}</div>
                <b>Description</b>
                <div>${asset.equipmentDescriptions || "-"}</div>
                <b>Category</b>
                <div>${asset.category || "-"}</div>

            </div>

            <!-- LOCATION -->
            <div class="asset-card">
                <h4>Location</h4>

                <b>Code Location</b>
                <div>${asset.codeLocation || "-"}</div>
                <b>Area</b>
                <div>${asset.area || "-"}</div>
                <b>Department</b>
                <div>${asset.department || "-"}</div>

            </div>

            <!-- TECHNICAL -->
            <div class="asset-card">
                <h4>Technical</h4>

                <b>Type Code</b>
                <div>${asset.typeCode || "-"}</div>
                <b>Discipline</b>
                <div>${asset.discipline || "-"}</div>
                <b>Manufacturer</b>
                <div>${asset.manufacture || "-"}</div>
                <b>Model</b>
                <div>${asset.model || "-"}</div>
                <b>Serial No</b>
                <div>${asset.serialNumber || "-"}</div>

            </div>

            <!-- SUPPLIER -->
            <div class="asset-card">
                <h4>Supplier</h4>

                <b>Bumi</b>
                <div>${asset.bumi || "-"}</div>
                <b>Bumi Contact</b>
                <div>${asset.bumiContact || "-"}</div>
                <b>Supplier</b>
                <div>${asset.supplier || "-"}</div>
                <b>Supplier Contact</b>
                <div>${asset.supplierContact || "-"}</div>

            </div>

            <!-- FINANCIAL -->
            <div class="asset-card">
                <h4>Financial</h4>

                <b>Price</b>
                <div>${asset.price || "-"}</div>
                <b>LPO No</b>
                <div>${asset.lpoNo || "-"}</div>

            </div>

            <!-- WARRANTY -->
            <div class="asset-card">
                <h4>Warranty</h4>

                <b>Start Date</b>
                <div>${formatDate(asset.startDate)}</div>
                <b>End Date</b>
                <div>${formatDate(asset.endDate)}</div>
                <b>Status</b>
                <div><span class="badge ${statusClass}">${statusText}</span></div>
                <b>Days Left</b>
                <div>${daysLeft} days</div>

            </div>

            </div>

            `;

            }

            function closeAssetDetail(){
            document.getElementById("detailModal").style.display="none";
            }

            document.addEventListener("DOMContentLoaded", function(){

            document.getElementById("detailModal").style.display="none";

            loadWarranty();

            });


            function closeAssetDetail(){
            document.getElementById("detailModal").style.display="none";
            }

            document.addEventListener("DOMContentLoaded", function(){

            document.getElementById("detailModal").style.display="none";

            loadWarranty();

            });