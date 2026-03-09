// -----------------------------
// GLOBAL STATE
// -----------------------------

let clips = [];
let transcript = "";
let keywords = [];

let recognition = null;

// -----------------------------
// CLIP UPLOAD
// -----------------------------

const clipInput = document.getElementById("clipInput");
const clipList = document.getElementById("clipList");
const prevVideo = document.getElementById("prevVideo");
const captionPreview = document.getElementById("captionPreview");

clipInput.addEventListener("change", handleUpload);

function handleUpload(e) {

  const files = Array.from(e.target.files);

  files.forEach(file => {

    if (clips.length >= 5) {
      alert("Maximum 5 clips");
      return;
    }

    const url = URL.createObjectURL(file);

    clips.push({
      file,
      url
    });

  });

  renderClipList();
  loadPreview();
}

// -----------------------------
// CLIP LIST UI
// -----------------------------

function renderClipList() {

  clipList.innerHTML = "";

  clips.forEach((clip, index) => {

    const div = document.createElement("div");

    div.style.padding = "6px";
    div.style.fontSize = "13px";
    div.style.borderBottom = "1px solid #222";

    div.innerHTML = `
      ${clip.file.name}
      <button onclick="removeClip(${index})">✖</button>
    `;

    clipList.appendChild(div);

  });

}

function removeClip(i) {

  URL.revokeObjectURL(clips[i].url);

  clips.splice(i,1);

  renderClipList();
}

// -----------------------------
// PREVIEW PLAYER
// -----------------------------

function loadPreview(){

  if(!clips.length) return;

  prevVideo.src = clips[0].url;

}

function playPreview(){

  prevVideo.play();

  startSpeechDetection();

}

function pausePreview(){

  prevVideo.pause();

}

// -----------------------------
// SPEECH DETECTION
// -----------------------------

function startSpeechDetection(){

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if(!SpeechRecognition){

    console.warn("SpeechRecognition not supported");

    return;

  }

  recognition = new SpeechRecognition();

  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.maxAlternatives = 1;

  recognition.onresult = function(event){

    let finalText = "";

    for(let i = event.resultIndex; i < event.results.length; i++){

      if(event.results[i].isFinal){

        finalText += event.results[i][0].transcript;

      }

    }

    if(finalText){

      transcript += " " + finalText;

      captionPreview.innerText = finalText;

      extractKeywords(finalText);

      fetchBrollImages();

    }

  };

  recognition.start();

}

// -----------------------------
// KEYWORD EXTRACTION
// -----------------------------

function extractKeywords(text){

  text = text.replace(/[.,!?]/g," ").toLowerCase();

  const words = text.split(/\s+/);

  const stopWords = [
    "the","is","a","and","to","of","in","it","that",
    "this","with","for","on","you","i","we"
  ];

  keywords = words.filter(w => {

    return w.length > 3 && !stopWords.includes(w);

  });

}

// -----------------------------
// B-ROLL IMAGE FETCH
// -----------------------------

async function fetchBrollImages(){

  if(!keywords.length) return;

  const topic = keywords[0];

  const grid = document.getElementById("brollGrid");

  grid.innerHTML = "";

  try{

    const res = await fetch(
      `https://api.pexels.com/v1/search?query=${topic}&per_page=6`,
      {
        headers:{
          Authorization:"563492ad6f91700001000001"
        }
      }
    );

    const data = await res.json();

    data.photos.forEach(photo => {

      const img = document.createElement("img");

      img.src = photo.src.medium;

      img.onclick = () => insertBroll(photo.src.medium);

      grid.appendChild(img);

    });

  }
  catch(err){

    console.warn("Image fetch failed",err);

  }

}

// -----------------------------
// INSERT B-ROLL
// -----------------------------

function insertBroll(url){

  const img = document.createElement("img");

  img.src = url;

  img.style.position = "absolute";
  img.style.top = "0";
  img.style.left = "0";
  img.style.width = "100%";
  img.style.height = "100%";
  img.style.objectFit = "cover";

  document.querySelector(".preview").appendChild(img);

  setTimeout(()=>{

    img.remove();

  },3000);

}

// -----------------------------
// AUTO EDIT STORY
// -----------------------------

function autoEdit(){

  if(!clips.length){

    alert("Upload a clip first");

    return;

  }

  playPreview();

}

// -----------------------------
// EXPORT (placeholder)
// -----------------------------

function startRender(){

  alert("Render engine can be connected here.");

}
