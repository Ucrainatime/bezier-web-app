class Point {
  constructor(id, Pos, color = '#ffffff') {
    this.id = id;
    this.x = Pos[0];
    this.y = Pos[1];
    this.color = color
  }
}

const STEP = 0.001;

var canvas = document.getElementById("canvasElement");
var canvasCtx = canvas.getContext("2d");

canvas.width = window.innerWidth * 0.8;
canvas.height = window.innerHeight;

document.crosspoint = "\u2718";
document.mousePos = [NaN, NaN];
document.punti = [];
document.id = 0;
document.puntocorrente = -1;
document.project = null;
document.projectCount = 0;

function resizeCallback() {
  canvas.width = window.innerWidth * 0.8;
  canvas.height = window.innerHeight;
}

function negativeid() {
  if (document.id <= 0) {
    return 0;
  }
  return document.id--;
}

function updateNumberProject() {
  // aggiorna il testo del numero del progetto
  document.getElementById("project-count").textContent = document.projectCount;
}

function negativeproject() {
  //controlla se il contatore dei progetti è < di 0
  if (document.projectCount > 0) {
    document.projectCount--;
    updateProjectCount();
  }
}

function decrementID(index) {
  for (let i = index; i < document.punti.length; i++) {
    document.punti[i].id -= 1;
  }
  return document.id--;
}

function lerp(a, b, t) {
  return (1 - t) * a + t * b;
}

function addPoint(mousePos, id) {
  const punti = new Point(id, mousePos, pointColorPicker.value);
  document.punti.push(punti);
  updatePuntiList();
  document.id = id;
  // Aggiorna l'elenco dei punti nell'HTML
}

function updatePuntiList() {
  const puntiList = document.getElementById("punti-lista");
  // cancella l'elenco dei punti
  puntiList.innerHTML = "";
  //aggiunge i punti
  document.punti.forEach((punto) => {
    const puntoItem = document.createElement("li");
    // crea il testo
    const puntoText = document.createElement("span");
    puntoText.textContent = `P${punto.id}: (${punto.x}, ${punto.y})`;
    // crea un "pulsante" per eliminare il punto
    const deleteButtonpoint = document.createElement("a");
    deleteButtonpoint.textContent = document.crosspoint;
    deleteButtonpoint.classList.add("deletepoint");
    // aggiungo il testo alla lista schermo
    puntoItem.appendChild(puntoText);
    puntoItem.appendChild(deleteButtonpoint);
    // aggiungo tutto alla lista schermo principale 
    puntiList.appendChild(puntoItem);
  });
}

function addProject() {
  const projectList = document.getElementById("lista-progetti");
  const projectItem = document.createElement("li");

  // creo il campo dell'input
  const projectNameInput = document.createElement("input");
  projectNameInput.type = "text";
  projectNameInput.placeholder = "Name The Project";
  projectNameInput.classList.add("InputProject");

  // aggiungo l'elemento
  projectItem.appendChild(projectNameInput);
  projectList.appendChild(projectItem);

  //quando crei un progetto 
  setTimeout(() => {
    projectNameInput.focus();
  }, 0);

  // Aggiungere la funzionalità del pulsante di conferma
  projectNameInput.addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
      deleteAllPoint();
      confirmProject(null, projectItem, projectNameInput);
    }
  });
  projectNameInput.addEventListener("blur", function() {
    projectList.removeChild(projectItem);
  });
}

function confirmProject(projectName = null, projectItem = null, projectNameInput = null) {
  if (projectName === null) {
    projectName = projectNameInput.value.trim();
    document.project = projectName;
  }
  projectList = document.getElementById("lista-progetti");
  if (projectItem === null) {
    projectItem = document.createElement("li");
  }
  if (!projectName) {
    return;
  }
  // creo il progetto con il nome scelto
  const projectText = document.createElement("a");
  projectText.classList.add("project");
  projectText.textContent = projectName;
  // creo tasto cancella
  const deleteButtonProject = document.createElement("a");
  deleteButtonProject.textContent = document.crosspoint;
  deleteButtonProject.classList.add("deleteproject");

  // cambio il inputbox al nome e aggiungo il tasto cancella
  if (projectNameInput !== null) {
    projectItem.replaceChild(projectText, projectNameInput);
  } else {
    projectItem.appendChild(projectText);
  }
  projectItem.appendChild(deleteButtonProject);

  if (projectList) {
    projectList.appendChild(projectItem)
  }

  projectText.addEventListener("click", function() {
    document.project = projectName;
    getProject(document.project);
  })
  deleteButtonProject.addEventListener("click", function() {
    projectList.removeChild(projectItem);
  });
}


