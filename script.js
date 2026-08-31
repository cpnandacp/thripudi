const API_URL = "https://script.google.com/macros/s/AKfycbz-p21BXMjF7eNp5H0HB07PNm2Ib4pzHrubM0E3c_tOEtX_2gHO1UdZApj1EWMHtzE0/exec";

let activeStudentRoll = "";

window.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    const splash = document.getElementById('splashScreen');
    if (splash) {
      splash.style.opacity = '0';
      setTimeout(() => splash.style.display = 'none', 300);
    }
  }, 800);

  loadBasicDataSettings();
  updateDashboardStats();
});

function loadBasicDataSettings() {
  const params = new URLSearchParams({ action: 'getSettings' });
  fetch(`${API_URL}?${params.toString()}`)
    .then(res => res.json())
    .then(data => {
      if (data) {
        if (document.getElementById('dashSession')) document.getElementById('dashSession').innerText = `Academic Session ${data.academicSession}`;
        if (document.getElementById('dashFaculty')) document.getElementById('dashFaculty').innerText = `Welcome back, ${data.facultyName}! 👋`;
        if (document.getElementById('dashCollege')) document.getElementById('dashCollege').innerText = `${data.collegeName}, ${data.address}`;

        if (document.getElementById('cfgCollege')) document.getElementById('cfgCollege').value = data.collegeName;
        if (document.getElementById('cfgAddress')) document.getElementById('cfgAddress').value = data.address;
        if (document.getElementById('cfgSession')) document.getElementById('cfgSession').value = data.academicSession;
        if (document.getElementById('cfgFaculty')) document.getElementById('cfgFaculty').value = data.facultyName;
      }
    })
    .catch(err => console.error("Error loading settings:", err));
}

function submitSettings() {
  const data = {
    action: 'saveSettings',
    collegeName: document.getElementById('cfgCollege').value,
    address: document.getElementById('cfgAddress').value,
    academicSession: document.getElementById('cfgSession').value,
    facultyName: document.getElementById('cfgFaculty').value
  };

  fetch(API_URL, { method: 'POST', body: JSON.stringify(data) })
    .then(res => res.text())
    .then(() => {
      alert("Settings updated successfully!");
      loadBasicDataSettings();
    })
    .catch(err => alert("Failed to update settings!"));
}

function switchTab(tab) {
  const homeSec = document.getElementById('homeSec');
  const markSec = document.getElementById('markSec');
  const studentSec = document.getElementById('studentSec');
  const settingsSec = document.getElementById('settingsSec');

  const homeBtn = document.getElementById('tab-home-btn');
  const markBtn = document.getElementById('tab-mark-btn');
  const studentBtn = document.getElementById('tab-student-btn');
  const settingsBtn = document.getElementById('tab-settings-btn');

  [homeSec, markSec, studentSec, settingsSec].forEach(sec => sec && sec.classList.add('d-none'));
  [homeBtn, markBtn, studentBtn, settingsBtn].forEach(btn => btn && btn.classList.remove('active'));

  if (tab === 'home') {
    if (homeSec) homeSec.classList.remove('d-none');
    if (homeBtn) homeBtn.classList.add('active');
    updateDashboardStats();
  } else if (tab === 'mark') {
    if (markSec) markSec.classList.remove('d-none');
    if (markBtn) markBtn.classList.add('active');
    showSearchBox();
  } else if (tab === 'student') {
    if (studentSec) studentSec.classList.remove('d-none');
    if (studentBtn) studentBtn.classList.add('active');
  } else if (tab === 'settings') {
    if (settingsSec) settingsSec.classList.remove('d-none');
    if (settingsBtn) settingsBtn.classList.add('active');
  }
}

function showSearchBox() {
  document.getElementById('searchBoxView').classList.remove('d-none');
  document.getElementById('individualProfileView').classList.add('d-none');
  document.getElementById('classDirectoryView').classList.add('d-none');
}

function handleSearch() {
  const course = document.getElementById('mkCourse').value;
  const sem = document.getElementById('mkSem').value;
  const roll = document.getElementById('roll').value.trim();

  if (roll !== "") {
    loadStudentProfile(course, sem, roll);
  } else {
    loadClassDirectory(course, sem);
  }
}

function getLocalPhotoPath(course, roll) {
  const formattedCourse = course.replace(/\s+/g, '_');
  return `assets/student_photos/${formattedCourse}/${roll}.jpg`;
}

