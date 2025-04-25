// Audio Context for Visualizer and Equalizer
let audioContext;
let analyser;
let source;
let equalizerNodes = {};

// DOM Elements
const audio = new Audio();
const playPauseBtn = document.getElementById('play-pause');
const playBtnIcon = playPauseBtn.querySelector('i');
const nextBtn = document.getElementById('next');
const prevBtn = document.getElementById('prev');
const volumeSlider = document.getElementById('volume');
const volumeIcon = document.getElementById('volume-icon');
const progressSlider = document.getElementById('progress');
const currentTimeEl = document.getElementById('current-time');
const durationEl = document.getElementById('duration');
const playlistEl = document.getElementById('playlist');
const albumArt = document.getElementById('album-cover');
const trackNameEl = document.getElementById('track-name');
const artistNameEl = document.getElementById('artist-name');
const shuffleBtn = document.getElementById('shuffle');
const repeatBtn = document.getElementById('repeat');
const searchInput = document.getElementById('search');
const addTrackBtn = document.getElementById('add-track');
const addTrackModal = document.getElementById('add-track-modal');
const addTrackForm = document.getElementById('add-track-form');
const eqToggleBtn = document.getElementById('eq-toggle');
const eqModal = document.getElementById('eq-modal');
const infoBtn = document.getElementById('info');
const infoModal = document.getElementById('info-modal');
const trackInfoContent = document.getElementById('track-info-content');
const playOverlay = document.getElementById('play-overlay');
const visualizationBars = document.querySelectorAll('.visualization .bar');

// Close buttons for all modals
const closeButtons = document.querySelectorAll('.close');

// App State
let tracks = [
    { 
        name: 'Sunny Day', 
        artist: 'Happy Band',
        src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        cover: 'https://via.placeholder.com/150/F5C45E/102E50?text=Sunny+Day',
        duration: '3:15',
        album: 'Happy Days',
        year: '2023',
        genre: 'Pop'
    },
    { 
        name: 'Evening Jazz', 
        artist: 'Cool Quartet',
        src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
        cover: 'https://via.placeholder.com/150/102E50/F5C45E?text=Evening+Jazz',
        duration: '4:20',
        album: 'Jazz Nights',
        year: '2022',
        genre: 'Jazz'
    },
    { 
        name: 'Rock Anthem', 
        artist: 'The Rockers',
        src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
        cover: 'https://via.placeholder.com/150/BE3D2A/FFFFFF?text=Rock+Anthem',
        duration: '3:45',
        album: 'Rock Forever',
        year: '2023',
        genre: 'Rock'
    },
    { 
        name: 'Chill Vibes', 
        artist: 'Lofi Producer',
        src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
        cover: 'https://via.placeholder.com/150/E78B48/FFFFFF?text=Chill+Vibes',
        duration: '2:55',
        album: 'Lofi Beats',
        year: '2024',
        genre: 'Lofi'
    },
    { 
        name: 'Classical Morning', 
        artist: 'Symphony Orchestra',
        src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
        cover: 'https://via.placeholder.com/150/f8f8f8/102E50?text=Classical',
        duration: '5:30',
        album: 'Morning Classics',
        year: '2021',
        genre: 'Classical'
    }
];
let currentTrackIndex = 0;
let isPlaying = false;
let isShuffleActive = false;
let repeatMode = 'none'; // none, one, all
let originalTracks = [...tracks]; // Store the original order for shuffle

// Initialize Local Storage
function initializeLocalStorage() {
    // Load tracks from local storage if available
    if (localStorage.getItem('musicPlayerTracks')) {
        tracks = JSON.parse(localStorage.getItem('musicPlayerTracks'));
        originalTracks = [...tracks];
    } else {
        // Save initial tracks to local storage
        localStorage.setItem('musicPlayerTracks', JSON.stringify(tracks));
    }
}
        // Initialize Local Storage
