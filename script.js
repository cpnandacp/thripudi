const API_URL = "https://script.google.com/macros/s/AKfycbz-p21BXMjF7eNp5H0HB07PNm2Ib4pzHrubM0E3c_tOEtX_2gHO1UdZApj1EWMHtzE0/exec";

// 1. Splash Screen Control
function hideSplashScreen() {
  const splash = document.getElementById('splashScreen');
  if (splash) {
    splash.style.opacity = '0';
    setTimeout(function() {
      splash.style.display = 'none';
    }, 400);
  }
}

window.addEventListener('load', function() {
  setTimeout(hideSplashScreen, 1200);
  updateDashboardStats(); // Load Dashboard Stats
});
setTimeout(hideSplashScreen, 2500);

// Exit App Function (Mobile & Desktop Compatible)
function exitApp() {
  if (confirm("Thripudi Student Portal Says:\nAre you sure you want to exit?")) {
    // 1. Android/Cordova Mobile Webview Apps (APK) ആണെങ്കിൽ
    if (navigator.app && navigator.app.exitApp) {
      navigator.app.exitApp();
    } 
    // 2. സാധാരണ മൊബൈൽ ബ്രൗസറുകളിൽ (Chrome/Safari)
    else {
      // ബ്രൗസർ ടാബ് ക്ലോസ് ചെയ്യാൻ ശ്രമിക്കുന്നു
      window.opener = null;
      window.open('', '_self', '');
      window.close();
      
      // ബ്രൗസർ ക്ലോസ് ചെയ്യുന്നത് തടഞ്ഞാൽ Blank Page-ലേക്ക് വിടുന്നു
      setTimeout(function() {
        document.body.innerHTML = `
          <div style="display:flex; height:100vh; align-items:center; justify-content:center; text-align:center; font-family:sans-serif; background:#f8f9fa;">
            <div>
              <h3 style="color:#2c3e50; font-weight:bold;">You can now close this tab</h3>
              <p style="color:#7f8c8d;">നിങ്ങൾക്ക് ഈ ബ്രൗസർ ടാബ് സ്വയം ക്ലോസ് ചെയ്യാം.</p>
            </div>
          </div>
        `;
      }, 300);
    }
  }
}
// Tab Switch Logic
function switchTab(type) {
  const homeSec = document.getElementById('homeSec');
  const markSec = document.getElementById('markSec');
  const studentSec = document.getElementById('studentSec');
  
  const homeBtn = document.getElementById('tab-home-btn');
  const markBtn = document.getElementById('tab-mark-btn');
  const studentBtn = document.getElementById('tab-student-btn');

  [homeSec, markSec, studentSec].forEach(el => el.classList.add('d-none'));
  [homeBtn, markBtn, studentBtn].forEach(el => el.classList.remove('active'));

  if (type === 'home') {
    homeSec.classList.remove('d-none');
    homeBtn.classList.add('active');
    updateDashboardStats(); // Refresh stats when coming home
  } else if (type === 'mark') {
    markSec.classList.remove('d-none');
    markBtn.classList.add('active');
  } else if (type === 'student') {
    studentSec.classList.remove('d-none');
    studentBtn.classList.add('active');
  }
}

// Home Dashboard Stats Update (Fixed 0 & stuck issue)
function updateDashboardStats() {
  const syncStatus = document.getElementById('dashSyncStatus');
  const syncIcon = document.getElementById('dashSyncIcon');
  const studentCount = document.getElementById('dashStudentCount');

  if (navigator.onLine) {
    if (syncStatus) syncStatus.innerText = "Connected 🟢";
    if (syncStatus) syncStatus.className = "fw-bold m-0 text-success";
    if (syncIcon) syncIcon.className = "fa-solid fa-wifi text-success fs-2 mb-1";
  } else {
    if (syncStatus) syncStatus.innerText = "Offline 🔴";
    if (syncStatus) syncStatus.className = "fw-bold m-0 text-danger";
    if (syncIcon) syncIcon.className = "fa-solid fa-wifi-slash text-danger fs-2 mb-1";
  }

  // Default course passed to get actual count
  const params = new URLSearchParams({ action: 'generateReport', course: 'BA English', sem: 'Semester 1' });
  fetch(`${API_URL}?${params.toString()}`)
    .then(res => res.json())
    .then(data => {
      if (Array.isArray(data) && studentCount) {
        studentCount.innerText = data.length > 0 ? `${data.length}+ Students` : "Active";
      } else if (studentCount) {
        studentCount.innerText = "Active";
      }
    })
    .catch(() => {
      if (studentCount) studentCount.innerText = "Active";
    });
}

// Report Modal Controls
function openReportModal() {
  document.getElementById('reportPage').style.display = 'block';
  loadReport();
}

function closeReportModal() {
  document.getElementById('reportPage').style.display = 'none';
}

// Debounce for smooth typing
let fetchTimeout = null;
function debounceFetch() {
  clearTimeout(fetchTimeout);
  fetchTimeout = setTimeout(fetchDetails, 600);
}