function loadStudentProfile(course, sem, roll) {
  activeStudentRoll = roll;
  document.getElementById('searchBoxView').classList.add('d-none');
  document.getElementById('classDirectoryView').classList.add('d-none');
  document.getElementById('individualProfileView').classList.remove('d-none');

  document.getElementById('profName').innerText = "Loading...";
  document.getElementById('profDetails').innerText = `${course} | ${sem}`;
  document.getElementById('profRoll').innerText = `Roll No: ${roll}`;

  const photoImg = document.getElementById('stPhoto');
  const localPhotoPath = getLocalPhotoPath(course, roll);
  const fallbackAvatar = `https://ui-avatars.com/api/?name=${roll}&background=0D6EFD&color=fff`;

  if (photoImg) {
    photoImg.src = localPhotoPath;
    photoImg.onerror = function() {
      this.src = fallbackAvatar;
    };
  }

  const params = new URLSearchParams({ action: 'getStudentDetails', roll, course, sem });

  fetch(`${API_URL}?${params.toString()}`)
    .then(res => res.json())
    .then(res => {
      if (res && res.name && res.name !== "Student Not Found") {
        document.getElementById('profName').innerText = res.name;

        const assignVal = isNaN(res.assignment) ? 0 : Number(res.assignment);
        const semVal = isNaN(res.seminar) ? 0 : Number(res.seminar);
        const examVal = isNaN(res.exam) ? 0 : Number(res.exam);
        const notesVal = Number(res.notesCount || 0);

        document.getElementById('assignment').value = isNaN(res.assignment) ? "" : res.assignment;
        document.getElementById('seminar').value = isNaN(res.seminar) ? "" : res.seminar;
        document.getElementById('exam').value = isNaN(res.exam) ? "" : res.exam;
        document.getElementById('notesVal').value = notesVal;

        updateProgressBar('progAssign', assignVal, 20);
        updateProgressBar('progSem', semVal, 20);
        updateProgressBar('progExam', examVal, 50);
        updateProgressBar('progNotes', notesVal, 10);
      } else {
        document.getElementById('profName').innerText = "Student Not Found!";
        alert("No student registered with this Roll Number!");
      }
    })
    .catch(err => {
      console.error(err);
      document.getElementById('profName').innerText = "Error Loading Data";
    });
}

function updateProgressBar(idPrefix, val, maxVal) {
  const bar = document.getElementById(`${idPrefix}Bar`);
  const text = document.getElementById(`${idPrefix}Val`);
  if (!bar || !text) return;

  const numVal = parseFloat(val) || 0;
  const percent = Math.min(100, Math.round((numVal / maxVal) * 100));
  bar.style.width = `${percent}%`;
  text.innerText = `${percent}% (${numVal}/${maxVal})`;
}

function submitMark() {
  const course = document.getElementById('mkCourse').value;
  const sem = document.getElementById('mkSem').value;
  const name = document.getElementById('profName').innerText;

  const data = {
    action: 'saveData',
    roll: activeStudentRoll,
    name: name,
    course: course,
    sem: sem,
    assignment: document.getElementById('assignment').value,
    seminar: document.getElementById('seminar').value,
    exam: document.getElementById('exam').value,
    notesVal: document.getElementById('notesVal').value
  };

  fetch(API_URL, { method: 'POST', body: JSON.stringify(data) })
    .then(res => res.text())
    .then(() => {
      alert("Data Saved Successfully!");
      loadStudentProfile(course, sem, activeStudentRoll);
    })
    .catch(err => alert("Error saving data!"));
}

function loadClassDirectory(course, sem) {
  document.getElementById('searchBoxView').classList.add('d-none');
  document.getElementById('individualProfileView').classList.add('d-none');
  document.getElementById('classDirectoryView').classList.remove('d-none');

  document.getElementById('classDirTitle').innerText = `${course} (${sem})`;
  const container = document.getElementById('classListContainer');
  container.innerHTML = '<div class="text-center p-3 col-12"><div class="spinner-border spinner-border-sm text-primary"></div> Loading Class List...</div>';

  const params = new URLSearchParams({ action: 'generateReport', course, sem });

  fetch(`${API_URL}?${params.toString()}`)
    .then(res => res.json())
    .then(data => {
      container.innerHTML = '';
      if (!data || data.length === 0) {
        container.innerHTML = '<div class="col-12 text-center text-danger p-3">No students found in this class!</div>';
        return;
      }

      data.forEach(st => {
        const localPhotoPath = getLocalPhotoPath(course, st.roll);
        const col = document.createElement('div');
        col.className = 'col-6 col-sm-4 col-md-3 col-lg-2';
        col.innerHTML = `
          <div class="card p-2 text-center shadow-sm border-0 bg-light h-100" style="cursor:pointer;" onclick="loadStudentProfile('${course}', '${sem}', '${st.roll}')">
            <img src="${localPhotoPath}" onerror="this.src='https://ui-avatars.com/api/?name=${st.roll}&background=0D6EFD&color=fff';" class="rounded-circle mx-auto mb-1 border" style="width:55px; height:55px; object-fit:cover;">
            <h6 class="fw-bold small mb-0 text-truncate">${st.name}</h6>
            <span class="badge bg-secondary" style="font-size:10px;">Roll: ${st.roll}</span>
          </div>
        `;
        container.appendChild(col);
      });
    })
    .catch(err => {
      console.error(err);
      container.innerHTML = '<div class="col-12 text-center text-danger p-3">Failed to load directory.</div>';
    });
}

