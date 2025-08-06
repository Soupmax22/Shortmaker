const form = document.getElementById("quoteForm");
const bgVideoInput = document.getElementById("bgVideoInput");
const bgMusicInput = document.getElementById("bgMusicInput");
const quotesTextArea = document.getElementById("quotes");
const progress = document.getElementById("progress");
const downloadLink = document.getElementById("downloadLink");

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const quotes = quotesTextArea.value.trim().split("\n").filter(q => q.trim());
  if (!bgVideoInput.files[0]) return alert("Please upload a background video.");

  for (let i = 0; i < quotes.length; i++) {
    const quote = quotes[i];
    progress.innerText = `Generating video ${i + 1} of ${quotes.length}...`;

    const blob = await generateVideo(quote);
    const url = URL.createObjectURL(blob);
    downloadLink.href = url;
    downloadLink.download = "short_" + (i + 1) + ".webm";
    downloadLink.style.display = "inline-block";
    downloadLink.click();
    URL.revokeObjectURL(url);
  }

  progress.innerText = "All shorts generated!";
});

async function generateVideo(quote) {
  return new Promise(async (resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext("2d");

    const video = document.createElement("video");
    video.src = URL.createObjectURL(bgVideoInput.files[0]);
    video.muted = true;
    video.crossOrigin = "anonymous";

    const music = bgMusicInput.files[0]
      ? new Audio(URL.createObjectURL(bgMusicInput.files[0]))
      : null;

    const tts = new SpeechSynthesisUtterance(quote);
    tts.lang = "en";
    const audioStream = new MediaStream();
    const dest = new AudioContext().createMediaStreamDestination();
    if (music) {
      const audioCtx = new AudioContext();
      const musicSource = audioCtx.createMediaElementSource(music);
      musicSource.connect(dest);
    }
    speechSynthesis.speak(tts);

    video.play();
    if (music) music.play();

    const stream = canvas.captureStream(30);
    if (music) stream.addTrack(dest.stream.getAudioTracks()[0]);

    const recorder = new MediaRecorder(stream);
    const chunks = [];
    recorder.ondataavailable = (e) => chunks.push(e.data);
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      resolve(blob);
    };

    recorder.start();

    const duration = 5; // seconds
    const startTime = performance.now();

    function renderFrame() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
      ctx.fillRect(0, canvas.height / 2 - 100, canvas.width, 200);
      ctx.fillStyle = "white";
      ctx.font = "bold 48px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(quote, canvas.width / 2, canvas.height / 2 + 20);
      if (performance.now() - startTime < duration * 1000) {
        requestAnimationFrame(renderFrame);
      } else {
        recorder.stop();
      }
    }

    renderFrame();
  });
}
