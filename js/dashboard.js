let allData = [];
  currentFilter = type;

  document.querySelectorAll('.filter-bar button').forEach(b=>b.classList.remove('filter-active'));

  if(type==='ALL') document.getElementById('f_all').classList.add('filter-active');
  if(type==='OVERDUE') document.getElementById('f_overdue').classList.add('filter-active');
  if(type==='NEAR') document.getElementById('f_near').classList.add('filter-active');

  applyFilter();
}

function exportCSV(){
  let csv = "ID,Equipment,Start Date,End Date,Days Left
";

  const rows = document.querySelectorAll("#durationTable tbody tr");

  rows.forEach(function(tr){
    const cols = tr.querySelectorAll("td");
    let row = [];

    cols.forEach(function(td){
      // elak karakter pelik (comma/newline)
      let text = td.innerText.replace(/,/g, " ").replace(/
/g, " ").trim();
      row.push(text);
    });

    csv += row.join(",") + "
";
  });

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "contract_duration.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
});

  const blob = new Blob([csv], {type:"text/csv"});
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "contract_duration.csv";
  a.click();
},${a.equipmentName},${a.startDate},${a.endDate},${diff}\n`;
  });

  const blob = new Blob([csv], {type:"text/csv"});
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "duration_report.csv";
  a.click();
}