function submitStudent() {
  const roll = document.getElementById('stRoll').value;
  const name = document.getElementById('stName').value;
  const sem = document.getElementById('stSem').value;
  const course = document.getElementById('stCourse').value;

  if (!roll || !name) {
    alert("Please fill Roll Number and Name!");
    return;
  }

  const student = {
    action: 'addStudent',
    roll: roll,
    name: name,
    sem: sem,
    course: course
  };

  fetch(API_URL, { method: 'POST', body: JSON.stringify(student) })
    .then(res => res.text())
    .then(() => {
      alert(`Student Added Successfully!\n\nPlease make sure to keep photo at:\nassets/student_photos/${course.replace(/\s+/g, '_')}/${roll}.jpg`);
      document.getElementById('studentForm').reset();
      updateDashboardStats();
    })
    .catch(() => alert("Failed to add student!"));
}

function openReportModal() {
  document.getElementById('reportPage').style.display = 'block';
  loadReportData();
}

function closeReportModal() {
  document.getElementById('reportPage').style.display = 'none';
}

function loadReportData() {
  const course = document.getElementById('rptCourse').value;
  const sem = document.getElementById('rptSem').value;
  const tbody = document.getElementById('reportTableBody');

  document.getElementById('rptHeading').innerText = `${course} Report`;
  document.getElementById('rptSubHeading').innerText = `${sem} - Summary`;
  
  tbody.innerHTML = '<tr><td colspan="6" class="text-center p-3"><div class="spinner-border spinner-border-sm text-primary me-2"></div>Loading data...</td></tr>';

  const params = new URLSearchParams({ action: 'generateReport', course, sem });

  fetch(`${API_URL}?${params.toString()}`)
    .then(res => res.json())
    .then(data => {
      tbody.innerHTML = '';
      if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center p-3 text-danger fw-bold">No records found.</td></tr>';
        return;
      }
      data.forEach(st => {
        const tr = document.createElement('tr');
        tr.className = "text-center";
        tr.innerHTML = `
          <td>${st.roll}</td>
          <td class="text-start"><b>${st.name}</b></td>
          <td>${st.assignment}</td>
          <td>${st.seminar}</td>
          <td>${st.exam}</td>
          <td>${st.notesCount}</td>
        `;
        tbody.appendChild(tr);
      });
    })
    .catch(err => {
      tbody.innerHTML = '<tr><td colspan="6" class="text-center p-3 text-danger">Error loading report.</td></tr>';
    });
}

function downloadPDF() {
  const element = document.getElementById('printableArea');
  const course = document.getElementById('rptCourse').value;
  const sem = document.getElementById('rptSem').value;
  
  const opt = {
    margin: 0.3,
    filename: `Report_${course}_${sem}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
  };
  html2pdf().set(opt).from(element).save();
}

function downloadIndividualPDF() {
  const element = document.getElementById('printableStudentProfile');
  const name = document.getElementById('profName').innerText.replace(/\s+/g, '_');
  
  const opt = {
    margin: 0.3,
    filename: `${name}_Profile.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2 },
    jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
  };
  html2pdf().set(opt).from(element).save();
}

function updateDashboardStats() {
  const studentCount = document.getElementById('dashStudentCount');
  const courseCountElem = document.getElementById('dashCourseCount');
  const params = new URLSearchParams({ action: 'generateReport', course: '', sem: '' });
  
  fetch(`${API_URL}?${params.toString()}`)
    .then(res => res.json())
    .then(data => {
      if (Array.isArray(data)) {
        if (studentCount) studentCount.innerText = data.length;
        const courseCounts = {};
        data.forEach(item => {
          let c = item.course ? String(item.course).trim() : 'Others';
          courseCounts[c] = (courseCounts[c] || 0) + 1;
        });
        if (courseCountElem) courseCountElem.innerText = `${Object.keys(courseCounts).length} Courses`;
        renderNativePieChart(courseCounts, data.length);
      }
    })
    .catch(() => {
      if (studentCount) studentCount.innerText = "0";
    });
}

function renderNativePieChart(courseCounts, total) {
  const pieElement = document.getElementById('customPieChart');
  const legendElement = document.getElementById('chartLegend');
  if (!pieElement || !legendElement || total === 0) return;

  const colors = ['#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#e74a3b', '#858796'];
  const keys = Object.keys(courseCounts);

  let gradientString = 'conic-gradient(';
  let currentPercentage = 0;
  let legendHtml = '';

  keys.forEach((key, index) => {
    const count = courseCounts[key];
    const percent = (count / total) * 100;
    const color = colors[index % colors.length];
    
    const start = currentPercentage;
    currentPercentage += percent;
    const end = currentPercentage;

    gradientString += `${color} ${start}% ${end}%, `;
    legendHtml += `
      <div class="d-flex align-items-center gap-1">
        <span style="width:10px; height:10px; background:${color}; border-radius:50%; display:inline-block;"></span>
        <span>${key}: <b>${count}</b></span>
      </div>
    `;
  });

  gradientString = gradientString.slice(0, -2) + ')';
  pieElement.style.background = gradientString;
  legendElement.innerHTML = legendHtml;
}

function exitApp() {
  if (confirm("Are you sure you want to exit?")) {
    window.close();
  }
}