function initializeLocalStorage() {
    // Load tracks from local storage if available
    if (localStorage.getItem('musicPlayerTracks')) {
        tracks = JSON.parse(localStorage.getItem('musicPlayerTracks'));
        originalTracks = [...tracks];
    } else {
        // Save initial tracks to local storage
        localStorage.setItem('musicPlayerTracks', JSON.stringify(tracks));
    }

    // Load volume from local storage
    if (localStorage.getItem('musicPlayerVolume')) {
        const savedVolume = parseFloat(localStorage.getItem('musicPlayerVolume'));
        volumeSlider.value = savedVolume;
        audio.volume = savedVolume;
        updateVolumeIcon(savedVolume);
    }
}

// Track Loading and Playback Functions
function loadTrack(index) {
    if (index < 0) index = tracks.length - 1;
    if (index >= tracks.length) index = 0;
    
    currentTrackIndex = index;
    const track = tracks[index];
    
    audio.src = track.src;
    albumArt.src = track.cover || 'https://via.placeholder.com/150/102E50/FFFFFF?text=Music';
    trackNameEl.textContent = track.name;
    artistNameEl.textContent = track.artist || 'Unknown Artist';
    
    updatePlaylistUI();
    
    // Reset progress
    progressSlider.value = 0;
    currentTimeEl.textContent = '0:00';
    
    // If audio context exists, reconnect it
    if (audioContext && audioContext.state === 'running') {
        connectAudioNodes();
    }

    updateTrackInfo();
}

function playTrack() {
    if (!audioContext) {
        initAudioContext();
    } else if (audioContext.state === 'suspended') {
        audioContext.resume();
    }
    
    audio.play().catch(error => {
        console.error('Error playing track:', error);
    });
    
    isPlaying = true;
    playBtnIcon.className = 'fas fa-pause';
    startVisualization();
}

function pauseTrack() {
    audio.pause();
    isPlaying = false;
    playBtnIcon.className = 'fas fa-play';
    stopVisualization();
}

function togglePlayPause() {
    if (isPlaying) {
        pauseTrack();
    } else {
        playTrack();
    }
}

function nextTrack() {
    let nextIndex;
    
    if (isShuffleActive) {
        nextIndex = getRandomTrackIndex();
    } else {
        nextIndex = (currentTrackIndex + 1) % tracks.length;
    }
    
    loadTrack(nextIndex);
    playTrack();
}

function prevTrack() {
    let prevIndex;
    
    if (isShuffleActive) {
        prevIndex = getRandomTrackIndex();
    } else {
        // If current time is more than 2 seconds, restart current track
        if (audio.currentTime > 2) {
            audio.currentTime = 0;
            return;
        }
        
        prevIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
    }
    
    loadTrack(prevIndex);
    playTrack();
}

function getRandomTrackIndex() {
    if (tracks.length <= 1) return 0;
    
    // Get random index that is not the current track
    let randomIndex;
    do {
        randomIndex = Math.floor(Math.random() * tracks.length);
    } while (randomIndex === currentTrackIndex);
    
    return randomIndex;
}

// UI Update Functions
function updatePlaylistUI() {
    playlistEl.innerHTML = '';
    
    tracks.forEach((track, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div class="track-info-primary">
                <div class="track-name-container">
                    ${track.name}
                    <span class="track-artist">- ${track.artist || 'Unknown'}</span>
                </div>
            </div>
            <div class="track-actions">
                <button class="track-play" data-index="${index}" title="Play">
                    <i class="fas fa-play"></i>
                </button>
                <button class="track-remove" data-index="${index}" title="Remove">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        if (index === currentTrackIndex) {
            li.classList.add('active');
        }
        
        // Play track on click
        li.querySelector('.track-info-primary').addEventListener('click', () => {
            loadTrack(index);
            playTrack();
        });
        
        // Play button
        li.querySelector('.track-play').addEventListener('click', (e) => {
            e.stopPropagation();
            loadTrack(index);
            playTrack();
        });
        
        // Remove track button
        li.querySelector('.track-remove').addEventListener('click', (e) => {
            e.stopPropagation();
            removeTrack(index);
        });
        
        playlistEl.appendChild(li);
    });
}

