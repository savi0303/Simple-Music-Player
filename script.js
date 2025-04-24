const audio = new Audio();
const playPauseBtn = document.getElementById('play-pause');
const nextBtn = document.getElementById('next');
const volumeSlider = document.getElementById('volume');
const progressSlider = document.getElementById('progress');
const trackName = document.getElementById('track-name');
const trackTime = document.getElementById('track-time');
const playlist = document.getElementById('playlist');

let tracks = [
    { name: 'Sample Track 1', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3' },
    { name: 'Sample Track 2', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3' },
    { name: 'Sample Track 3', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3' },
    { name: 'Sample Track 4', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3' },
    { name: 'Sample Track 5', src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3' }
];
let currentTrackIndex = 0;
let isPlaying = false;

function loadTrack(index) {
    audio.src = tracks[index].src;
    trackName.textContent = tracks[index].name;
    currentTrackIndex = index;
    updatePlaylistUI();
}

function updatePlaylistUI() {
    playlist.innerHTML = '';
    tracks.forEach((track, index) => {
        const li = document.createElement('li');
        li.textContent = track.name;
        if (index === currentTrackIndex) {
            li.classList.add('active');
        }
        li.addEventListener('click', () => {
            loadTrack(index);
            playTrack();
        });
        playlist.appendChild(li);
    });
}

function playTrack() {
    audio.play();
    isPlaying = true;
    playPauseBtn.textContent = 'Pause';
}

function pauseTrack() {
    audio.pause();
    isPlaying = false;
    playPauseBtn.textContent = 'Play';
}

function togglePlayPause() {
    if (isPlaying) {
        pauseTrack();
    } else {
        playTrack();
    }
}

function nextTrack() {
    currentTrackIndex = (currentTrackIndex + 1) % tracks.length;
    loadTrack(currentTrackIndex);
    playTrack();
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    seconds = Math.floor(seconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

audio.addEventListener('timeupdate', () => {
    const { currentTime, duration } = audio;
    progressSlider.value = (currentTime / duration) * 100 || 0;
    trackTime.textContent = `${formatTime(currentTime)} / ${formatTime(duration || 0)}`;
});

progressSlider.addEventListener('input', () => {
    audio.currentTime = (progressSlider.value / 100) * audio.duration;
});

playPauseBtn.addEventListener('click', togglePlayPause);
nextBtn.addEventListener('click', nextTrack);
volumeSlider.addEventListener('input', () => {
    audio.volume = volumeSlider.value;
});

audio.addEventListener('ended', nextTrack);

// Initialize
loadTrack(currentTrackIndex);
updatePlaylistUI();