// Fetch Student Details
function fetchDetails() {
  const roll = document.getElementById('roll').value;
  const course = document.getElementById('mkCourse').value;
  const sem = document.getElementById('mkSem').value;

  if (!roll) {
    document.getElementById('name').value = "";
    document.getElementById('notesVal').value = "";
    clearStatuses();
    return;
  }

  document.getElementById('name').value = "Searching...";

  const params = new URLSearchParams({
    action: 'getStudentDetails',
    roll: roll,
    course: course,
    sem: sem
  });

  fetch(`${API_URL}?${params.toString()}`)
    .then(response => response.json())
    .then(res => {
      document.getElementById('name').value = res.name;
      
      if (res.name !== "Student Not Found") {
        updateStatus('stAssignment', res.assignment);
        updateStatus('stSeminar', res.seminar);
        updateStatus('stExam', res.exam);
        
        document.getElementById('notesVal').value = res.notesCount > 0 ? res.notesCount : "";
        document.getElementById('stNotes').innerHTML = res.notesCount > 0 
          ? `<span class="status-badge bg-submitted">${res.notesCount}</span>` 
          : `<span class="status-badge bg-not-submitted">0</span>`;
      } else {
        document.getElementById('notesVal').value = "";
        clearStatuses();
      }
    })
    .catch(err => {
      console.error(err);
      document.getElementById('name').value = "Error fetching data";
    });
}

function updateStatus(elemId, val) {
  const elem = document.getElementById(elemId);
  if (val === "Not Submitted") {
    elem.innerHTML = '<span class="status-badge bg-not-submitted">NS</span>';
  } else {
    elem.innerHTML = `<span class="status-badge bg-submitted">${val}</span>`;
  }
}

function clearStatuses() {
  document.getElementById('stAssignment').innerHTML = '';
  document.getElementById('stSeminar').innerHTML = '';
  document.getElementById('stExam').innerHTML = '';
  document.getElementById('stNotes').innerHTML = '';
}

// Submit Student
function submitStudent() {
  const student = {
    action: 'addStudent',
    roll: document.getElementById('stRoll').value,
    name: document.getElementById('stName').value,
    sem: document.getElementById('stSem').value,
    course: document.getElementById('stCourse').value
  };

  if (!student.roll || !student.name) {
    alert("Please enter Roll Number and Name!");
    return;
  }

  fetch(API_URL, {
    method: 'POST',
    body: JSON.stringify(student)
  })
  .then(response => response.text())
  .then(res => {
    alert("Student Added Successfully!");
    document.getElementById('studentForm').reset();
  })
  .catch(err => {
    alert("Error saving student!");
    console.error(err);
  });
}

// Submit Mark
function submitMark() {
  const nameVal = document.getElementById('name').value;
  if (nameVal === "Student Not Found" || !nameVal || nameVal === "Searching...") {
    alert("Please select a valid Student!");
    return;
  }

  const data = {
    action: 'saveData',
    roll: document.getElementById('roll').value,
    name: nameVal,
    course: document.getElementById('mkCourse').value,
    sem: document.getElementById('mkSem').value,
    assignment: document.getElementById('assignment').value,
    seminar: document.getElementById('seminar').value,
    exam: document.getElementById('exam').value,
    notesVal: document.getElementById('notesVal').value
  };

  fetch(API_URL, {
    method: 'POST',
    body: JSON.stringify(data)
  })
  .then(response => response.text())
  .then(res => {
    alert("Data Saved Successfully!");
    document.getElementById('markForm').reset();
    document.getElementById('name').value = "";
    clearStatuses();
  })
  .catch(err => {
    alert("Error saving data!");
    console.error(err);
  });
}

// Load Report
function loadReport() {
  const course = document.getElementById('rptCourse').value;
  const sem = document.getElementById('rptSem').value;
  const roll = document.getElementById('rptRoll').value;

  document.getElementById('rptHeading').innerText = `${course} - ${sem}`;
  document.getElementById('rptSubHeading').innerText = roll ? `Roll No: ${roll}` : "Full Class Summary";
  
  const tbody = document.getElementById('reportTableBody');
  tbody.innerHTML = '<tr><td colspan="7" class="text-center p-3">Loading...</td></tr>';

  const params = new URLSearchParams({
    action: 'generateReport',
    course: course,
    sem: sem,
    roll: roll
  });

  fetch(`${API_URL}?${params.toString()}`)
    .then(response => response.json())
    .then(data => {
      tbody.innerHTML = '';
      if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center p-3 text-danger fw-bold">No records found.</td></tr>';
        return;
      }

      data.forEach(row => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td class="text-center fw-bold">${row.roll}</td>
          <td class="fw-bold">${row.name}</td>
          <td class="text-center">${row.assignment}</td>
          <td class="text-center">${row.seminar}</td>
          <td class="text-center">${row.exam}</td>
          <td class="text-center fw-bold">${row.notesCount > 0 ? row.notesCount : '0'}</td>
          <td class="text-center"></td>
        `;
        tbody.appendChild(tr);
      });
    })
    .catch(err => {
      console.error(err);
      tbody.innerHTML = '<tr><td colspan="7" class="text-center p-3 text-danger">Error loading report!</td></tr>';
    });
}

// Mobile & Desktop Responsive PDF Download Function
function downloadPDF() {
  const element = document.getElementById('printableArea');
  const course = document.getElementById('rptCourse').value.replace(/\s+/g, '_');
  const sem = document.getElementById('rptSem').value.replace(/\s+/g, '_');

  // Direct Mobile Native Print fallback if html2pdf fails or on small screens
  if (typeof html2pdf !== 'undefined') {
    const opt = {
      margin:       [0.2, 0.2, 0.2, 0.2],
      filename:     `${course}_${sem}_Report.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, scrollX: 0, scrollY: 0 },
      jsPDF:        { unit: 'in', format: 'a4', orientation: 'portrait' }
    };
    
    // Trigger download
    html2pdf().set(opt).from(element).save().catch(function() {
      window.print();
    });
  } else {
    window.print();
  }
}
