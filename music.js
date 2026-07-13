// Shared Music Engine for Birthday Celebration
// Handles persistent playback, fade transitions, and the elegant glassmorphic floating UI.

class BirthdayMusicEngine {
    constructor() {
        this.songUrl = 'unakkenna_venum.mp3';
        this.storageKeyTime = 'birthday_music_time';
        this.storageKeyPlaying = 'birthday_music_playing';
        this.audio = null;
        this.container = null;
        this.visualizerBars = [];
        this.noteInterval = null;
        
        // Bind methods
        this.togglePlay = this.togglePlay.bind(this);
        this.onPageUnload = this.onPageUnload.bind(this);
        
        this.init();
    }

    init() {
        // Create audio element
        this.audio = new Audio(this.songUrl);
        this.audio.loop = true;
        this.audio.volume = 0; // Start at 0 for fade-in

        // Restore playback state
        const savedTime = localStorage.getItem(this.storageKeyTime);
        const shouldPlay = localStorage.getItem(this.storageKeyPlaying) === 'true';

        if (savedTime) {
            this.audio.currentTime = parseFloat(savedTime);
        }

        // Setup page unload listener to capture time exactly
        window.addEventListener('beforeunload', this.onPageUnload);
        
        // Periodic auto-save to survive sudden crashes/navs
        setInterval(() => {
            if (this.audio && !this.audio.paused) {
                localStorage.setItem(this.storageKeyTime, this.audio.currentTime.toString());
            }
        }, 300);

        // Auto-initialize player UI once DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.createPlayerUI(shouldPlay));
        } else {
            this.createPlayerUI(shouldPlay);
        }
    }

    createPlayerUI(shouldPlay) {
        // Add font styling
        if (!document.getElementById('google-fonts-music')) {
            const link = document.createElement('link');
            link.id = 'google-fonts-music';
            link.rel = 'stylesheet';
            link.href = 'https://fonts.googleapis.com/css2?family=Quicksand:wght@500;700&display=swap';
            document.head.appendChild(link);
        }

        // Add player CSS styles
        const styles = `
            .music-controller {
                position: fixed;
                bottom: 24px;
                left: 24px;
                z-index: 9999;
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 10px 16px;
                background: rgba(255, 255, 255, 0.15);
                backdrop-filter: blur(12px);
                -webkit-backdrop-filter: blur(12px);
                border: 1px solid rgba(255, 255, 255, 0.25);
                border-radius: 50px;
                box-shadow: 0 8px 32px 0 rgba(255, 105, 180, 0.15),
                            inset 0 0 10px rgba(255, 255, 255, 0.2);
                cursor: pointer;
                user-select: none;
                transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                font-family: 'Quicksand', sans-serif;
            }

            .music-controller:hover {
                transform: scale(1.05) translateY(-2px);
                background: rgba(255, 255, 255, 0.25);
                box-shadow: 0 12px 40px 0 rgba(255, 105, 180, 0.3),
                            inset 0 0 15px rgba(255, 255, 255, 0.4);
            }

            .music-btn {
                width: 36px;
                height: 36px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: linear-gradient(135deg, #ff758c 0%, #ff7eb3 100%);
                border-radius: 50%;
                color: white;
                box-shadow: 0 4px 15px rgba(255, 118, 140, 0.4);
                transition: transform 0.3s ease;
            }

            .music-controller:hover .music-btn {
                transform: rotate(15deg);
            }

            .music-info {
                display: flex;
                flex-direction: column;
                color: white;
            }

            .music-title {
                font-size: 11px;
                font-weight: 700;
                letter-spacing: 0.5px;
                text-transform: uppercase;
                opacity: 0.7;
                text-shadow: 0 1px 2px rgba(0,0,0,0.1);
            }

            .music-status {
                font-size: 13px;
                font-weight: 700;
                text-shadow: 0 1px 2px rgba(0,0,0,0.1);
            }

            .music-visualizer {
                display: flex;
                align-items: flex-end;
                gap: 3px;
                height: 20px;
                width: 30px;
                margin-left: 4px;
            }

            .vis-bar {
                width: 3px;
                height: 3px;
                background-color: #ffffff;
                border-radius: 3px;
                transition: height 0.1s ease;
            }

            .floating-note {
                position: absolute;
                font-size: 14px;
                color: rgba(255, 255, 255, 0.8);
                pointer-events: none;
                z-index: 9998;
                animation: floatUpNote 2.5s ease-out forwards;
            }

            @keyframes floatUpNote {
                0% {
                    transform: translate(0, 0) scale(0.6) rotate(0deg);
                    opacity: 0;
                }
                15% {
                    opacity: 1;
                }
                100% {
                    transform: translate(var(--x-end), -60px) scale(1.2) rotate(var(--rot-end));
                    opacity: 0;
                }
            }

            /* Responsive tweaks */
            @media (max-width: 480px) {
                .music-controller {
                    bottom: 16px;
                    left: 16px;
                    padding: 8px 12px;
                }
                .music-btn {
                    width: 30px;
                    height: 30px;
                }
                .music-info {
                    display: none; /* Hide text on super small screens to save space */
                }
            }
        `;

        const styleSheet = document.createElement("style");
        styleSheet.innerText = styles;
        document.head.appendChild(styleSheet);

        // Build HTML structure
        const controller = document.createElement('div');
        controller.className = 'music-controller';
        controller.id = 'birthdayMusicController';
        
        controller.innerHTML = `
            <div class="music-btn" id="musicBtnIcon">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path id="playSvgPath" d="M8 5v14l11-7z"/>
                </svg>
            </div>
            <div class="music-info">
                <span class="music-title">Happy Birthday To My chinni</span>
                <span class="music-status" id="musicStatusText">Paused</span>
            </div>
            <div class="music-visualizer" id="musicVisualizer">
                <div class="vis-bar"></div>
                <div class="vis-bar"></div>
                <div class="vis-bar"></div>
                <div class="vis-bar"></div>
                <div class="vis-bar"></div>
            </div>
        `;

        document.body.appendChild(controller);
        this.container = controller;
        this.visualizerBars = controller.querySelectorAll('.vis-bar');
        
        // Add click listener
        controller.addEventListener('click', this.togglePlay);

        // Resume audio if it should play according to state
        if (shouldPlay) {
            // Note: browser autoplay policies may block this on the very first page load.
            // That's why on index.html we'll hook the start action to a click.
            const startPlaying = () => {
                this.audio.play()
                    .then(() => {
                        this.setPlayingState(true);
                        this.fadeIn();
                    })
                    .catch(err => {
                        console.log("Autoplay was prevented. User gesture needed to start playing.", err);
                        this.setPlayingState(false);
                    });
                document.removeEventListener('click', startPlaying);
                document.removeEventListener('keydown', startPlaying);
            };
            
            // Try playing immediately
            this.audio.play()
                .then(() => {
                    this.setPlayingState(true);
                    this.fadeIn();
                })
                .catch(() => {
                    // Fallback to user interaction anywhere on the page
                    document.addEventListener('click', startPlaying);
                    document.addEventListener('keydown', startPlaying);
                });
        }
    }

    setPlayingState(isPlaying) {
        const svgPath = document.getElementById('playSvgPath');
        const statusText = document.getElementById('musicStatusText');
        
        if (isPlaying) {
            localStorage.setItem(this.storageKeyPlaying, 'true');
            if (svgPath) {
                // Change SVG to Pause icon
                svgPath.setAttribute('d', 'M6 19h4V5H6v14zm8-14v14h4V5h-4z');
            }
            if (statusText) statusText.innerText = 'Playing';
            this.startVisualizer();
            this.startNotes();
        } else {
            localStorage.setItem(this.storageKeyPlaying, 'false');
            if (svgPath) {
                // Change SVG to Play icon
                svgPath.setAttribute('d', 'M8 5v14l11-7z');
            }
            if (statusText) statusText.innerText = 'Paused';
            this.stopVisualizer();
            this.stopNotes();
        }
    }

    fadeIn() {
        if (!this.audio) return;
        this.audio.volume = 0;
        let vol = 0;
        const interval = setInterval(() => {
            if (vol < 0.6) {
                vol += 0.05;
                this.audio.volume = Math.min(vol, 0.6);
            } else {
                clearInterval(interval);
            }
        }, 50);
    }

    fadeOut(onComplete) {
        if (!this.audio) {
            if (onComplete) onComplete();
            return;
        }
        let vol = this.audio.volume;
        const interval = setInterval(() => {
            if (vol > 0.05) {
                vol -= 0.05;
                this.audio.volume = Math.max(vol, 0);
            } else {
                this.audio.volume = 0;
                clearInterval(interval);
                if (onComplete) onComplete();
            }
        }, 30);
    }

    togglePlay() {
        if (!this.audio) return;

        if (this.audio.paused) {
            this.audio.play()
                .then(() => {
                    this.setPlayingState(true);
                    this.fadeIn();
                })
                .catch(err => console.error("Error playing audio:", err));
        } else {
            this.fadeOut(() => {
                this.audio.pause();
                this.setPlayingState(false);
            });
        }
    }

    startVisualizer() {
        this.visualizerInterval = setInterval(() => {
            this.visualizerBars.forEach(bar => {
                const height = Math.random() * 16 + 4; // Height between 4px and 20px
                bar.style.height = `${height}px`;
            });
        }, 100);
    }

    stopVisualizer() {
        clearInterval(this.visualizerInterval);
        this.visualizerBars.forEach(bar => {
            bar.style.height = '3px';
        });
    }

    startNotes() {
        const notes = ['🎵', '🎶', '✨', '💖', '🎈'];
        this.noteInterval = setInterval(() => {
            if (!this.container) return;
            
            const note = document.createElement('div');
            note.className = 'floating-note';
            note.innerText = notes[Math.floor(Math.random() * notes.length)];
            
            // Random horizontal drift and rotation
            const xDrift = (Math.random() - 0.5) * 60;
            const rot = (Math.random() - 0.5) * 90;
            
            note.style.setProperty('--x-end', `${xDrift}px`);
            note.style.setProperty('--rot-end', `${rot}deg`);
            
            // Random initial placement near button
            const rect = this.container.getBoundingClientRect();
            note.style.left = `${rect.left + 16 + Math.random() * 8}px`;
            note.style.top = `${rect.top - 10}px`;
            
            document.body.appendChild(note);
            
            // Clean up node
            setTimeout(() => {
                note.remove();
            }, 2500);
        }, 800);
    }

    stopNotes() {
        clearInterval(this.noteInterval);
    }

    onPageUnload() {
        if (this.audio) {
            localStorage.setItem(this.storageKeyTime, this.audio.currentTime.toString());
            localStorage.setItem(this.storageKeyPlaying, (!this.audio.paused).toString());
        }
    }
}

// Auto-instantiate the engine so it loads on every importing page automatically
window.birthdayMusic = new BirthdayMusicEngine();
