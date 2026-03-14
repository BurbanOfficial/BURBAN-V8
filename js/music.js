// music.js
const tracks = [
  "https://burbanofficial.github.io/BURBAN-V8/music/Baby Dont Forget.mp3",
  "https://burbanofficial.github.io/BURBAN-V8/music/Birdie in the Sand.mp3",
  "https://burbanofficial.github.io/BURBAN-V8/music/Way You Are.mp3"
];

let currentTrack = localStorage.getItem('musicTrack');
if(currentTrack === null) {
  currentTrack = Math.floor(Math.random() * tracks.length);
  localStorage.setItem('musicTrack', currentTrack);
} else {
  currentTrack = parseInt(currentTrack);
}

const audio = document.getElementById('bg-music');
audio.src = tracks[currentTrack];

const savedTime = localStorage.getItem('musicTime');
if(savedTime) audio.currentTime = savedTime;

audio.play();

audio.addEventListener('ended', () => {
  let nextTrack;
  do {
    nextTrack = Math.floor(Math.random() * tracks.length);
  } while(nextTrack === currentTrack);
  currentTrack = nextTrack;
  localStorage.setItem('musicTrack', currentTrack);
  audio.src = tracks[currentTrack];
  audio.play();
});

window.addEventListener('beforeunload', () => {
  localStorage.setItem('musicTime', audio.currentTime);
});