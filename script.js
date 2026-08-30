// Google Apps Script Web App-ന്റെ URL ഇവിടെ നൽകുക
const API_URL = "https://script.google.com/macros/s/AKfycbz-p21BXMjF7eNp5H0HB07PNm2Ib4pzHrubM0E3c_tOEtX_2gHO1UdZApj1EWMHtzE0/exec";

// 1. Splash Screen Control (2 Seconds delay)
window.addEventListener('load', function() {
  setTimeout(function() {
    const splash = document.getElementById('splashScreen');
    if (splash) {
      splash.style.opacity = '0';
      setTimeout(function() {
        splash.style.display = 'none';
      }, 500);
    }
  }, 1800);
});

// 2. Tab Switch Logic
function switchTab(type) {
  const markSec = document.getElementById('markSec');
  const studentSec = document.getElementById('studentSec');
  const markBtn = document.getElementById('tab-mark-btn');
  const studentBtn = document.getElementById('tab-student-btn');

  if (type === 'mark') {
    markSec.classList.remove('d-none');
    studentSec.classList.add('d-none');
    markBtn.classList.add('active');
    studentBtn.classList.remove('active');
  } else {
    studentSec.classList.remove('d-none');
    markSec.classList.add('d-none');
    studentBtn.classList.add('active');
    markBtn.classList.remove('active');
  }
}

// 3. Report Modal Controls
function openReportModal() {
  document.getElementById('reportPage').style.display = 'block';
  loadReport();
}

function closeReportModal() {
  document.getElementById('reportPage').style.display = 'none';
}

// 4. Fetch Student Details on Roll No Input (GET Request)
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

// 5. Submit New Student (POST Request)
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
    alert(res);
    document.getElementById('studentForm').reset();
  })
  .catch(err => {
    alert("Error saving student!");
    console.error(err);
  });
}

// 6. Submit Marks & Data (POST Request)
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
    alert(res);
    document.getElementById('markForm').reset();
    document.getElementById('name').value = "";
    clearStatuses();
  })
  .catch(err => {
    alert("Error saving data!");
    console.error(err);
  });
}

// 7. Load Full Report (GET Request)
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