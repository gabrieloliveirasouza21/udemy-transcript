# Udemy Transcript Saver - Chrome Extension

Uma extensão para o Google Chrome que permite salvar transcrições de aulas da Udemy em arquivos .txt.

## 📦 Instalação

1. Abra o Google Chrome
2. Acesse `chrome://extensions/`
3. Ative o **"Modo do desenvolvedor"** (canto superior direito)
4. Clique em **"Carregar sem compactação"**
5. Selecione a pasta `udemy-transcript`

## 🚀 Como Usar

1. Acesse uma aula na Udemy
2. Clique no botão **"Transcrição"** na página da aula para exibir a transcrição
3. Clique no ícone da extensão na barra de ferramentas do Chrome
4. Clique em **"Salvar em .txt"**
5. O arquivo será baixado automaticamente

## ⚠️ Importante

- A transcrição **precisa estar visível na tela** antes de salvar
- Se a transcrição não for encontrada, a extensão exibirá uma mensagem de erro
- A extensão funciona apenas em páginas da Udemy

## 🔧 Estrutura do Projeto

```
udemy-transcript/
├── manifest.json     # Configuração da extensão
├── popup.html        # Interface do usuário
├── popup.css         # Estilos da interface
├── popup.js          # Lógica da extensão
├── icons/            # Ícones da extensão
└── README.md         # Este arquivo
```

## 📝 Notas Técnicas

A extensão extrai o texto dos elementos com `data-purpose="cue-text"` que estão dentro do painel de transcrição (`data-purpose="transcript-panel"`).

## 📄 Licença

Este projeto é de uso livre.
