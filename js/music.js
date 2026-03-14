// Récupérer les éléments audio et modale
const audio = document.getElementById('bg-music');
const modal = document.getElementById('music-modal');
const sessionKey = 'musicChoice';
const tracks = [
  "https://burbanofficial.github.io/BURBAN-V8/music/Baby Dont Forget.mp3",
  "https://burbanofficial.github.io/BURBAN-V8/music/Birdie in the Sand.mp3",
  "https://burbanofficial.github.io/BURBAN-V8/music/Way You Are.mp3"
];

// Vérifier si l'utilisateur a déjà fait un choix sur la musique (une seule fois par session)
if(!sessionStorage.getItem(sessionKey)) {
    modal.style.display = 'flex'; // Afficher la modale si l'utilisateur n'a pas encore fait son choix
} else {
    if(sessionStorage.getItem(sessionKey) === 'yes') startMusic(); // Démarrer la musique si "Oui" a été choisi
}

// Fonction pour démarrer la musique
function startMusic() {
    let currentTrack = localStorage.getItem('musicTrack');
    if(currentTrack === null) {
        currentTrack = Math.floor(Math.random() * tracks.length); // Choisir une musique aléatoire
        localStorage.setItem('musicTrack', currentTrack);
    } else {
        currentTrack = parseInt(currentTrack);
    }

    audio.src = tracks[currentTrack]; // Lier la source audio à la musique choisie

    const savedTime = localStorage.getItem('musicTime');
    if(savedTime) audio.currentTime = savedTime; // Reprendre la position si elle a été sauvegardée

    audio.play().catch(err => {
        console.log("Lecture audio refusée : ", err); // Gérer les erreurs de lecture
    });

    audio.addEventListener('ended', () => {
        let nextTrack;
        do { nextTrack = Math.floor(Math.random() * tracks.length); } while(nextTrack === currentTrack);
        currentTrack = nextTrack;
        localStorage.setItem('musicTrack', currentTrack);
        audio.src = tracks[currentTrack]; // Passer à la musique suivante
        audio.play();
    });

    window.addEventListener('beforeunload', () => {
        localStorage.setItem('musicTime', audio.currentTime); // Sauvegarder la position de la musique avant la fermeture de la page
    });
}

// Gestion des choix dans la modale
document.getElementById('music-yes').addEventListener('click', () => {
    sessionStorage.setItem(sessionKey, 'yes'); // Sauvegarder le choix dans la session
    modal.style.display = 'none'; // Cacher la modale
    startMusic(); // Démarrer la musique
});

document.getElementById('music-no').addEventListener('click', () => {
    sessionStorage.setItem(sessionKey, 'no'); // Sauvegarder le choix dans la session
    modal.style.display = 'none'; // Cacher la modale
    audio.pause(); // Stopper la musique
});
