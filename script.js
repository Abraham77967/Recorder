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
        
        // Notes functionality
        this.notes = JSON.parse(localStorage.getItem('notes')) || [];
        this.currentNoteId = null;
        
        this.initializeElements();
        this.setupEventListeners();
        this.initializeAudioVisualizer();
        this.initializeNotes();
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
        
        // Notes elements
        this.notesList = document.getElementById('notesList');
        this.noteEditor = document.getElementById('noteEditor');
        this.noteTitle = document.getElementById('noteTitle');
        this.noteContent = document.getElementById('noteContent');
        this.newNoteBtn = document.getElementById('new-note');
        this.exportNotesBtn = document.getElementById('export-notes');
        this.clearNotesBtn = document.getElementById('clear-notes');
        this.saveNoteBtn = document.getElementById('save-note');
        this.cancelNoteBtn = document.getElementById('cancel-note');
        
        // Notes export modal elements
        this.notesExportModal = document.getElementById('notesExportModal');
        this.closeNotesModalBtn = document.getElementById('closeNotesModal');
        this.notesFileName = document.getElementById('notesFileName');
        this.notesFileFormat = document.getElementById('notesFileFormat');
        this.notesFilePreview = document.getElementById('notesFilePreview');
        this.notesPreview = document.getElementById('notesPreview');
        this.cancelNotesExportBtn = document.getElementById('cancelNotesExport');
        this.confirmNotesExportBtn = document.getElementById('confirmNotesExport');
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
        
        // Notes event listeners
        this.newNoteBtn.addEventListener('click', () => this.createNewNote());
        this.exportNotesBtn.addEventListener('click', () => this.openNotesExportModal());
        this.clearNotesBtn.addEventListener('click', () => this.clearAllNotes());
        this.saveNoteBtn.addEventListener('click', () => this.saveNote());
        this.cancelNoteBtn.addEventListener('click', () => this.cancelNote());
        
        // Notes export modal event listeners
        this.closeNotesModalBtn.addEventListener('click', () => this.closeNotesExportModal());
        this.cancelNotesExportBtn.addEventListener('click', () => this.closeNotesExportModal());
        this.confirmNotesExportBtn.addEventListener('click', () => this.exportNotes());
        this.notesFileName.addEventListener('input', () => this.updateNotesFilePreview());
        this.notesFileFormat.addEventListener('change', () => this.updateNotesFilePreview());
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
    
    // Notes functionality
    initializeNotes() {
        this.renderNotes();
    }
    
    createNewNote() {
        this.currentNoteId = null;
        this.noteTitle.value = '';
        this.noteContent.value = '';
        this.noteEditor.classList.remove('hidden');
        this.notesList.classList.add('hidden');
        this.noteTitle.focus();
    }
    
    editNote(noteId) {
        const note = this.notes.find(n => n.id === noteId);
        if (note) {
            this.currentNoteId = noteId;
            this.noteTitle.value = note.title;
            this.noteContent.value = note.content;
            this.noteEditor.classList.remove('hidden');
            this.notesList.classList.add('hidden');
            this.noteTitle.focus();
        }
    }
    
    saveNote() {
        const title = this.noteTitle.value.trim();
        const content = this.noteContent.value.trim();
        
        console.log('Saving note - Title:', title, 'Content:', content);
        
        if (!title && !content) {
            this.showNotification('Please enter a title or content for the note.', 'error');
            return;
        }
        
        const now = new Date();
        const noteData = {
            id: this.currentNoteId || Date.now().toString(),
            title: title || 'Untitled Note',
            content: content,
            createdAt: this.currentNoteId ? this.notes.find(n => n.id === this.currentNoteId).createdAt : now.toISOString(),
            updatedAt: now.toISOString()
        };
        
        if (this.currentNoteId) {
            // Update existing note
            const index = this.notes.findIndex(n => n.id === this.currentNoteId);
            if (index !== -1) {
                this.notes[index] = noteData;
            }
        } else {
            // Add new note
            this.notes.unshift(noteData);
        }
        
        this.saveNotesToStorage();
        console.log('After saving - Notes count:', this.notes.length);
        this.renderNotes();
        this.cancelNote();
        this.showNotification('Note saved successfully!', 'success');
    }
    
    deleteNote(noteId) {
        if (confirm('Are you sure you want to delete this note?')) {
            this.notes = this.notes.filter(n => n.id !== noteId);
            this.saveNotesToStorage();
            this.renderNotes();
            this.showNotification('Note deleted successfully!', 'success');
        }
    }
    
    clearAllNotes() {
        if (this.notes.length === 0) {
            this.showNotification('No notes to clear.', 'error');
            return;
        }
        
        if (confirm('Are you sure you want to delete all notes? This action cannot be undone.')) {
            this.notes = [];
            this.saveNotesToStorage();
            this.renderNotes();
            this.showNotification('All notes cleared successfully!', 'success');
        }
    }
    
    cancelNote() {
        this.noteEditor.classList.add('hidden');
        this.notesList.classList.remove('hidden');
        this.currentNoteId = null;
        this.noteTitle.value = '';
        this.noteContent.value = '';
    }
    
    renderNotes() {
        // Enable/disable export button based on notes availability
        console.log('Notes count:', this.notes.length);
        console.log('Notes array:', this.notes);
        this.exportNotesBtn.disabled = this.notes.length === 0;
        console.log('Export button disabled:', this.exportNotesBtn.disabled);
        
        if (this.notes.length === 0) {
            this.notesList.innerHTML = `
                <div class="empty-notes">
                    <div class="empty-notes-icon">📝</div>
                    <div class="empty-notes-text">No notes yet</div>
                    <div class="empty-notes-subtext">Click "New Note" to get started</div>
                </div>
            `;
            return;
        }
        
        this.notesList.innerHTML = this.notes.map(note => {
            const date = new Date(note.updatedAt);
            const formattedDate = date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            
            return `
                <div class="note-item" onclick="app.editNote('${note.id}')">
                    <div class="note-header">
                        <h3 class="note-title">${this.escapeHtml(note.title)}</h3>
                        <span class="note-date">${formattedDate}</span>
                    </div>
                    <p class="note-content">${this.escapeHtml(note.content)}</p>
                    <div class="note-actions">
                        <button class="note-action-btn" onclick="event.stopPropagation(); app.editNote('${note.id}')">Edit</button>
                        <button class="note-action-btn" onclick="event.stopPropagation(); app.deleteNote('${note.id}')">Delete</button>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    saveNotesToStorage() {
        localStorage.setItem('notes', JSON.stringify(this.notes));
    }
    
    // Notes export functionality
    openNotesExportModal() {
        if (this.notes.length === 0) {
            this.showNotification('No notes to export.', 'error');
            return;
        }
        
        // Generate default filename
        const now = new Date();
        const timestamp = now.toISOString().slice(0, 19).replace(/:/g, '-');
        this.notesFileName.value = `notes_${timestamp}`;
        
        this.updateNotesFilePreview();
        this.notesExportModal.classList.remove('hidden');
    }
    
    closeNotesExportModal() {
        this.notesExportModal.classList.add('hidden');
    }
    
    updateNotesFilePreview() {
        const fileName = this.notesFileName.value || 'notes';
        const format = this.notesFileFormat.value;
        const extension = format === 'json' ? 'json' : format === 'md' ? 'md' : 'txt';
        this.notesFilePreview.textContent = `${fileName}.${extension}`;
        
        // Update preview content
        this.updateNotesPreview();
    }
    
    updateNotesPreview() {
        const format = this.notesFileFormat.value;
        let preview = '';
        
        if (format === 'json') {
            preview = JSON.stringify(this.notes, null, 2);
        } else if (format === 'md') {
            preview = this.generateMarkdownPreview();
        } else {
            preview = this.generateTextPreview();
        }
        
        this.notesPreview.textContent = preview;
    }
    
    generateMarkdownPreview() {
        let markdown = `# Notes Export\n\n`;
        markdown += `*Exported on ${new Date().toLocaleString()}*\n\n`;
        markdown += `---\n\n`;
        
        this.notes.forEach((note, index) => {
            const date = new Date(note.updatedAt);
            markdown += `## ${note.title}\n\n`;
            markdown += `*Created: ${date.toLocaleString()}*\n\n`;
            markdown += `${note.content}\n\n`;
            if (index < this.notes.length - 1) markdown += `---\n\n`;
        });
        
        return markdown;
    }
    
    generateTextPreview() {
        let text = `NOTES EXPORT\n`;
        text += `Exported on ${new Date().toLocaleString()}\n`;
        text += `${'='.repeat(50)}\n\n`;
        
        this.notes.forEach((note, index) => {
            const date = new Date(note.updatedAt);
            text += `${note.title}\n`;
            text += `${'-'.repeat(note.title.length)}\n`;
            text += `Created: ${date.toLocaleString()}\n\n`;
            text += `${note.content}\n\n`;
            if (index < this.notes.length - 1) text += `${'='.repeat(50)}\n\n`;
        });
        
        return text;
    }
    
    exportNotes() {
        const fileName = this.notesFileName.value || 'notes';
        const format = this.notesFileFormat.value;
        const extension = format === 'json' ? 'json' : format === 'md' ? 'md' : 'txt';
        const fullFileName = `${fileName}.${extension}`;
        
        let content = '';
        let mimeType = '';
        
        if (format === 'json') {
            content = JSON.stringify(this.notes, null, 2);
            mimeType = 'application/json';
        } else if (format === 'md') {
            content = this.generateMarkdownPreview();
            mimeType = 'text/markdown';
        } else {
            content = this.generateTextPreview();
            mimeType = 'text/plain';
        }
        
        // Create and download file
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fullFileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.closeNotesExportModal();
        this.showNotification(`Notes exported as ${fullFileName}`, 'success');
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.app = new TimerAndRecorder();
});