function updateVolumeIcon(volume) {
    if (volume === 0) {
        volumeIcon.className = 'fas fa-volume-mute';
    } else if (volume < 0.5) {
        volumeIcon.className = 'fas fa-volume-down';
    } else {
        volumeIcon.className = 'fas fa-volume-up';
    }
}

function updateTrackInfo() {
    const track = tracks[currentTrackIndex];
    
    if (!track) {
        trackInfoContent.innerHTML = '<p>No track selected.</p>';
        return;
    }
    
    trackInfoContent.innerHTML = `
        <table>
            <tr>
                <th>Title</th>
                <td>${track.name}</td>
            </tr>
            <tr>
                <th>Artist</th>
                <td>${track.artist || 'Unknown'}</td>
            </tr>
            <tr>
                <th>Album</th>
                <td>${track.album || 'Unknown'}</td>
            </tr>
            <tr>
                <th>Year</th>
                <td>${track.year || 'Unknown'}</td>
            </tr>
            <tr>
                <th>Genre</th>
                <td>${track.genre || 'Unknown'}</td>
            </tr>
            <tr>
                <th>Duration</th>
                <td>${track.duration || formatTime(audio.duration) || 'Unknown'}</td>
            </tr>
        </table>
    `;
}

function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    
    const minutes = Math.floor(seconds / 60);
    seconds = Math.floor(seconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

// Track Management Functions
function addTrack(name, artist, src, cover) {
    const newTrack = {
        name,
        artist: artist || 'Unknown Artist',
        src,
        cover: cover || `https://via.placeholder.com/150/102E50/FFFFFF?text=${encodeURIComponent(name)}`,
        duration: '0:00',
        album: 'Unknown',
        year: new Date().getFullYear().toString(),
        genre: 'Unknown'
    };
    
    tracks.push(newTrack);
    originalTracks = [...tracks];
    
    // Save to local storage
    localStorage.setItem('musicPlayerTracks', JSON.stringify(tracks));
    
    updatePlaylistUI();
}

function removeTrack(index) {
    if (index === currentTrackIndex) {
        // If removing currently playing track
        if (tracks.length === 1) {
            // Last track remaining
            tracks.splice(index, 1);
            audio.src = '';
            pauseTrack();
            trackNameEl.textContent = 'No track available';
            artistNameEl.textContent = '';
            albumArt.src = 'https://via.placeholder.com/150';
        } else {
            // Play next track after removal
            const wasPlaying = isPlaying;
            tracks.splice(index, 1);
            currentTrackIndex = index >= tracks.length ? 0 : index;
            loadTrack(currentTrackIndex);
            if (wasPlaying) playTrack();
        }
    } else {
        // Adjust currentTrackIndex if the removed track is before it
        if (index < currentTrackIndex) {
            currentTrackIndex--;
        }
        tracks.splice(index, 1);
    }
    
    originalTracks = [...tracks];
    
    // Save to local storage
    localStorage.setItem('musicPlayerTracks', JSON.stringify(tracks));
    
    updatePlaylistUI();
}

function filterPlaylist(query) {
    const filteredItems = document.querySelectorAll('#playlist li');
    
    query = query.toLowerCase();
    
    filteredItems.forEach(item => {
        const trackName = item.querySelector('.track-name-container').textContent.toLowerCase();
        
        if (trackName.includes(query)) {
            item.style.display = '';
        } else {
            item.style.display = 'none';
        }
    });
}

// Shuffle and Repeat Functions
function toggleShuffle() {
    isShuffleActive = !isShuffleActive;
    
    if (isShuffleActive) {
        shuffleBtn.classList.add('active-control');
    } else {
        shuffleBtn.classList.remove('active-control');
    }
}

function toggleRepeat() {
    if (repeatMode === 'none') {
        repeatMode = 'one';
        repeatBtn.classList.add('active-control');
        repeatBtn.innerHTML = '<i class="fas fa-repeat-1"></i>';
    } else if (repeatMode === 'one') {
        repeatMode = 'all';
        repeatBtn.classList.add('active-control');
        repeatBtn.innerHTML = '<i class="fas fa-redo"></i>';
    } else {
        repeatMode = 'none';
        repeatBtn.classList.remove('active-control');
        repeatBtn.innerHTML = '<i class="fas fa-redo"></i>';
    }
}

// Audio Context and Visualization
function initAudioContext() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    
    connectAudioNodes();
    setupEqualizer();
}

