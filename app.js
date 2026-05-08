let audio = document.getElementById("audio");
let fileInput = document.getElementById("fileInput");
let list = document.getElementById("list");

let tracks = [];
let current = 0;
let shuffle = false;
let repeat = false;

const DB_NAME = "musicDB";

fileInput.addEventListener("change", async (e) => {
  const files = Array.from(e.target.files);

  for (let file of files) {
    await saveFile(file);
  }

  await loadTracks();
});

function openDB() {
  return new Promise((res, rej) => {
    let request = indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      let db = request.result;
      db.createObjectStore("tracks", { keyPath: "id", autoIncrement: true });
    };

    request.onsuccess = () => res(request.result);
    request.onerror = () => rej();
  });
}

async function saveFile(file) {
  let db = await openDB();
  let tx = db.transaction("tracks", "readwrite");
  let store = tx.objectStore("tracks");

  store.add({
    name: file.name,
    blob: file
  });
}

async function loadTracks() {
  let db = await openDB();
  let tx = db.transaction("tracks", "readonly");
  let store = tx.objectStore("tracks");

  let request = store.getAll();

  request.onsuccess = () => {
    tracks = request.result.map(t => ({
      name: t.name,
      url: URL.createObjectURL(t.blob)
    }));

    render();
    if (tracks.length) playTrack(0);
  };
}

function render() {
  list.innerHTML = "";

  tracks.forEach((t, i) => {
    let li = document.createElement("li");
    li.textContent = t.name;
    if (i === current) li.classList.add("active");

    li.onclick = () => playTrack(i);
    list.appendChild(li);
  });
}

function playTrack(i) {
  current = i;
  audio.src = tracks[i].url;
  audio.play();
  render();
}

function play() { audio.play(); }
function pause() { audio.pause(); }

function next() {
  if (!tracks.length) return;

  if (shuffle) {
    current = Math.floor(Math.random() * tracks.length);
  } else {
    current = (current + 1) % tracks.length;
  }

  playTrack(current);
}

function prev() {
  current = (current - 1 + tracks.length) % tracks.length;
  playTrack(current);
}

function toggleShuffle() {
  shuffle = !shuffle;
  alert("Shuffle: " + shuffle);
}

function toggleRepeat() {
  repeat = !repeat;
  alert("Repeat: " + repeat);
}

function clearAll() {
  indexedDB.deleteDatabase(DB_NAME);
  location.reload();
}

audio.addEventListener("ended", () => {
  if (repeat) playTrack(current);
  else next();
});

loadTracks();
