/**
 * Bookmarklet Oficial do Agenda FC
 * Permite que o administrador envie a programação de jogos esportivos do Goal.com
 * ou de outros sites diretamente para o https://agendafc.com.br com apenas 1 clique.
 */
(function () {
  const API_URL = 'https://agendafc.com.br/api/processar-texto';

  // 1. Toast Flutuante Elegante
  function criarToast(msg, tipo) {
    let t = document.getElementById('agendafc-toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'agendafc-toast';
      t.style.cssText =
        'position:fixed;top:24px;right:24px;z-index:2147483647;' +
        'padding:14px 20px;border-radius:16px;' +
        'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;' +
        'font-size:13px;font-weight:600;box-shadow:0 12px 32px rgba(0,0,0,0.5),0 2px 6px rgba(0,0,0,0.2);' +
        'transition:all 0.3s cubic-bezier(0.16, 1, 0.3, 1);max-width:400px;' +
        'display:flex;align-items:center;gap:12px;cursor:pointer;line-height:1.4;box-sizing:border-box;';
      document.body.appendChild(t);
      t.onclick = function () {
        t.remove();
      };
    }

    let iconeHtml = '';
    if (tipo === 'info') {
      t.style.background = '#0f172a';
      t.style.color = '#38bdf8';
      t.style.border = '1px solid #0284c7';
      iconeHtml =
        '<div style="width:16px;height:16px;border:2px solid #38bdf8;border-top-color:transparent;border-radius:50%;animation:afc-spin 0.8s linear infinite;flex-shrink:0;"></div>' +
        '<style>@keyframes afc-spin{to{transform:rotate(360deg)}}</style>';
    } else if (tipo === 'sucesso') {
      t.style.background = '#064e3b';
      t.style.color = '#6ee7b7';
      t.style.border = '1px solid #10b981';
      iconeHtml = '<span style="font-size:18px;flex-shrink:0;">⚽</span>';
    } else {
      t.style.background = '#450a0a';
      t.style.color = '#fca5a5';
      t.style.border = '1px solid #ef4444';
      iconeHtml = '<span style="font-size:18px;flex-shrink:0;">⚠️</span>';
    }

    t.innerHTML = iconeHtml + '<div style="flex:1;">' + msg + '</div>';

    if (tipo !== 'info') {
      setTimeout(function () {
        if (t && t.parentNode) {
          t.style.opacity = '0';
          t.style.transform = 'translateY(-10px)';
          setTimeout(function () {
            if (t && t.parentNode) t.remove();
          }, 300);
        }
      }, 7000);
    }
  }

  // 2. Autenticação Persistente via localStorage
  let senha = localStorage.getItem('agendafc_admin_senha');
  if (!senha) {
    senha = prompt('🔒 Digite sua senha de administrador do Agenda FC:');
    if (!senha) return;
    senha = senha.trim();
    localStorage.setItem('agendafc_admin_senha', senha);
  }

  // 3. Extração Inteligente de Conteúdo
  function extrairTexto() {
    // A. Prioridade: Texto selecionado pelo usuário manualmente
    const selecao = window.getSelection().toString().trim();
    if (selecao && selecao.length > 50) {
      return selecao;
    }

    // B. Extração Otimizada para Goal.com e páginas com Tabelas Estruturadas
    const elementos = document.querySelectorAll('h2, h3, table');
    const textoTabelas = [];
    let dataAtual = '';

    elementos.forEach(function (el) {
      const tag = el.tagName.toLowerCase();
      if (tag === 'h2' || tag === 'h3') {
        const txt = (el.innerText || '').trim();
        if (/jogos de/i.test(txt) || /\d{1,2}\s+de\s+[a-zçãéíóú]+/i.test(txt)) {
          dataAtual = txt;
          textoTabelas.push('\n' + dataAtual);
        }
      } else if (tag === 'table' && dataAtual) {
        const rows = el.querySelectorAll('tr');
        rows.forEach(function (tr) {
          const cells = Array.from(tr.querySelectorAll('td')).map(function (td) {
            return (td.innerText || '').trim();
          });
          if (
            cells.length >= 4 &&
            (cells[0].includes(' x ') || cells[0].includes(' X ') || cells[0].includes(' vs '))
          ) {
            textoTabelas.push(cells.slice(0, 4).join('\t'));
          }
        });
      }
    });

    if (textoTabelas.length >= 3) {
      return textoTabelas.join('\n');
    }

    // C. Fallback Genérico para outros portais
    const container =
      document.querySelector('article') ||
      document.querySelector('main') ||
      document.querySelector('.article-body');

    return container ? container.innerText : document.body.innerText;
  }

  const texto = extrairTexto();
  if (!texto || texto.length < 50) {
    criarToast('Não foi possível extrair a programação de jogos desta página.', 'erro');
    return;
  }

  // 4. Disparo Assíncrono com CORS
  criarToast('O Agenda FC está processando os jogos...', 'info');

  fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ senha: senha, textoBruto: texto })
  })
    .then(function (res) {
      return res.json().then(function (data) {
        return { status: res.status, ok: res.ok, data: data };
      });
    })
    .then(function (result) {
      if (result.ok && result.data.success) {
        const total = result.data.quantidadeTotalSalva
          ? ' (' + result.data.quantidadeTotalSalva + ' jogos salvos)'
          : '';
        criarToast('✅ ' + (result.data.message || 'Jogos atualizados com sucesso!') + total, 'sucesso');
      } else {
        const erroMsg =
          result.data && result.data.error ? result.data.error : 'Falha ao processar jogos.';
        if (erroMsg.toLowerCase().includes('senha')) {
          localStorage.removeItem('agendafc_admin_senha');
        }
        criarToast('❌ Erro: ' + erroMsg, 'erro');
      }
    })
    .catch(function (err) {
      criarToast('❌ Erro de conexão com o servidor: ' + err.message, 'erro');
    });
})();