function connectAudioNodes() {
    // Disconnect any existing nodes
    if (source) {
        source.disconnect();
    }
    
    // Create new source
    source = audioContext.createMediaElementSource(audio);
    
    // Connect source -> equalizer -> analyser -> destination
    let lastNode = source;
    
    // Connect all equalizer nodes
    for (const freq in equalizerNodes) {
        lastNode.connect(equalizerNodes[freq]);
        lastNode = equalizerNodes[freq];
    }
    
    lastNode.connect(analyser);
    analyser.connect(audioContext.destination);
}

function setupEqualizer() {
    const frequencies = [60, 170, 310, 600, 1000, 3000, 6000, 12000];
    
    frequencies.forEach(freq => {
        const eq = audioContext.createBiquadFilter();
        eq.type = 'peaking';
        eq.frequency.value = freq;
        eq.Q.value = 1;
        eq.gain.value = 0;
        
        equalizerNodes[freq] = eq;
    });
}

function updateEqualizer(band, value) {
    if (equalizerNodes[band]) {
        equalizerNodes[band].gain.value = value;
    }
}

function applyEqPreset(preset) {
    const presets = {
        flat: [0, 0, 0, 0, 0, 0, 0, 0],
        rock: [4, 2, -3, -6, -2, 2, 6, 7],
        pop: [-1, 3, 5, 3, -2, -3, -2, -1],
        jazz: [3, 2, -3, -5, 1, 5, 6, 5],
        classical: [5, 4, 1, 0, -2, 0, 3, 7]
    };
    
    const selectedPreset = presets[preset] || presets.flat;
    const eqBands = document.querySelectorAll('.eq-band');
    
    eqBands.forEach((band, index) => {
        const value = selectedPreset[index];
        band.value = value;
        updateEqualizer(Number(band.dataset.band), value);
    });
}

// Visualization Functions
function startVisualization() {
    if (!analyser) return;
    
    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    function animate() {
        if (!isPlaying) return;
        
        analyser.getByteFrequencyData(dataArray);
        
        // Use selected frequency bands for visualization
        const bands = [2, 5, 8, 12, 16];
        
        bands.forEach((band, index) => {
            const value = dataArray[band];
            const height = Math.max(3, value / 4); // Scale down to reasonable height
            visualizationBars[index].style.height = `${height}px`;
        });
        
        requestAnimationFrame(animate);
    }
    
    animate();
}

function stopVisualization() {
    visualizationBars.forEach(bar => {
        bar.style.height = '3px';
    });
}