function deleteButton(event) {
  // controlla cosa clicco
  const clickedElement = event.target;
  console.log("Cliccato elemento:", event.target);
  // controlla se clicco un elemento con "X" e con id uguale a "deletepoject"
  if (clickedElement.textContent === document.crosspoint && clickedElement.classList.contains('deletepoint')) {
    //prende elemento del punto
    const listItem = clickedElement.parentNode;
    //lo cerca nell'array di punti
    const index = Array.from(listItem.parentNode.children).indexOf(listItem);
    //rimuove il punto
    document.punti.splice(index, 1);
    decrementID(index);
    renderizzaCurva(document.punti);
    updatePuntiList();
  }
}

function deleteAllPoint() {
  for (i = document.punti.length; i >= 0; i--) {
    document.punti.pop();
  }
  document.id = 0;
  renderizzaCurva(document.punti);
  updatePuntiList();
}

function keyupEvent(event) {
  if (event.key === "Backspace" && document.punti.length > 0) {
    document.punti.pop();
    negativeid();
    renderizzaCurva(document.punti);
  }
}

function mouseMoveCallback(event) {
  event.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  document.mousePos = [x, y];

  if (document.puntocorrente !== -1) {
    const currentPoint = document.punti[document.puntocorrente];
    currentPoint.x = document.mousePos[0];
    currentPoint.y = document.mousePos[1];
    renderizzaCurva(document.punti);
    return;
  }
}

function mouseUpCallback(event) {
  event.preventDefault();
  if (document.puntocorrente !== -1) {
    document.puntocorrente = -1;
    renderizzaCurva(document.punti);
    return;
  }
}

function mouseDownCallback(event) {
  if (event.buttons !== 1) return;
  event.preventDefault();

  for (let i = 0; i < document.punti.length; i++) {
    const punto = document.punti[i];
    const d = distance([punto.x, punto.y], document.mousePos);

    if (d <= 20) {
      document.puntocorrente = i;
      canvasCtx.beginPath();
      canvasCtx.strokeStyle = "rgb(255, 0, 0)";
      canvasCtx.rect(punto.x - 5, punto.y - 5, 10, 10);
      canvasCtx.stroke();
      canvasCtx.strokeStyle = "rgb(255, 255, 255)";
      return;
    }
  }
}

function distance(p1, p2) {
  return Math.sqrt(Math.pow(p1[0] - p2[0], 2) + Math.pow(p1[1] - p2[1], 2));
}

function rightClick(event) {
  event.preventDefault();
  if (isNaN(document.mousePos[0]) || isNaN(document.mousePos[1])) return false;
  if (event.target != canvas) return false;
  addPoint(document.mousePos, document.id);
  document.id++;
  renderizzaCurva(document.punti);
  return false;
}

function congiungi(punti, color = '#00000') {
  canvasCtx.beginPath();
  canvasCtx.strokeStyle = color;
  for (let i = 0; i < punti.length - 1; i++) {
    canvasCtx.moveTo(punti[i].x, punti[i].y);
    canvasCtx.lineTo(punti[i + 1].x, punti[i + 1].y);
  }
  canvasCtx.stroke();
}

function disegnaBezier(punti, t) {
  if (punti.length === 1) {
    return punti[0];
  }

  const nuoviPunti = [];
  for (let i = 0; i < punti.length - 1; i++) {
    const xlerp = lerp(punti[i].x, punti[i + 1].x, t);
    const ylerp = lerp(punti[i].y, punti[i + 1].y, t);
    nuoviPunti.push({ x: xlerp, y: ylerp });
  }

  return disegnaBezier(nuoviPunti, t);
}

