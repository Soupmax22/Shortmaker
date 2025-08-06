const startBtn = document.getElementById('start');
const downloadLink = document.getElementById('download');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const textInput = document.getElementById('text');

const image = new Image();
image.src = 'image.jpg'; // Add image.jpg to your repo

image.onload = () => {
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
};

startBtn.addEventListener('click', async () => {
  const text = textInput.value.trim();
  if (!text) return alert('Please enter some text.');

  // Draw the image again in case canvas was cleared
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

  // 1. Create audio using SpeechSynthesis + Web Audio API
  const utterance = new SpeechSynthesisUtterance(text);
  const audioCtx = new AudioContext();
  const dest = audioCtx.createMediaStreamDestination();

  const synthSource = audioCtx.createMediaStreamSource(dest.stream);
  window.speechSynthesis.speak(utterance);

  // Connect SpeechSynthesis to Web Audio (hack)
  const synth = window.speechSynthesis;
  const voices = synth.getVoices();
  utterance.voice = voices.find(v => v.lang.startsWith('en')) || voices[0];

  // Create a fake audio stream by playing into destination
  const utteranceAudio = new SpeechSynthesisUtterance(text);
  utteranceAudio.voice = utterance.voice;
  utteranceAudio.volume = 1;
  utteranceAudio.rate = 1;
  utteranceAudio.pitch = 1;

  // Workaround: record via microphone instead
  const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });

  // 2. Capture canvas as video stream
  const canvasStream = canvas.captureStream(30);

  // 3. Combine audio and video streams
  const combinedStream = new MediaStream([
    ...canvasStream.getVideoTracks(),
    ...audioStream.getAudioTracks()
  ]);

  const recorder = new MediaRecorder(combinedStream, { mimeType: 'video/webm' });
  const chunks = [];

  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  recorder.onstop = () => {
    const blob = new Blob(chunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    downloadLink.href = url;
    downloadLink.download = 'output_video.webm';
    downloadLink.style.display = 'inline';
    downloadLink.textContent = 'Download Video';
  };

  recorder.start();

  // Play the speech aloud and stop recording after ~5 seconds
  speechSynthesis.speak(utteranceAudio);
  setTimeout(() => {
    recorder.stop();
  }, 5000); // Adjust to match speech length
});
