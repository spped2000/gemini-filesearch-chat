let currentStoreId = null;
let currentFileName = null;

// Drag and drop functionality
const uploadArea = document.getElementById('uploadArea');

uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadArea.classList.add('dragover');
});

uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('dragover');
});

uploadArea.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadArea.classList.remove('dragover');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleFile(files[0]);
    }
});

// File select handler
function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        handleFile(file);
    }
}

// Handle file upload
async function handleFile(file) {
    // Validate file type
    const allowedTypes = ['application/pdf', 'text/plain', 'text/markdown'];
    const allowedExtensions = ['.pdf', '.txt', '.md'];
    const fileExtension = '.' + file.name.split('.').pop().toLowerCase();

    if (!allowedExtensions.includes(fileExtension)) {
        alert('Please upload a PDF, TXT, or MD file.');
        return;
    }

    // Show loading overlay
    showLoading('Uploading and processing document...');

    const formData = new FormData();
    formData.append('file', file);

    try {
        const response = await fetch('/upload', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || 'Upload failed');
        }

        // Store the document info
        currentStoreId = data.store_id;
        currentFileName = data.filename;

        // Switch to chat interface
        showChatInterface();

    } catch (error) {
        alert('Error uploading file: ' + error.message);
        console.error('Upload error:', error);
    } finally {
        hideLoading();
    }
}

// Send message to chat
async function sendMessage() {
    const input = document.getElementById('chatInput');
    const question = input.value.trim();

    if (!question || !currentStoreId) {
        return;
    }

    // Disable input while processing
    const sendButton = document.getElementById('sendButton');
    sendButton.disabled = true;
    input.disabled = true;

    // Add user message to chat
    addMessage(question, 'user');
    input.value = '';

    try {
        const response = await fetch('/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                question: question,
                store_id: currentStoreId
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || 'Chat failed');
        }

        // Add assistant response to chat
        addMessage(data.answer, 'assistant');

    } catch (error) {
        addMessage('Sorry, I encountered an error: ' + error.message, 'assistant');
        console.error('Chat error:', error);
    } finally {
        sendButton.disabled = false;
        input.disabled = false;
        input.focus();
    }
}

// Format markdown-like text to HTML
function formatText(text) {
    // Convert markdown-style formatting to HTML
    let formatted = text;

    // Remove excessive blank lines (more than 2 consecutive newlines)
    formatted = formatted.replace(/\n{3,}/g, '\n\n');

    // Tables (markdown table format)
    // Match tables like:
    // | Header 1 | Header 2 |
    // |----------|----------|
    // | Cell 1   | Cell 2   |
    formatted = formatted.replace(/^\|(.+)\|\s*$/gm, (match, content) => {
        const cells = content.split('|').map(cell => cell.trim()).filter(cell => cell);

        // Check if this is a separator row (contains only dashes and spaces)
        if (cells.every(cell => /^[\s\-:]+$/.test(cell))) {
            return ''; // Skip separator rows
        }

        // Determine if this is a header row (next line is separator)
        const lines = formatted.split('\n');
        const currentIndex = lines.indexOf(match);
        const nextLine = lines[currentIndex + 1];
        const isHeader = nextLine && /^\|[\s\-:]+\|/.test(nextLine);

        const tag = isHeader ? 'th' : 'td';
        const cellsHtml = cells.map(cell => `<${tag}>${cell}</${tag}>`).join('');

        return `<tr>${cellsHtml}</tr>`;
    });

    // Wrap table rows in <table> tag
    formatted = formatted.replace(/(<tr>.*?<\/tr>\s*)+/gs, match => {
        return `<table>${match}</table>`;
    });

    // Headers (## Header)
    formatted = formatted.replace(/^### (.+)$/gm, '<h4>$1</h4>');
    formatted = formatted.replace(/^## (.+)$/gm, '<h3>$1</h3>');
    formatted = formatted.replace(/^# (.+)$/gm, '<h2>$1</h2>');

    // Bold (**text**)
    formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // Numbered lists (1. item)
    formatted = formatted.replace(/^\d+\.\s+(.+)$/gm, '<li>$1</li>');

    // Bullet lists (- item or * item)
    formatted = formatted.replace(/^[\-\*]\s+(.+)$/gm, '<li>$1</li>');

    // Wrap consecutive list items in <ul> or <ol>
    formatted = formatted.replace(/(<li>.*<\/li>\s*)+/g, match => `<ul>${match}</ul>`);

    // Line breaks - be more conservative
    // Replace double newlines with paragraph breaks
    formatted = formatted.replace(/\n\n+/g, '</p><p>');
    // Replace single newlines with <br> only if not already in a tag
    formatted = formatted.replace(/([^>])\n([^<])/g, '$1<br>$2');

    // Wrap in paragraphs
    formatted = '<p>' + formatted + '</p>';

    // Clean up empty paragraphs
    formatted = formatted.replace(/<p><\/p>/g, '');
    formatted = formatted.replace(/<p>\s*<\/p>/g, '');

    return formatted;
}

// Add message to chat
function addMessage(text, sender) {
    const chatMessages = document.getElementById('chatMessages');

    // Remove welcome message if it exists
    const welcomeMessage = chatMessages.querySelector('.welcome-message');
    if (welcomeMessage) {
        welcomeMessage.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}`;

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';

    if (sender === 'assistant') {
        // Format assistant messages with HTML
        contentDiv.innerHTML = formatText(text);
    } else {
        // User messages stay as plain text
        contentDiv.textContent = text;
    }

    messageDiv.appendChild(contentDiv);
    chatMessages.appendChild(messageDiv);

    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Handle Enter key in chat input
function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}

// Show chat interface
function showChatInterface() {
    document.getElementById('uploadSection').style.display = 'none';
    document.getElementById('chatSection').style.display = 'flex';
    document.getElementById('documentName').textContent = currentFileName;

    // Focus on chat input
    setTimeout(() => {
        document.getElementById('chatInput').focus();
    }, 100);
}

// Reset app to upload state
async function resetApp() {
    if (confirm('Are you sure you want to close this document? The chat history will be lost.')) {
        // Delete the store
        if (currentStoreId) {
            try {
                await fetch(`/store/${currentStoreId}`, {
                    method: 'DELETE'
                });
            } catch (error) {
                console.error('Error deleting store:', error);
            }
        }

        // Reset state
        currentStoreId = null;
        currentFileName = null;

        // Clear chat messages
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = `
            <div class="welcome-message">
                <h2>Ask me anything about your document!</h2>
                <p>I'll search through the document to find relevant information and answer your questions.</p>
            </div>
        `;

        // Clear input
        document.getElementById('chatInput').value = '';

        // Show upload section
        document.getElementById('chatSection').style.display = 'none';
        document.getElementById('uploadSection').style.display = 'block';

        // Reset file input
        document.getElementById('fileInput').value = '';
    }
}

// Loading overlay functions
function showLoading(text = 'Loading...') {
    document.getElementById('loadingText').textContent = text;
    document.getElementById('loadingOverlay').style.display = 'flex';
}

function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

// Auto-resize textarea
const chatInput = document.getElementById('chatInput');
if (chatInput) {
    chatInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });
}