// Event Listeners
function setupEventListeners() {
    // Player Controls
    playPauseBtn.addEventListener('click', togglePlayPause);
    nextBtn.addEventListener('click', nextTrack);
    prevBtn.addEventListener('click', prevTrack);
    shuffleBtn.addEventListener('click', toggleShuffle);
    repeatBtn.addEventListener('click', toggleRepeat);
    
    // Volume Control
    volumeSlider.addEventListener('input', () => {
        const volume = parseFloat(volumeSlider.value);
        audio.volume = volume;
        updateVolumeIcon(volume);
        localStorage.setItem('musicPlayerVolume', volume);
    });
    
    volumeIcon.addEventListener('click', () => {
        if (audio.volume > 0) {
            volumeSlider.dataset.lastVolume = audio.volume;
            volumeSlider.value = 0;
            audio.volume = 0;
            updateVolumeIcon(0);
        } else {
            const lastVolume = parseFloat(volumeSlider.dataset.lastVolume || 1);
            volumeSlider.value = lastVolume;
            audio.volume = lastVolume;
            updateVolumeIcon(lastVolume);
        }
        localStorage.setItem('musicPlayerVolume', audio.volume);
    });
    
    // Progress Control
    progressSlider.addEventListener('input', () => {
        const seekTime = (progressSlider.value / 100) * audio.duration;
        audio.currentTime = seekTime;
    });
    
    // Audio Events
    audio.addEventListener('timeupdate', () => {
        const { currentTime, duration } = audio;
        if (!isNaN(duration)) {
            progressSlider.value = (currentTime / duration) * 100 || 0;
            currentTimeEl.textContent = formatTime(currentTime);
            durationEl.textContent = formatTime(duration);
        }
    });
    
    audio.addEventListener('loadedmetadata', () => {
        durationEl.textContent = formatTime(audio.duration);
    });
    
    audio.addEventListener('ended', () => {
        if (repeatMode === 'one') {
            audio.currentTime = 0;
            playTrack();
        } else if (repeatMode === 'all' || isShuffleActive || currentTrackIndex < tracks.length - 1) {
            nextTrack();
        } else {
            // Last track ended and no repeat
            pauseTrack();
            audio.currentTime = 0;
        }
    });
    
    // Album Art Click
    playOverlay.addEventListener('click', togglePlayPause);
    
    // Search Input
    searchInput.addEventListener('input', () => {
        filterPlaylist(searchInput.value);
    });
    
    // Add Track
    addTrackBtn.addEventListener('click', () => {
        addTrackModal.style.display = 'flex';
    });
    
    addTrackForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const title = document.getElementById('track-title').value;
        const artist = document.getElementById('track-artist').value;
        const url = document.getElementById('track-url').value;
        
        addTrack(title, artist, url);
        addTrackModal.style.display = 'none';
        addTrackForm.reset();
    });
    
    // Equalizer
    eqToggleBtn.addEventListener('click', () => {
        if (!audioContext) {
            initAudioContext();
        }
        eqModal.style.display = 'flex';
    });
    
    document.querySelectorAll('.eq-band').forEach(band => {
        band.addEventListener('input', () => {
            updateEqualizer(Number(band.dataset.band), Number(band.value));
        });
    });
    
    document.querySelectorAll('.preset').forEach(presetBtn => {
        presetBtn.addEventListener('click', () => {
            applyEqPreset(presetBtn.dataset.preset);
        });
    });
    
    // Track Info
    infoBtn.addEventListener('click', () => {
        updateTrackInfo();
        infoModal.style.display = 'flex';
    });
    
    // Close Modals
    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
        });
    });
    
    window.addEventListener('click', (e) => {
        document.querySelectorAll('.modal').forEach(modal => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'INPUT') return; // Don't trigger when typing in inputs
        
        switch (e.code) {
            case 'Space':
                e.preventDefault();
                togglePlayPause();
                break;
            case 'ArrowRight':
                nextTrack();
                break;
            case 'ArrowLeft':
                prevTrack();
                break;
            case 'ArrowUp':
                audio.volume = Math.min(1, audio.volume + 0.1);
                volumeSlider.value = audio.volume;
                updateVolumeIcon(audio.volume);
                break;
            case 'ArrowDown':
                audio.volume = Math.max(0, audio.volume - 0.1);
                volumeSlider.value = audio.volume;
                updateVolumeIcon(audio.volume);
                break;
        }
    });
}

// App Initialization
function initApp() {
    initializeLocalStorage();
    setupEventListeners();
    loadTrack(currentTrackIndex);
    
    // Visual preload animation for bars
    visualizationBars.forEach((bar, index) => {
        setTimeout(() => {
            bar.style.height = '15px';
            setTimeout(() => { bar.style.height = '3px'; }, 300);
        }, index * 100);
    });
}

// Start the app
initApp();