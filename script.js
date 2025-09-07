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
        this.saveNoteBtn = document.getElementById('save-note');
        this.cancelNoteBtn = document.getElementById('cancel-note');
        
        // Notes export modal elements
        this.notesExportModal = document.getElementById('notesExportModal');
        this.notesFileNameInput = document.getElementById('notesFileName');
        this.notesFileFormatSelect = document.getElementById('notesFileFormat');
        this.notesFilePreview = document.getElementById('notesFilePreview');
        this.notesPreview = document.getElementById('notesPreview');
        this.closeNotesModalBtn = document.getElementById('closeNotesModal');
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
        this.exportNotesBtn.addEventListener('click', () => this.showNotesExportModal());
        this.saveNoteBtn.addEventListener('click', () => this.saveNote());
        this.cancelNoteBtn.addEventListener('click', () => this.cancelNote());
        
        // Update export button state when typing in note fields
        this.noteTitle.addEventListener('input', () => {
            this.updateExportButtonState();
            this.updateNotesFilePreview();
        });
        this.noteContent.addEventListener('input', () => this.updateExportButtonState());
        
        // Notes export modal event listeners
        this.closeNotesModalBtn.addEventListener('click', () => this.hideNotesExportModal());
        this.cancelNotesExportBtn.addEventListener('click', () => this.hideNotesExportModal());
        this.confirmNotesExportBtn.addEventListener('click', async () => await this.exportNotes());
        this.notesFileNameInput.addEventListener('input', () => this.updateNotesFilePreview());
        this.notesFileFormatSelect.addEventListener('change', () => this.updateNotesFilePreview());
        
        // Close notes modal when clicking outside
        this.notesExportModal.addEventListener('click', (e) => {
            if (e.target === this.notesExportModal) {
                this.hideNotesExportModal();
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
    
    // Notes functionality
    initializeNotes() {
        this.renderNotes();
        // Show note editor directly instead of empty state
        this.createNewNote();
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
    
    
    cancelNote() {
        this.noteEditor.classList.add('hidden');
        this.notesList.classList.remove('hidden');
        this.currentNoteId = null;
        this.noteTitle.value = '';
        this.noteContent.value = '';
    }
    
    renderNotes() {
        // Update export button state
        this.updateExportButtonState();
        
        if (this.notes.length === 0) {
            this.notesList.innerHTML = '';
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
    
    updateExportButtonState() {
        // Check if there are saved notes OR if user is typing in note fields
        const hasSavedNotes = this.notes.length > 0;
        const hasUnsavedContent = this.noteTitle.value.trim() || this.noteContent.value.trim();
        
        this.exportNotesBtn.disabled = !hasSavedNotes && !hasUnsavedContent;
    }
    
    saveNotesToStorage() {
        localStorage.setItem('notes', JSON.stringify(this.notes));
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    // Notes export functionality
    showNotesExportModal() {
        // Check if there are saved notes OR unsaved content
        const hasSavedNotes = this.notes.length > 0;
        const hasUnsavedContent = this.noteTitle.value.trim() || this.noteContent.value.trim();
        
        if (!hasSavedNotes && !hasUnsavedContent) {
            this.showNotification('No notes to export.', 'error');
            return;
        }
        
        // Check if docx library is available for Word export
        if (typeof docx === 'undefined') {
            console.warn('docx library not loaded - Word export may not work');
        }
        
        // Set default format to Word document
        this.notesFileFormatSelect.value = 'docx';
        
        // Clear filename input to use auto-generated name based on note title
        this.notesFileNameInput.value = '';
        
        this.updateNotesFilePreview();
        this.notesExportModal.classList.remove('hidden');
    }
    
    hideNotesExportModal() {
        this.notesExportModal.classList.add('hidden');
    }
    
    updateNotesFilePreview() {
        let fileName = this.notesFileNameInput.value.trim();
        const format = this.notesFileFormatSelect.value;
        const extension = format === 'txt' ? 'txt' : 
                        format === 'md' ? 'md' : 
                        format === 'json' ? 'json' : 
                        format === 'csv' ? 'csv' : 'docx';
        
        // For Word documents, use note title + date/time if no custom name provided
        if (format === 'docx' && !fileName) {
            const noteTitle = this.noteTitle.value.trim();
            const now = new Date();
            const dateTime = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
            
            if (noteTitle) {
                // Clean the title for filename (remove invalid characters)
                const cleanTitle = noteTitle.replace(/[<>:"/\\|?*]/g, '').substring(0, 50);
                fileName = `${cleanTitle}_${dateTime}`;
            } else {
                fileName = `Notes_${dateTime}`;
            }
        } else if (!fileName) {
            fileName = 'notes';
        }
        
        this.notesFilePreview.textContent = `${fileName}.${extension}`;
        this.updateNotesPreview();
    }
    
    updateNotesPreview() {
        const format = this.notesFileFormatSelect.value;
        let preview = '';
        
        switch (format) {
            case 'txt':
                preview = this.generateTextPreview();
                break;
            case 'md':
                preview = this.generateMarkdownPreview();
                break;
            case 'json':
                preview = this.generateJsonPreview();
                break;
            case 'csv':
                preview = this.generateCsvPreview();
                break;
            case 'docx':
                preview = this.generateWordPreview();
                break;
        }
        
        this.notesPreview.textContent = preview;
    }
    
    generateTextPreview() {
        let text = `Notes Export - ${new Date().toLocaleDateString()}\n`;
        text += '='.repeat(50) + '\n\n';
        
        // Add saved notes
        this.notes.forEach((note, index) => {
            text += `${index + 1}. ${note.title}\n`;
            text += `   Created: ${new Date(note.createdAt).toLocaleString()}\n`;
            if (note.updatedAt !== note.createdAt) {
                text += `   Updated: ${new Date(note.updatedAt).toLocaleString()}\n`;
            }
            text += `   Content: ${note.content}\n\n`;
        });
        
        // Add unsaved content if exists
        const unsavedTitle = this.noteTitle.value.trim();
        const unsavedContent = this.noteContent.value.trim();
        if (unsavedTitle || unsavedContent) {
            const noteIndex = this.notes.length + 1;
            text += `${noteIndex}. ${unsavedTitle || 'Untitled Note'}\n`;
            text += `   Created: ${new Date().toLocaleString()} (Unsaved)\n`;
            text += `   Content: ${unsavedContent}\n\n`;
        }
        
        return text;
    }
    
    generateMarkdownPreview() {
        let markdown = `# Notes Export\n\n`;
        markdown += `*Generated on ${new Date().toLocaleDateString()}*\n\n`;
        
        // Add saved notes
        this.notes.forEach((note, index) => {
            markdown += `## ${index + 1}. ${note.title}\n\n`;
            markdown += `**Created:** ${new Date(note.createdAt).toLocaleString()}\n`;
            if (note.updatedAt !== note.createdAt) {
                markdown += `**Updated:** ${new Date(note.updatedAt).toLocaleString()}\n`;
            }
            markdown += `\n${note.content}\n\n---\n\n`;
        });
        
        // Add unsaved content if exists
        const unsavedTitle = this.noteTitle.value.trim();
        const unsavedContent = this.noteContent.value.trim();
        if (unsavedTitle || unsavedContent) {
            const noteIndex = this.notes.length + 1;
            markdown += `## ${noteIndex}. ${unsavedTitle || 'Untitled Note'}\n\n`;
            markdown += `**Created:** ${new Date().toLocaleString()} (Unsaved)\n`;
            markdown += `\n${unsavedContent}\n\n---\n\n`;
        }
        
        return markdown;
    }
    
    generateJsonPreview() {
        // Include unsaved content in notes array
        const allNotes = [...this.notes];
        const unsavedTitle = this.noteTitle.value.trim();
        const unsavedContent = this.noteContent.value.trim();
        
        if (unsavedTitle || unsavedContent) {
            allNotes.push({
                id: 'unsaved',
                title: unsavedTitle || 'Untitled Note',
                content: unsavedContent,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                isUnsaved: true
            });
        }
        
        return JSON.stringify({
            exportDate: new Date().toISOString(),
            totalNotes: allNotes.length,
            notes: allNotes
        }, null, 2);
    }
    
    generateCsvPreview() {
        let csv = 'Title,Created,Updated,Content\n';
        
        // Add saved notes
        this.notes.forEach(note => {
            const title = `"${note.title.replace(/"/g, '""')}"`;
            const created = new Date(note.createdAt).toLocaleString();
            const updated = new Date(note.updatedAt).toLocaleString();
            const content = `"${note.content.replace(/"/g, '""')}"`;
            csv += `${title},${created},${updated},${content}\n`;
        });
        
        // Add unsaved content if exists
        const unsavedTitle = this.noteTitle.value.trim();
        const unsavedContent = this.noteContent.value.trim();
        if (unsavedTitle || unsavedContent) {
            const title = `"${(unsavedTitle || 'Untitled Note').replace(/"/g, '""')}"`;
            const created = new Date().toLocaleString();
            const content = `"${unsavedContent.replace(/"/g, '""')}"`;
            csv += `${title},${created},${created},${content}\n`;
        }
        
        return csv;
    }
    
    generateWordPreview() {
        // Include unsaved content in notes array
        const allNotes = [...this.notes];
        const unsavedTitle = this.noteTitle.value.trim();
        const unsavedContent = this.noteContent.value.trim();
        
        if (unsavedTitle || unsavedContent) {
            allNotes.push({
                id: 'unsaved',
                title: unsavedTitle || 'Untitled Note',
                content: unsavedContent,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                isUnsaved: true
            });
        }
        
        let preview = '📄 WORD DOCUMENT PREVIEW\n';
        preview += '='.repeat(50) + '\n\n';
        preview += `Export Date: ${new Date().toLocaleString()}\n`;
        preview += `Total Notes: ${allNotes.length}\n\n`;
        
        allNotes.forEach((note, index) => {
            const isUnsaved = note.isUnsaved;
            const title = isUnsaved ? `${note.title} (Unsaved)` : note.title;
            
            preview += `${index + 1}. ${title}\n`;
            preview += '-'.repeat(30) + '\n';
            preview += `Created: ${new Date(note.createdAt).toLocaleString()}\n`;
            preview += `Updated: ${new Date(note.updatedAt).toLocaleString()}\n\n`;
            preview += `${note.content || 'No content'}\n\n`;
        });
        
        preview += '\n' + '='.repeat(50) + '\n';
        preview += 'Note: This is a preview. The actual Word document will have proper formatting, fonts, and styling.';
        
        return preview;
    }
    
    async generateWordDocument() {
        try {
            // Check if docx library is loaded
            if (typeof docx === 'undefined') {
                throw new Error('docx library not loaded. Please refresh the page and try again.');
            }
            
            console.log('docx library loaded:', typeof docx);
            console.log('docx object:', docx);
            
            const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = docx;
        
        // Include unsaved content in notes array
        const allNotes = [...this.notes];
        const unsavedTitle = this.noteTitle.value.trim();
        const unsavedContent = this.noteContent.value.trim();
        
        if (unsavedTitle || unsavedContent) {
            allNotes.push({
                id: 'unsaved',
                title: unsavedTitle || 'Untitled Note',
                content: unsavedContent,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                isUnsaved: true
            });
        }
        
        const children = [
            new Paragraph({
                children: [
                    new TextRun({
                        text: "Notes Export",
                        bold: true,
                        size: 32
                    })
                ],
                heading: HeadingLevel.TITLE,
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 }
            }),
            new Paragraph({
                children: [
                    new TextRun({
                        text: `Export Date: ${new Date().toLocaleString()}`,
                        italics: true,
                        size: 20
                    })
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 }
            }),
            new Paragraph({
                children: [
                    new TextRun({
                        text: `Total Notes: ${allNotes.length}`,
                        size: 20
                    })
                ],
                spacing: { after: 600 }
            })
        ];
        
        // Add each note
        allNotes.forEach((note, index) => {
            const isUnsaved = note.isUnsaved;
            const title = isUnsaved ? `${note.title} (Unsaved)` : note.title;
            
            children.push(
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `${index + 1}. ${title}`,
                            bold: true,
                            size: 24
                        })
                    ],
                    heading: HeadingLevel.HEADING_1,
                    spacing: { before: 400, after: 200 }
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `Created: ${new Date(note.createdAt).toLocaleString()}`,
                            size: 18,
                            color: "666666"
                        })
                    ],
                    spacing: { after: 100 }
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: `Updated: ${new Date(note.updatedAt).toLocaleString()}`,
                            size: 18,
                            color: "666666"
                        })
                    ],
                    spacing: { after: 200 }
                }),
                new Paragraph({
                    children: [
                        new TextRun({
                            text: note.content || "No content",
                            size: 20
                        })
                    ],
                    spacing: { after: 400 }
                })
            );
        });
        
        const doc = new Document({
            sections: [{
                properties: {},
                children: children
            }]
        });
        
        return await Packer.toBlob(doc);
        } catch (error) {
            console.error('Error generating Word document:', error);
            this.showNotification('Error generating Word document. Creating HTML fallback...', 'warning');
            
            // Fallback: Create HTML that can be opened in Word
            return this.generateWordFallback();
        }
    }
    
    generateWordFallback() {
        // Include unsaved content in notes array
        const allNotes = [...this.notes];
        const unsavedTitle = this.noteTitle.value.trim();
        const unsavedContent = this.noteContent.value.trim();
        
        if (unsavedTitle || unsavedContent) {
            allNotes.push({
                id: 'unsaved',
                title: unsavedTitle || 'Untitled Note',
                content: unsavedContent,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                isUnsaved: true
            });
        }
        
        let html = `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office" 
      xmlns:w="urn:schemas-microsoft-com:office:word" 
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
    <meta charset="utf-8">
    <title>Notes Export</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        h1 { text-align: center; color: #333; }
        h2 { color: #666; border-bottom: 2px solid #ddd; padding-bottom: 5px; }
        .note { margin-bottom: 30px; }
        .timestamp { color: #888; font-size: 14px; }
        .content { margin-top: 10px; line-height: 1.6; }
    </style>
</head>
<body>
    <h1>Notes Export</h1>
    <p style="text-align: center; color: #666;">
        Export Date: ${new Date().toLocaleString()}<br>
        Total Notes: ${allNotes.length}
    </p>
    <hr style="margin: 30px 0;">`;
        
        allNotes.forEach((note, index) => {
            const isUnsaved = note.isUnsaved;
            const title = isUnsaved ? `${note.title} (Unsaved)` : note.title;
            
            html += `
    <div class="note">
        <h2>${index + 1}. ${this.escapeHtml(title)}</h2>
        <div class="timestamp">
            Created: ${new Date(note.createdAt).toLocaleString()}<br>
            Updated: ${new Date(note.updatedAt).toLocaleString()}
        </div>
        <div class="content">${this.escapeHtml(note.content || 'No content').replace(/\n/g, '<br>')}</div>
    </div>`;
        });
        
        html += `
</body>
</html>`;
        
        return new Blob([html], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    }
    
    async exportNotes() {
        let fileName = this.notesFileNameInput.value.trim();
        const format = this.notesFileFormatSelect.value;
        const extension = format === 'txt' ? 'txt' : 
                        format === 'md' ? 'md' : 
                        format === 'json' ? 'json' : 
                        format === 'csv' ? 'csv' : 'docx';
        
        // For Word documents, use note title + date/time if no custom name provided
        if (format === 'docx' && !fileName) {
            const noteTitle = this.noteTitle.value.trim();
            const now = new Date();
            const dateTime = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);
            
            if (noteTitle) {
                // Clean the title for filename (remove invalid characters)
                const cleanTitle = noteTitle.replace(/[<>:"/\\|?*]/g, '').substring(0, 50);
                fileName = `${cleanTitle}_${dateTime}`;
            } else {
                fileName = `Notes_${dateTime}`;
            }
        } else if (!fileName) {
            fileName = 'notes';
        }
        
        let blob;
        
        if (format === 'docx') {
            // Handle Word document export
            console.log('Starting Word document generation...');
            try {
                blob = await this.generateWordDocument();
                console.log('Word document generation result:', blob);
                if (!blob) {
                    this.showNotification('Failed to generate Word document. Please try again.', 'error');
                    return;
                }
            } catch (error) {
                console.error('Word document generation failed:', error);
                this.showNotification('Word document generation failed. Please try again.', 'error');
                return;
            }
        } else {
            // Handle other formats
            let content = '';
            let mimeType = '';
            
            switch (format) {
                case 'txt':
                    content = this.generateTextPreview();
                    mimeType = 'text/plain';
                    break;
                case 'md':
                    content = this.generateMarkdownPreview();
                    mimeType = 'text/markdown';
                    break;
                case 'json':
                    content = this.generateJsonPreview();
                    mimeType = 'application/json';
                    break;
                case 'csv':
                    content = this.generateCsvPreview();
                    mimeType = 'text/csv';
                    break;
            }
            
            blob = new Blob([content], { type: mimeType });
        }
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileName}.${extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.hideNotesExportModal();
        this.showNotification(`Notes exported as ${extension.toUpperCase()} successfully!`, 'success');
    }
}

// Initialize the application when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.app = new TimerAndRecorder();
});