function renderizzaCurva(punti) {
  canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
  updatePuntiList();
  if (punti.length === 0) return;

  canvasCtx.strokeStyle = tlineColorPicker.value;
  congiungi(punti);
  canvasCtx.strokeStyle = "rgb(255, 255, 255)";

  index = 0;
  punti.forEach((punto) => {
    canvasCtx.beginPath();
    if (document.puntocorrente != index) { canvasCtx.strokeStyle = punto.color }
    else { canvasCtx.strokeStyle = tlineColorPicker.value }
    canvasCtx.rect(punto.x - 5, punto.y - 5, 10, 10);
    canvasCtx.stroke();

    canvasCtx.strokeStyle = "rgb(255, 255, 255)";
    canvasCtx.font = "14px Arial";
    canvasCtx.strokeText("P" + punto.id, punto.x + 10, punto.y + 5);
    index++;
  });

  if (punti.length <= 1) return;

  const puntiBezier = [];
  for (let t = 0; t <= 1; t += STEP) {
    const puntoCurva = disegnaBezier(punti, t);
    puntiBezier.push(puntoCurva);
  }
  congiungi(puntiBezier, lineColorPicker.value);
}

async function save() {
  data = "";

  if (document.punti.length > 0) {
    if (document.project === null) return;
    document.punti.forEach((punto) => {
      data += punto.id + " ";
      data += punto.x + " ";
      data += punto.y + ", ";
    })
    data = data.substring(0, data.length - 2);
  }
  console.log('Data richiesta /save');
  console.log(data);

  await fetch(`http://127.0.0.1:5050/project?file=${document.project}`, {
    method: "POST",
    body: data,
  });
}

async function getProject(nomeProgetto) {
  data = await fetch(`http://127.0.0.1:5050/project?file=${nomeProgetto}`, {
    method: "GET"
  }).then((response) => response.text())
    .then((data) => {
      document.punti = []
      listaPunti = data.split("\n");
      listaPunti.forEach((punto) => {
        if (punto !== "") {
          dati = punto.split(" ");
          addPoint([Number(dati[1]), Number(dati[2])], dati[0])
        }
      })
      document.id = Number(document.id) + 1;
      renderizzaCurva(document.punti);
    })
}

async function getProjectList() {
  await fetch(`http://127.0.0.1:5050/list`, {
    method: "GET"
  }).then((response) => response.text())
    .then((data) => {
      console.log(data)
      ProjectList = data.split("\n");
      ProjectList.forEach((progetto) => {
        confirmProject(projectName = progetto);
      })
    })
}

setInterval(save, 5000);

pointColorPicker = document.getElementById('pointPicker')
pointColorPicker.value = '#ffffff'
lineColorPicker = document.getElementById('linePicker')
lineColorPicker.value = '#ffffff'
tlineColorPicker = document.getElementById('tlinePicker')
tlineColorPicker.value = '#ffffff'

pointColorPicker.onchange = () => {
  const color = pointColorPicker.value;
  pointColorPicker.style.background = color;
};

lineColorPicker.onchange = () => {
  const color = lineColorPicker.value;
  lineColorPicker.style.background = color;
  renderizzaCurva(document.punti);
};

tlineColorPicker.onchange = () => {
  const color = tlineColorPicker.value;
  tlineColorPicker.style.background = color;
  renderizzaCurva(document.punti);
};

if (document.project === null) {
  canvasCtx.strokeStyle = "rgb(255, 255, 255)";
  canvasCtx.font = "40px Inconsolata";
  canvasCtx.fillStyle = "#bbbbbb";
  text = "Please Choose a Project"

  textSize = canvasCtx.measureText(text)
  textSize.height = 40

  console.log(canvas.width / 2 - textSize.width / 2, canvas.height / 2 - textSize.height / 2)
  canvasCtx.fillText(text, canvas.width / 2 - textSize.width / 2, canvas.height / 2 - textSize.height / 2);
}


window.addEventListener('resize', resizeCallback, true);
addEventListener("mousemove", mouseMoveCallback);
addEventListener("mousedown", mouseDownCallback);
addEventListener("mouseup", mouseUpCallback);
addEventListener("keyup", keyupEvent);
addEventListener("click", deleteButton);
window.oncontextmenu = rightClick;
getProjectList();
