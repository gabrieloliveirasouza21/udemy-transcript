document.addEventListener('DOMContentLoaded', function() {
  const saveTxtBtn = document.getElementById('saveTxtBtn');
  const saveMdBtn = document.getElementById('saveMdBtn');
  const status = document.getElementById('status');

  function showStatus(message, type) {
    status.textContent = message;
    status.className = 'status ' + type;
  }

  function hideStatus() {
    status.className = 'status';
  }

  function setButtonsDisabled(disabled) {
    saveTxtBtn.disabled = disabled;
    saveMdBtn.disabled = disabled;
  }

  async function handleSave(format) {
    setButtonsDisabled(true);
    showStatus('Extraindo transcrição...', 'loading');

    try {
      // Get the active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      // Check if we're on Udemy
      if (!tab.url || !tab.url.includes('udemy.com')) {
        showStatus('❌ Esta extensão funciona apenas em páginas da Udemy.', 'error');
        setButtonsDisabled(false);
        return;
      }

      // Inject and execute the content script
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: extractTranscript
      });

      const result = results[0].result;

      if (result.success) {
        // Create and download the file
        downloadTranscript(result.transcript, result.title, format);
        const formatLabel = format === 'md' ? 'Markdown' : 'TXT';
        showStatus(`✅ Transcrição salva em ${formatLabel}! (${result.lines} linhas)`, 'success');
      } else {
        showStatus('❌ ' + result.error, 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showStatus('❌ Erro ao extrair transcrição. Tente novamente.', 'error');
    }

    setButtonsDisabled(false);
  }

  // Event listeners for both buttons
  saveTxtBtn.addEventListener('click', () => handleSave('txt'));
  saveMdBtn.addEventListener('click', () => handleSave('md'));

  function downloadTranscript(text, title, format) {
    // Clean the title for filename
    const cleanTitle = title
      .replace(/[<>:"/\\|?*]/g, '') // Remove invalid filename characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .substring(0, 100); // Limit length

    let content = text;
    let mimeType = 'text/plain;charset=utf-8';
    let extension = 'txt';

    if (format === 'md') {
      // Convert to Markdown format
      const lines = text.split('\n');
      const titleLine = lines[0].replace('Título: ', '');
      const transcriptLines = lines.slice(3); // Skip title, separator, and empty line
      
      content = `# ${titleLine}\n\n## Transcrição\n\n${transcriptLines.join('\n\n')}`;
      mimeType = 'text/markdown;charset=utf-8';
      extension = 'md';
    }

    const filename = `${cleanTitle}_transcript.${extension}`;
    
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    
    URL.revokeObjectURL(url);
  }
});

// This function will be injected into the page
function extractTranscript() {
  try {
    // Try to get the lesson title
    let title = 'udemy_lesson';
    
    // The current lesson has aria-current="true" and the title is in data-purpose="item-title"
    const titleEl = document.querySelector('li[aria-current="true"] [data-purpose="item-title"]');
    
    if (titleEl && titleEl.textContent.trim()) {
      title = titleEl.textContent.trim();
    }

    // Check if transcript panel exists
    const transcriptPanel = document.querySelector('[data-purpose="transcript-panel"]');
    
    if (!transcriptPanel) {
      return {
        success: false,
        error: 'Transcrição não encontrada! Por favor, clique no botão "Transcrição" na página da aula para exibi-la antes de salvar.'
      };
    }

    // Get all transcript cue text elements
    const cueTextElements = document.querySelectorAll('[data-purpose="cue-text"]');
    
    if (cueTextElements.length === 0) {
      return {
        success: false,
        error: 'Nenhum texto de transcrição encontrado! Certifique-se de que a transcrição está visível na tela.'
      };
    }

    // Extract text from each cue
    const transcriptLines = [];
    cueTextElements.forEach(element => {
      const text = element.textContent.trim();
      if (text) {
        transcriptLines.push(text);
      }
    });

    if (transcriptLines.length === 0) {
      return {
        success: false,
        error: 'A transcrição está vazia. Tente recarregar a página e habilitar a transcrição novamente.'
      };
    }

    // Join all lines with single line break (no extra spacing)
    const fullTranscript = `Título: ${title}\n${'='.repeat(50)}\n\n${transcriptLines.join('\n')}`;

    return {
      success: true,
      transcript: fullTranscript,
      title: title,
      lines: transcriptLines.length
    };
  } catch (error) {
    return {
      success: false,
      error: 'Erro ao processar a transcrição: ' + error.message
    };
  }
}
