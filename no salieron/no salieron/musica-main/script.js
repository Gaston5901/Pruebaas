const progress = document.getElementById("progress");
const song = document.getElementById("song");
const controlIcon = document.getElementById("controlIcon");
const playPauseButton = document.querySelector(".play-pause-btn");
const forwardButton = document.querySelector(".controls button.forward");
const backwardButton = document.querySelector(".controls button.backward");
const songName = document.querySelector(".music-player h1");
const artistName = document.querySelector(".music-player p");
const timerText = document.getElementById("timerText");

const songs = [
  {
    title: "Spanish Girl",
    name: "Julio Iglesias",
    source: "love.mp3",
  },
  {
    title: "Sueña lindo, Corazón",
    name: "Macario Martínez",
    source: "musica.mp3",
  },
  {
    title: "Sabes",
    name: "Reik",
    source: "musica.mp3",
  },
  {
    title: "Something",
    name: "The Beatles",
    source: "musica.mp3",
  },
  {
    title: "How Deep Is Your Love",
    name: "Bee Gees",
    source: "musica.mp3",
  },
  {
    title: "Labios Rotos",
    name: "Zoé",
    source: "musica.mp3",
  },
  {
    title: "Lover",
    name: "Taylor Swift ft. Shawn Mendes",
    source: "musica.mp3",
  },
];

let currentSongIndex = 0;
let unlockTimers = [];

function updateSongInfo() {
  if (isSongUnlocked(currentSongIndex)) {
    song.src = songs[currentSongIndex].source;
    songName.textContent = songs[currentSongIndex].title;
    artistName.textContent = songs[currentSongIndex].name;
    document.querySelectorAll('.swiper-slide')[currentSongIndex].querySelector('.song-info').textContent = songs[currentSongIndex].name;
  } else {
    song.src = "";
    songName.textContent = "Locked";
    artistName.textContent = "Locked";
    document.querySelectorAll('.swiper-slide')[currentSongIndex].querySelector('.song-info').textContent = "Locked";
  }
  updateTimerDisplay();
}

song.addEventListener("timeupdate", function () {
  if (!song.paused) {
    progress.value = song.currentTime;
  }
});

song.addEventListener("loadedmetadata", function () {
  progress.max = song.duration;
  progress.value = song.currentTime;
});

function pauseSong() {
  song.pause();
  controlIcon.classList.remove("fa-pause");
  controlIcon.classList.add("fa-play");
}

function playSong() {
  if (isSongUnlocked(currentSongIndex)) {
    song.play();
    controlIcon.classList.add("fa-pause");
    controlIcon.classList.remove("fa-play");
  }
}

function playPause() {
  if (song.paused) {
    playSong();
  } else {
    pauseSong();
  }
}

playPauseButton.addEventListener("click", playPause);

progress.addEventListener("input", function () {
  song.currentTime = progress.value;
});

progress.addEventListener("change", function () {
  playSong();
});

forwardButton.addEventListener("click", function () {
  currentSongIndex = (currentSongIndex + 1) % songs.length;
  updateSongInfo();
  playPause();
});

backwardButton.addEventListener("click", function () {
  currentSongIndex = (currentSongIndex - 1 + songs.length) % songs.length;
  updateSongInfo();
  playPause();
});

function updateTimerDisplay() {
  const now = new Date().getTime();
  const unlockTime = localStorage.getItem(`unlockTime${currentSongIndex}`);
  if (unlockTime && now < unlockTime) {
    const remainingTime = unlockTime - now;
    
    const days = Math.floor(remainingTime / (1000 * 60 * 60 * 24));
    const hours = Math.floor((remainingTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((remainingTime % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((remainingTime % (1000 * 60)) / 1000);
    
    timerText.textContent = `Tiempo restante: ${days}d ${hours}h ${minutes}m ${seconds}s`;
    setTimeout(updateTimerDisplay, 1000); 
  } else {
    timerText.textContent = "Unlocked";
    document.querySelectorAll('.swiper-slide')[currentSongIndex].classList.remove('locked');
    document.querySelectorAll('.swiper-slide')[currentSongIndex].querySelector('.song-info').textContent = songs[currentSongIndex].name;
  }
}

function startUnlockTimer(index, duration) {
  const now = new Date().getTime();
  const unlockTime = now + duration * 60 * 60 * 1000; 
  localStorage.setItem(`unlockTime${index}`, unlockTime);
  if (index === currentSongIndex) {
    updateTimerDisplay(); 
  }
}

function initializeUnlockTimers() {
  const durations = [0, 72, 167, 224, 306, 371, 432]; 
  for (let i = 1; i < songs.length; i++) {
    if (!localStorage.getItem(`unlockTime${i}`)) {
      const previousUnlockTime = localStorage.getItem(`unlockTime${i - 1}`);
      if (previousUnlockTime) {
        const unlockTime = new Date(parseInt(previousUnlockTime, 10)).getTime();
        const duration = durations[i];
        startUnlockTimer(i, unlockTime + duration - new Date().getTime());
      }
    }
  }
}

function initializeSongs() {
  const durations = [0, 72, 167, 224, 306, 371, 432];
  for (let i = 1; i < songs.length; i++) {
    const unlockTime = localStorage.getItem(`unlockTime${i}`);
    if (unlockTime) {
      const now = new Date().getTime();
      if (now > unlockTime) {
        unlockTimers[i] = null;
        document.querySelectorAll('.swiper-slide')[i].classList.remove('locked');
        document.querySelectorAll('.swiper-slide')[i].querySelector('.song-info').textContent = songs[i].name;
      } else {
        unlockTimers[i] = unlockTime - now;
        document.querySelectorAll('.swiper-slide')[i].classList.add('locked');
      }
    } else {
      startUnlockTimer(i, durations[i]);
      document.querySelectorAll('.swiper-slide')[i].classList.add('locked');
    }
  }
  updateTimerDisplay(); 
}

function isSongUnlocked(index) {
  const unlockTime = localStorage.getItem(`unlockTime${index}`);
  return !unlockTime || new Date().getTime() > unlockTime;
}

//localStorage.clear();

document.querySelectorAll('.swiper-slide')[0].classList.remove('locked');

initializeUnlockTimers();
initializeSongs();
updateSongInfo();

var swiper = new Swiper(".swiper", {
  effect: "coverflow",
  centeredSlides: true,
  initialSlide: 0,
  slidesPerView: "auto",
  allowTouchMove: false,
  spaceBetween: 40,
  coverflowEffect: {
    rotate: 25,
    stretch: 0,
    depth: 50,
    modifier: 1,
    slideShadows: false,
  },
  navigation: {
    nextEl: ".forward",
    prevEl: ".backward",
  },
});

document.querySelectorAll('.swiper-slide')[0].classList.remove('locked');