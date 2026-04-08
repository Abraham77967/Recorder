class TimerAndRecorder {
    constructor() {
        this.timerInterval = null;
        const savedTime = localStorage.getItem('timerDuration');
        this.totalTime = savedTime ? parseInt(savedTime) : 10 * 60;
        this.timeLeft = this.totalTime;
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
        this.updateTimerDisplay();
        this.updateProgressBar();
    }
    
    initializeElements() {
        // Timer elements
        this.minutesDisplay = document.getElementById('minutes');
        this.secondsDisplay = document.getElementById('seconds');
        this.startTimerBtn = document.getElementById('start-timer');
        this.pauseTimerBtn = document.getElementById('pause-timer');
        this.resetTimerBtn = document.getElementById('reset-timer');
        this.setTimerBtn = document.getElementById('set-timer');
        this.timerSetup = document.getElementById('timer-setup');
        this.timerDisplayGroup = document.getElementById('timer-display-group');
        this.timerInput = document.getElementById('timer-input');
        this.saveTimerBtn = document.getElementById('save-timer');
        this.cancelTimerBtn = document.getElementById('cancel-timer');
        this.progressBar = document.getElementById('progress');
        
        // Audio recording elements
        this.startRecordingBtn = document.getElementById('start-recording');
        this.stopRecordingBtn = document.getElementById('stop-recording');
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
        this.btnBullet = document.getElementById('btn-bullet');
        this.btnBold = document.getElementById('btn-bold');
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
        this.setTimerBtn.addEventListener('click', () => this.toggleTimerSetup());
        this.saveTimerBtn.addEventListener('click', () => this.saveCustomTimer());
        this.cancelTimerBtn.addEventListener('click', () => this.cancelTimerSetup());
        
        // Audio recording event listeners
        this.startRecordingBtn.addEventListener('click', () => this.startRecording());
        this.stopRecordingBtn.addEventListener('click', () => this.stopRecording());
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
        
        // Rich text toolbar listeners
        this.btnBullet.addEventListener('click', () => this.execCommand('insertUnorderedList'));
        this.btnBold.addEventListener('click', () => this.execCommand('bold'));
        
        // Update export button state when typing in note fields
        this.noteTitle.addEventListener('input', () => {
            this.updateExportButtonState();
            this.updateNotesFilePreview();
        });
        this.noteContent.addEventListener('input', () => this.updateExportButtonState());
        this.noteContent.addEventListener('keyup', () => this.updateToolbarState());
        this.noteContent.addEventListener('mouseup', () => this.updateToolbarState());
        this.noteContent.addEventListener('click', () => this.updateToolbarState());
        
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
    
    toggleTimerSetup() {
        if (this.isRunning) {
            this.pauseTimer();
        }
        this.timerDisplayGroup.classList.add('hidden');
        this.timerSetup.classList.remove('hidden');
        this.timerInput.value = Math.floor(this.totalTime / 60);
        this.timerInput.focus();
        this.setTimerBtn.disabled = true;
    }
    
    saveCustomTimer() {
        const minutes = parseInt(this.timerInput.value);
        if (isNaN(minutes) || minutes < 1 || minutes > 999) {
            this.showNotification('Please enter a valid duration (1-999 minutes).', 'error');
            return;
        }
        
        this.totalTime = minutes * 60;
        localStorage.setItem('timerDuration', this.totalTime.toString());
        this.resetTimer();
        this.cancelTimerSetup();
        this.showNotification(`Timer set to ${minutes} minutes.`, 'success');
    }
    
    cancelTimerSetup() {
        this.timerDisplayGroup.classList.remove('hidden');
        this.timerSetup.classList.add('hidden');
        this.setTimerBtn.disabled = false;
    }
    
    timerComplete() {
        this.isRunning = false;
        this.startTimerBtn.disabled = false;
        this.pauseTimerBtn.disabled = true;
        clearInterval(this.timerInterval);
        
        // Play notification sound
        this.playNotificationSound();
        
        // Show alert
        alert('Timer completed!');
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
    
    execCommand(command) {
        document.execCommand(command, false, null);
        this.noteContent.focus();
        this.updateToolbarState();
    }

    updateToolbarState() {
        if (document.queryCommandState('bold')) {
            this.btnBold.classList.add('active');
        } else {
            this.btnBold.classList.remove('active');
        }

        if (document.queryCommandState('insertUnorderedList')) {
            this.btnBullet.classList.add('active');
        } else {
            this.btnBullet.classList.remove('active');
        }
    }

    createNewNote() {
        this.currentNoteId = null;
        this.noteTitle.value = '';
        this.noteContent.innerHTML = '';
        this.noteEditor.classList.remove('hidden');
        this.notesList.classList.add('hidden');
        this.noteTitle.focus();
    }
    
    editNote(noteId) {
        const note = this.notes.find(n => n.id === noteId);
        if (note) {
            this.currentNoteId = noteId;
            this.noteTitle.value = note.title;
            this.noteContent.innerHTML = note.content;
            this.noteEditor.classList.remove('hidden');
            this.notesList.classList.add('hidden');
            this.noteTitle.focus();
        }
    }
    
    saveNote() {
        const title = this.noteTitle.value.trim();
        const content = this.noteContent.innerHTML.trim();
        
        if (!title && (!content || content === '<br>')) {
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
        this.noteContent.innerHTML = '';
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
                    <p class="note-content">${this.escapeHtml(this.stripHtml(note.content))}</p>
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
        const hasUnsavedContent = this.noteTitle.value.trim() || this.stripHtml(this.noteContent.innerHTML).trim();
        
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

    stripHtml(html) {
        const tmp = document.createElement('DIV');
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || '';
    }
    
    // Notes export functionality
    showNotesExportModal() {
        // Check if there are saved notes OR unsaved content
        const hasSavedNotes = this.notes.length > 0;
        const hasUnsavedContent = this.noteTitle.value.trim() || this.stripHtml(this.noteContent.innerHTML).trim();
        
        if (!hasSavedNotes && !hasUnsavedContent) {
            this.showNotification('No notes to export.', 'error');
            return;
        }
        
        // Check if docx library is available for Word export
        if (typeof docx === 'undefined') {
            console.warn('docx library not loaded - Word export may not work');
        }
        
        // Set default format to Word Document
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
                        format === 'csv' ? 'csv' : 
                        format === 'pdf' ? 'pdf' : 'docx';
        
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
        const unsavedContent = this.stripHtml(this.noteContent.innerHTML).trim();
        if (unsavedTitle || unsavedContent) {
            const noteIndex = this.notes.length + 1;
            text += `${noteIndex}. ${unsavedTitle || 'Untitled Note'}\n`;
            text += `   Created: ${new Date().toLocaleString()} (Unsaved)\n`;
            text += `   Content: ${unsavedContent}\n\n`;
        }
        
        return text;
    }
    

    
    generateWordPreview() {
        // Include unsaved content in notes array
        const allNotes = [...this.notes];
        const unsavedTitle = this.noteTitle.value.trim();
        const unsavedContent = this.stripHtml(this.noteContent.innerHTML).trim();
        
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
        const allNotes = [...this.notes];
        const currentTitle = this.noteTitle.value.trim();
        const currentContent = this.noteContent.innerHTML.trim();
        
        const isCurrentEmpty = !currentContent || currentContent === '<br>' || currentContent === '<div><br></div>';
        if (currentTitle || !isCurrentEmpty) {
            allNotes.push({
                title: currentTitle || 'Untitled Note',
                content: currentContent,
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
        body { font-family: Arial, sans-serif; margin: 40px; color: #333; line-height: 1.5; }
        h1 { text-align: center; color: #8B5CF6; border-bottom: 2px solid #8B5CF6; padding-bottom: 10px; }
        h2 { color: #1d1d1f; border-bottom: 1px solid #eee; padding-bottom: 5px; margin-top: 30px; }
        .note { margin-bottom: 40px; }
        .timestamp { color: #86868b; font-size: 11px; margin-bottom: 15px; }
        .content { margin-top: 15px; font-size: 14px; }
        ul, ol { margin-left: 20px; }
    </style>
</head>
<body>
    <h1>RecordHub Notes Export</h1>
    <p style="text-align: center; color: #666; font-size: 12px;">
        Exported on ${new Date().toLocaleString()} | Total Notes: ${allNotes.length}
    </p>
    <hr>`;
        
        allNotes.forEach((note, index) => {
            const displayTitle = note.isUnsaved ? `${note.title} (Current)` : note.title;
            html += `
    <div class="note">
        <h2>${index + 1}. ${this.escapeHtml(displayTitle)}</h2>
        <div class="timestamp">
            Updated: ${new Date(note.updatedAt).toLocaleString()}
        </div>
        <div class="content">
            ${note.content || 'No content'}
        </div>
    </div>`;
        });
        
        html += `
</body>
</html>`;
        
        return new Blob([html], { type: 'application/msword' });
    }

    async exportNotes() {
        let fileName = this.notesFileNameInput.value.trim();
        const format = this.notesFileFormatSelect.value;
        const extension = format === 'txt' ? 'txt' : 'docx';
        
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
            try {
                // Handle Word document export
                blob = await this.generateWordDocument();
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
            // Handle Text format (Default)
            const content = this.generateTextPreview();
            blob = new Blob([content], { type: 'text/plain' });
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
