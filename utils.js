/* =============================================================
   RAIZ DO NOME · funções puras
   Sem DOM, sem fetch: só recebem dados e devolvem resultado.
   Usadas pelo script.js e testadas em tests/utils.test.js
   ============================================================= */

/* ========== Nome ========== */

// Normaliza o nome: primeira palavra, sem acentos, só letras, maiúsculas
// Resultado vazio ("") significa entrada inválida (dispara o shake)
export function limparNome(valor) {
  return valor
    .trim()
    .split(/\s+/)[0]
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z]/g, "")
    .toUpperCase();
}

// Exibição amigável: primeira letra maiúscula, resto minúsculo
export function titulo(nome) {
  return nome.charAt(0) + nome.slice(1).toLowerCase();
}

/* ========== Safras (períodos do IBGE) ========== */

// Rótulo da década: "[1990,2000[" vira "anos 90" | "1930[" vira "até 1930"
export function rotuloDecada(periodo) {
  if (!periodo.includes(",")) return "até " + periodo.replace("[", "");
  const inicio = periodo.match(/\[(\d{4})/)[1];
  return inicio === "2000" ? "anos 2000" : "anos " + inicio.slice(2);
}

// Ordena os períodos cronologicamente, sem alterar o array original
export function ordenarPeriodos(res) {
  return [...res].sort((a, b) => {
    const ini = p => p.includes(",") ? +p.match(/\[(\d{4})/)[1] : 0;
    return ini(a.periodo) - ini(b.periodo);
  });
}

/* ========== Cálculos da série ========== */

// Soma todos os registros da série (total do contador)
export function somarFrequencias(res) {
  return res.reduce((soma, r) => soma + r.frequencia, 0);
}

// Período com mais registros (a "Melhor safra")
export function encontrarPico(res) {
  return res.reduce((maior, r) => r.frequencia > maior.frequencia ? r : maior, res[0]);
}

// Variação percentual entre duas safras (base da "Geração atual")
// Divide por no mínimo 1 para nunca dividir por zero
export function variacaoPercentual(anterior, atual) {
  return Math.round(((atual - anterior) / Math.max(anterior, 1)) * 100);
}

/* ========== Segurança ========== */

// Evita injeção de HTML na nota digitada pelo usuário
export function escapar(texto) {
  return texto.replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}
