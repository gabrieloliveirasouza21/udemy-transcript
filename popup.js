document.addEventListener('DOMContentLoaded', function() {
  const saveBtn = document.getElementById('saveBtn');
  const status = document.getElementById('status');

  function showStatus(message, type) {
    status.textContent = message;
    status.className = 'status ' + type;
  }

  function hideStatus() {
    status.className = 'status';
  }

  saveBtn.addEventListener('click', async function() {
    saveBtn.disabled = true;
    showStatus('Extraindo transcrição...', 'loading');

    try {
      // Get the active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      // Check if we're on Udemy
      if (!tab.url || !tab.url.includes('udemy.com')) {
        showStatus('❌ Esta extensão funciona apenas em páginas da Udemy.', 'error');
        saveBtn.disabled = false;
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
        downloadTranscript(result.transcript, result.title);
        showStatus(`✅ Transcrição salva com sucesso! (${result.lines} linhas)`, 'success');
      } else {
        showStatus('❌ ' + result.error, 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showStatus('❌ Erro ao extrair transcrição. Tente novamente.', 'error');
    }

    saveBtn.disabled = false;
  });

  function downloadTranscript(text, title) {
    // Clean the title for filename
    const cleanTitle = title
      .replace(/[<>:"/\\|?*]/g, '') // Remove invalid filename characters
      .replace(/\s+/g, '_') // Replace spaces with underscores
      .substring(0, 100); // Limit length

    const filename = `${cleanTitle}_transcript.txt`;
    
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
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
    
    // Try different selectors for the title
    const titleSelectors = [
      '[data-purpose="lesson-title"]',
      '.ud-heading-xl',
      'h1',
      '[class*="curriculum-item-title"]'
    ];
    
    for (const selector of titleSelectors) {
      const titleEl = document.querySelector(selector);
      if (titleEl && titleEl.textContent.trim()) {
        title = titleEl.textContent.trim();
        break;
      }
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

    // Join all lines with proper formatting
    const fullTranscript = `Título: ${title}\n${'='.repeat(50)}\n\n${transcriptLines.join('\n\n')}`;

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
