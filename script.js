const startBtn = document.getElementById('start');
const downloadLink = document.getElementById('download');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const textInput = document.getElementById('text');
const image = new Image();
image.src = 'image.jpg'; // Your static image file

image.onload = () => {
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
};

startBtn.addEventListener('click', async () => {
  const text = textInput.value.trim();
  if (!text) return alert('Enter some text first.');

  // 1. Draw the image on canvas
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

  // 2. Capture canvas stream (video)
  const canvasStream = canvas.captureStream(30);

  // 3. Create audio using SpeechSynthesis + capture via Web Audio
  const utterance = new SpeechSynthesisUtterance(text);
  const audioCtx = new AudioContext();
  const dest = audioCtx.createMediaStreamDestination();
  const synth = window.speechSynthesis;

  const source = audioCtx.createMediaStreamSource(dest.stream);
  const combinedStream = new MediaStream([...canvasStream.getVideoTracks(), ...dest.stream.getAudioTracks()]);

  // Speak the text (this plays out loud and routes to dest)
  speechSynthesis.speak(utterance);

  // 4. Record the combined video + audio
  const recorder = new MediaRecorder(combinedStream, { mimeType: 'video/webm' });
  const chunks = [];

  recorder.ondataavailable = (e) => chunks.push(e.data);
  recorder.onstop = () => {
    const blob = new Blob(chunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    downloadLink.href = url;
    downloadLink.download = 'output_video.webm';
    downloadLink.style.display = 'inline';
    downloadLink.textContent = 'Download Video';
  };

  recorder.start();

  // Stop recording after speech ends
  utterance.onend = () => {
    recorder.stop();
  };
});
