class TimerAndRecorder {
    constructor() {
        this.timerInterval = null;
        this.timeLeft = 5 * 60; // 5 minutes in seconds
        this.totalTime = 5 * 60;
        this.isRunning = false;
        
        this.mediaRecorder = null;
        this.audioChunks = [];
        this.audioBlob = null;
        this.audioUrl = null;
        this.isRecording = false;
        this.recordingStartTime = null;
        this.recordingInterval = null;
        
        this.audioContext = null;
        this.analyser = null;
        this.microphone = null;
        this.canvas = null;
        this.canvasContext = null;
        
        this.initializeElements();
        this.setupEventListeners();
        this.initializeAudioVisualizer();
    }
    
    initializeElements() {
        // Timer elements
        this.minutesDisplay = document.getElementById('minutes');
        this.secondsDisplay = document.getElementById('seconds');
        this.startTimerBtn = document.getElementById('start-timer');
        this.pauseTimerBtn = document.getElementById('pause-timer');
        this.resetTimerBtn = document.getElementById('reset-timer');
        this.progressBar = document.getElementById('progress');
        
        // Audio recording elements
        this.startRecordingBtn = document.getElementById('start-recording');
        this.stopRecordingBtn = document.getElementById('stop-recording');
        this.playRecordingBtn = document.getElementById('play-recording');
        this.exportRecordingBtn = document.getElementById('export-recording');
        this.recordingIndicator = document.getElementById('recording-indicator');
        this.recordingText = document.getElementById('recording-text');
        this.recordingDuration = document.getElementById('recording-duration');
        this.fileSize = document.getElementById('file-size');
        this.canvas = document.getElementById('audioCanvas');
        this.canvasContext = this.canvas.getContext('2d');
        
        // Export modal elements
        this.exportModal = document.getElementById('exportModal');
        this.fileNameInput = document.getElementById('fileName');
        this.fileFormatSelect = document.getElementById('fileFormat');
        this.filePreview = document.getElementById('filePreview');
        this.closeModalBtn = document.getElementById('closeModal');
        this.cancelExportBtn = document.getElementById('cancelExport');
        this.confirmExportBtn = document.getElementById('confirmExport');
    }
    
    setupEventListeners() {
        // Timer event listeners
        this.startTimerBtn.addEventListener('click', () => this.startTimer());
        this.pauseTimerBtn.addEventListener('click', () => this.pauseTimer());
        this.resetTimerBtn.addEventListener('click', () => this.resetTimer());
        
        // Audio recording event listeners
        this.startRecordingBtn.addEventListener('click', () => this.startRecording());
        this.stopRecordingBtn.addEventListener('click', () => this.stopRecording());
        this.playRecordingBtn.addEventListener('click', () => this.playRecording());
        this.exportRecordingBtn.addEventListener('click', () => this.showExportModal());
        
        // Export modal event listeners
        this.closeModalBtn.addEventListener('click', () => this.hideExportModal());
        this.cancelExportBtn.addEventListener('click', () => this.hideExportModal());
        this.confirmExportBtn.addEventListener('click', () => this.exportAudio());
        this.fileNameInput.addEventListener('input', () => this.updateFilePreview());
        this.fileFormatSelect.addEventListener('change', () => this.updateFilePreview());
        
        // Close modal when clicking outside
        this.exportModal.addEventListener('click', (e) => {
            if (e.target === this.exportModal) {
                this.hideExportModal();
            }
        });
    }
    
    // Timer functionality
    startTimer() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.startTimerBtn.disabled = true;
            this.pauseTimerBtn.disabled = false;
            
