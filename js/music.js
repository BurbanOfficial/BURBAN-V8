// music.js
const audio = document.getElementById('bg-music');
const modal = document.getElementById('music-modal');
const sessionKey = 'musicChoice';
const tracks = [
  "https://burbanofficial.github.io/BURBAN-V8/music/Baby Dont Forget.mp3",
  "https://burbanofficial.github.io/BURBAN-V8/music/Birdie in the Sand.mp3",
  "https://burbanofficial.github.io/BURBAN-V8/music/Way You Are.mp3"
];

// Afficher la modale si pas encore de choix
if(!sessionStorage.getItem(sessionKey)) {
    modal.style.display = 'flex';
} else {
    if(sessionStorage.getItem(sessionKey) === 'yes') startMusic();
}

// Fonction pour lancer la musique
function startMusic() {
    let currentTrack = localStorage.getItem('musicTrack');
    if(currentTrack === null) {
        currentTrack = Math.floor(Math.random() * tracks.length);
        localStorage.setItem('musicTrack', currentTrack);
    } else {
        currentTrack = parseInt(currentTrack);
    }

    audio.src = tracks[currentTrack];

    const savedTime = localStorage.getItem('musicTime');
    if(savedTime) audio.currentTime = savedTime;

    // Lancer la lecture **au clic utilisateur** uniquement
    audio.play().catch(err => {
        console.log("Lecture refusée par le navigateur : ", err);
    });

    audio.addEventListener('ended', () => {
        let nextTrack;
        do { nextTrack = Math.floor(Math.random() * tracks.length); } while(nextTrack === currentTrack);
        currentTrack = nextTrack;
        localStorage.setItem('musicTrack', currentTrack);
        audio.src = tracks[currentTrack];
        audio.play();
    });

    window.addEventListener('beforeunload', () => {
        localStorage.setItem('musicTime', audio.currentTime);
    });
}

// Boutons modale
document.getElementById('music-yes').addEventListener('click', () => {
    sessionStorage.setItem(sessionKey, 'yes');
    modal.style.display = 'none';
    startMusic(); // 🔑 Lancement ici seulement
});

document.getElementById('music-no').addEventListener('click', () => {
    sessionStorage.setItem(sessionKey, 'no');
    modal.style.display = 'none';
    audio.pause();
});