            this.timerInterval = setInterval(() => {
                this.timeLeft--;
                this.updateTimerDisplay();
                this.updateProgressBar();
                
                if (this.timeLeft <= 0) {
                    this.timerComplete();
                }
            }, 1000);
        }
    }
    
    pauseTimer() {
        if (this.isRunning) {
            this.isRunning = false;
            this.startTimerBtn.disabled = false;
            this.pauseTimerBtn.disabled = true;
            clearInterval(this.timerInterval);
        }
    }
    
    resetTimer() {
        this.isRunning = false;
        this.timeLeft = this.totalTime;
        this.startTimerBtn.disabled = false;
        this.pauseTimerBtn.disabled = true;
        clearInterval(this.timerInterval);
        this.updateTimerDisplay();
        this.updateProgressBar();
    }
    
    updateTimerDisplay() {
        const minutes = Math.floor(this.timeLeft / 60);
        const seconds = this.timeLeft % 60;
        this.minutesDisplay.textContent = minutes.toString().padStart(2, '0');
        this.secondsDisplay.textContent = seconds.toString().padStart(2, '0');
    }
    
    updateProgressBar() {
        const progress = ((this.totalTime - this.timeLeft) / this.totalTime) * 100;
        this.progressBar.style.width = `${progress}%`;
    }
    
    timerComplete() {
        this.isRunning = false;
        this.startTimerBtn.disabled = false;
        this.pauseTimerBtn.disabled = true;
        clearInterval(this.timerInterval);
        
        // Play notification sound
        this.playNotificationSound();
        
        // Show alert
        alert('Timer completed! 5 minutes have passed.');
    }
    
    playNotificationSound() {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    }
    
    // Audio recording functionality
    async startRecording() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            
            this.mediaRecorder = new MediaRecorder(stream);
            this.audioChunks = [];
            this.recordingStartTime = Date.now();
            
            this.mediaRecorder.ondataavailable = (event) => {
                this.audioChunks.push(event.data);
            };
            
            this.mediaRecorder.onstop = () => {
                this.audioBlob = new Blob(this.audioChunks, { type: 'audio/wav' });
                this.audioUrl = URL.createObjectURL(this.audioBlob);
                this.playRecordingBtn.disabled = false;
                this.updateFileSize();
            };
            
            this.mediaRecorder.start();
            this.isRecording = true;
            
            this.startRecordingBtn.disabled = true;
            this.stopRecordingBtn.disabled = false;
            this.recordingIndicator.classList.remove('hidden');
            this.recordingText.textContent = 'Recording...';
            
            // Start recording duration counter
            this.recordingInterval = setInterval(() => {
                this.updateRecordingDuration();
            }, 1000);
            
            // Start audio visualization
            this.startAudioVisualization(stream);
            
        } catch (error) {
            console.error('Error accessing microphone:', error);
            alert('Error accessing microphone. Please check permissions.');
        }
    }
    
    stopRecording() {
        if (this.mediaRecorder && this.isRecording) {
            this.mediaRecorder.stop();
            this.isRecording = false;
            
            this.startRecordingBtn.disabled = false;
            this.stopRecordingBtn.disabled = true;
            this.exportRecordingBtn.disabled = false;
            this.recordingIndicator.classList.add('hidden');
            this.recordingText.textContent = 'Ready';
            
            clearInterval(this.recordingInterval);
            this.stopAudioVisualization();
        }
    }
    
    playRecording() {
        if (this.audioUrl) {
            const audio = new Audio(this.audioUrl);
            audio.play();
        }
    }
    
    updateRecordingDuration() {
        if (this.recordingStartTime) {
            const elapsed = Math.floor((Date.now() - this.recordingStartTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            this.recordingDuration.textContent = 
                `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
    }
    
    updateFileSize() {
        if (this.audioBlob) {
            const sizeInKB = Math.round(this.audioBlob.size / 1024);
            this.fileSize.textContent = `${sizeInKB} KB`;
        }
    }
    
    // Audio visualization
    initializeAudioVisualizer() {
        this.canvas = document.getElementById('audioCanvas');
        this.canvasContext = this.canvas.getContext('2d');
    }
    
    async     startAudioVisualization(stream) {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.analyser = this.audioContext.createAnalyser();
            this.microphone = this.audioContext.createMediaStreamSource(stream);
            
            this.microphone.connect(this.analyser);
            this.analyser.fftSize = 128;
            
            const bufferLength = this.analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            
            const draw = () => {
                if (!this.isRecording) return;
                
                requestAnimationFrame(draw);
                
                this.analyser.getByteFrequencyData(dataArray);
                
                this.canvasContext.fillStyle = '#fafafa';
                this.canvasContext.fillRect(0, 0, this.canvas.width, this.canvas.height);
                
                const barWidth = this.canvas.width / bufferLength;
                let x = 0;
                
                for (let i = 0; i < bufferLength; i++) {
                    const barHeight = (dataArray[i] / 255) * this.canvas.height;
                    
                this.canvasContext.fillStyle = '#8B5CF6';
                this.canvasContext.fillRect(x, this.canvas.height - barHeight, barWidth - 1, barHeight);
                    
                    x += barWidth;
                }
            };
            
            draw();
        } catch (error) {
            console.error('Error setting up audio visualization:', error);
        }
    }
    
    stopAudioVisualization() {
        if (this.audioContext) {
            this.audioContext.close();
        }
        this.canvasContext.fillStyle = '#fafafa';
        this.canvasContext.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
    
    // Export functionality
    showExportModal() {
        if (!this.audioBlob) {
            alert('No recording available to export');
            return;
        }
        
        // Generate default filename with current date and time
        const now = new Date();
        const dateStr = now.toISOString().slice(0, 19).replace(/[:-]/g, '-').replace('T', '_');
        const defaultName = `recording_${dateStr}`;
        
        this.fileNameInput.value = defaultName;
        this.updateFilePreview();
        this.exportModal.classList.remove('hidden');
    }
    
    hideExportModal() {
        this.exportModal.classList.add('hidden');
    }
    
    updateFilePreview() {
        const fileName = this.fileNameInput.value.trim() || 'recording';
        const format = this.fileFormatSelect.value;
        const preview = `${fileName}.${format}`;
        this.filePreview.textContent = preview;
    }
    
    exportAudio() {
        if (!this.audioBlob) {
            alert('No recording available to export');
            return;
        }
        
        const fileName = this.fileNameInput.value.trim() || 'recording';
        const format = this.fileFormatSelect.value;
        const fullFileName = `${fileName}.${format}`;
        
        // Create a new blob with the selected format
        let exportBlob = this.audioBlob;
        
        // For now, we'll export as WAV since that's what we record
        // In a real implementation, you might want to convert to other formats
        if (format !== 'wav') {
            alert(`Note: Audio will be exported as WAV format. ${format.toUpperCase()} conversion requires additional libraries.`);
        }
        
        // Create download link
        const url = URL.createObjectURL(exportBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fullFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.hideExportModal();
        
        // Show success message
        this.showNotification('Audio exported successfully!', 'success');
    }
    
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Style the notification
        Object.assign(notification.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '12px 20px',
            borderRadius: '8px',
            color: 'white',
            fontWeight: '500',
            zIndex: '1001',
            animation: 'slideInRight 0.3s ease-out',
            maxWidth: '300px',
            wordWrap: 'break-word'
        });
        
        if (type === 'success') {
            notification.style.background = 'var(--primary-color)';
        } else if (type === 'error') {
            notification.style.background = '#ef4444';
        } else {
            notification.style.background = '#6b7280';
        }
        
        document.body.appendChild(notification);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease-in';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new TimerAndRecorder();
});
