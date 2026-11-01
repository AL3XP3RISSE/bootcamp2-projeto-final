/* =============================================================
   RAIZ DO NOME · lógica do app
   API:   servicodados.ibge.gov.br (Nomes v2 + Localidades v1)
   Banco: Supabase (PostgreSQL) para a shortlist "Próxima geração"
   ============================================================= */

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";
import {
  limparNome, titulo, rotuloDecada, ordenarPeriodos,
  somarFrequencias, encontrarPico, variacaoPercentual, escapar,
} from "./utils.js";

import {
  limparNome, titulo, rotuloDecada, ordenarPeriodos,
  somarFrequencias, encontrarPico, variacaoPercentual, escapar,
  jaGuardado,
} from "./utils.js";

/* =============================================================
   CONSTANTES E ELEMENTOS
   ============================================================= */
const API_NOMES  = "https://servicodados.ibge.gov.br/api/v2/censos/nomes";
const API_UFS    = "https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome";

// Supabase: chave publicável, feita para uso no frontend (ver README)
const SUPABASE_URL = "https://bnmvvetcewvywtpvvbxz.supabase.co";
const SUPABASE_KEY = "sb_publishable_03CFdq9YZ18rRMkQBBFWVg_SOul0WG1";
const TABELA       = "proxima_geracao";
const supabase     = createClient(SUPABASE_URL, SUPABASE_KEY);

const fmt = new Intl.NumberFormat("pt-BR");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

const el = {
  form:       document.getElementById("form-busca"),
  nome:       document.getElementById("campo-nome"),
  nome2:      document.getElementById("campo-nome-2"),
  linhaVs:    document.getElementById("linha-vs"),
  btnComparar:document.getElementById("btn-comparar"),
  uf:         document.getElementById("campo-uf"),
  segBtns:    [...document.querySelectorAll(".seg-btn")],
  estado:     document.getElementById("estado"),
  resultado:  document.getElementById("resultado"),
  contador:   document.getElementById("contador"),
  legenda:    document.getElementById("legenda-contador"),
  story:      document.getElementById("story"),
  grafico:    document.getElementById("grafico"),
  chartA:     document.getElementById("chart-nome-a"),
  chartB:     document.getElementById("chart-nome-b"),
  chartBWrap: document.getElementById("chart-legenda-b"),
  stats:      document.getElementById("stats"),
  veredito:   document.getElementById("veredito"),
  btnNova:    document.getElementById("btn-nova"),
  chips:      document.getElementById("chips"),
  cue:        document.getElementById("cue-resultado"),
  progress:   document.getElementById("progress"),
  // Etapa 02
  formGuardar: document.getElementById("form-guardar"),
  guardarNome: document.getElementById("guardar-nome"),
  campoTag:    document.getElementById("campo-tag"),
  campoNota:   document.getElementById("campo-nota"),
  btnGuardar:  document.getElementById("btn-guardar"),
  guardarMsg:  document.getElementById("guardar-msg"),
  listaGeracao:document.getElementById("lista-geracao"),
};

let resultadoAtual = null;   // dados do último nome pesquisado (para guardar)

let shortlist = []; 

let sexoAtivo = "";          // "", "F" ou "M"
let modoComparar = false;

/* =============================================================
   ESTADOS DE TELA (carregando / erro / vazio)
   ============================================================= */
function mostrarEstado(html, tipoErro = false) {
  el.estado.hidden = false;
  el.estado.innerHTML =
    `<div class="estado-msg${tipoErro ? " erro" : ""}">${html}</div>`;
}

function limparEstado() {
  el.estado.hidden = true;
  el.estado.innerHTML = "";
}

/* =============================================================
   CARGA INICIAL: estados (UFs) + top 10 nacional
   ============================================================= */
async function carregarUFs() {
  try {
    const resp = await fetch(API_UFS);
    if (!resp.ok) throw new Error();
    const ufs = await resp.json();
    ufs.forEach(uf => {
      const opt = document.createElement("option");
      opt.value = uf.id;
      opt.textContent = uf.nome + " (" + uf.sigla + ")";
      el.uf.appendChild(opt);
    });
  } catch {
    // Sem UFs o app continua funcionando com "Brasil inteiro"
  }
}

async function carregarTop10() {
  try {
    const resp = await fetch(API_NOMES + "/ranking?localidade=BR");
    if (!resp.ok) throw new Error();
    const dados = await resp.json();
    const lista = dados[0]?.res?.slice(0, 10) ?? [];
    lista.forEach(item => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chip";
      btn.innerHTML =
        `${titulo(item.nome)}<small>#${item.ranking}</small>`;
      btn.addEventListener("click", () => {
        el.nome.value = item.nome.toLowerCase();
        el.nome.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center" });
        buscar();
      });
      el.chips.appendChild(btn);
    });
  } catch {
    el.chips.innerHTML =
      `<span class="src-tag">Ranking indisponível no momento — a busca continua funcionando normalmente.</span>`;
  }
}

/* =============================================================
   BUSCA PRINCIPAL
   ============================================================= */
async function buscar() {
  const nomeA = limparNome(el.nome.value);
  const nomeB = modoComparar ? limparNome(el.nome2.value) : "";

  // validação: campo vazio
  if (!nomeA || (modoComparar && !nomeB)) {
    const alvo = !nomeA ? el.nome : el.nome2;
    alvo.classList.remove("shake");
    void alvo.offsetWidth; // reinicia a animação
    alvo.classList.add("shake");
    alvo.focus();
    return;
  }

  // monta a URL (nomes separados por | no modo comparação)
  const nomes = modoComparar ? `${nomeA}|${nomeB}` : nomeA;
  const params = new URLSearchParams();
  if (sexoAtivo) params.set("sexo", sexoAtivo);
  if (el.uf.value) params.set("localidade", el.uf.value);
  const url = `${API_NOMES}/${encodeURIComponent(nomes)}${params.toString() ? "?" + params : ""}`;

  // estado de carregamento
  el.resultado.hidden = true;
  el.resultado.classList.remove("entra");
  mostrarEstado(`<span class="spinner" aria-hidden="true"></span>Consultando o IBGE…`);

  try {
    const resp = await fetch(url);
    if (!resp.ok) throw new Error("Resposta " + resp.status);
    const dados = await resp.json();

    const serieA = dados.find(d => d.nome === nomeA);
    const serieB = modoComparar ? dados.find(d => d.nome === nomeB) : null;

    // nome sem registros
    if (!serieA || !serieA.res?.length) {
      mostrarEstado(
        `Nenhum registro para <b>${titulo(nomeA)}</b> com esses filtros. ` +
        `O IBGE só divulga nomes com pelo menos 20 ocorrências por década — ` +
        `tente sem filtros ou confira a grafia.`, true
      );
      return;
    }
    if (modoComparar && (!serieB || !serieB.res?.length)) {
      mostrarEstado(
        `Encontrei <b>${titulo(nomeA)}</b>, mas nenhum registro para ` +
        `<b>${titulo(nomeB)}</b> com esses filtros. Tente outra grafia.`, true
      );
      return;
    }

    limparEstado();
    renderizar(nomeA, serieA, nomeB, serieB);

  } catch (erro) {
    mostrarEstado(
      `A API do IBGE não respondeu agora. Verifique sua conexão e ` +
      `tente de novo em instantes — nada foi perdido.`, true
    );
    console.error("Falha na consulta:", erro);
  }
}

/* =============================================================
   RENDERIZAÇÃO DO RESULTADO
   ============================================================= */
function renderizar(nomeA, serieA, nomeB, serieB) {
  const resA = ordenarPeriodos(serieA.res);
  const resB = serieB ? ordenarPeriodos(serieB.res) : null;

  const totalA = somarFrequencias(resA);
  const totalB = resB ? somarFrequencias(resB) : 0;

  // --- contador principal ---
  const escopo = el.uf.value
    ? el.uf.options[el.uf.selectedIndex].textContent.replace(/\s\(.+\)/, "")
    : "no Brasil";
  const sexoTxt = sexoAtivo === "F" ? " (mulheres)" : sexoAtivo === "M" ? " (homens)" : "";
  el.legenda.innerHTML = el.uf.value
    ? `pessoas registradas como <b>${titulo(nomeA)}</b> em ${escopo}${sexoTxt}`
    : `brasileiros registrados como <b>${titulo(nomeA)}</b>${sexoTxt}`;
  animarContador(totalA);

  // --- storytelling ---
  el.story.innerHTML = criarHistoria(nomeA, resA, totalA);

  // --- gráfico ---
  el.chartA.textContent = titulo(nomeA);
  el.chartBWrap.hidden = !resB;
  if (resB) el.chartB.textContent = titulo(nomeB);
  desenharGrafico(resA, resB);

  // --- estatísticas ---
  desenharStats(nomeA, resA, totalA, nomeB, resB, totalB);

  // --- veredito da comparação ---
  if (resB) {
    const [maior, menor, tMaior, tMenor] =
      totalA >= totalB ? [nomeA, nomeB, totalA, totalB] : [nomeB, nomeA, totalB, totalA];
    const vezes = (tMaior / Math.max(tMenor, 1)).toFixed(1).replace(".", ",");
    const classeMaior = maior === nomeA ? "a" : "b";
    const classeMenor = menor === nomeA ? "a" : "b";
    el.veredito.hidden = false;
    const picoA = encontrarPico(resA);
    const picoB = encontrarPico(resB);
    el.veredito.innerHTML =
      `<b class="${classeMaior}">${titulo(maior)}</b> é <b>${vezes}×</b> mais comum que ` +
      `<b class="${classeMenor}">${titulo(menor)}</b>: são ${fmt.format(tMaior)} contra ` +
      `${fmt.format(tMenor)} registros no recorte pesquisado. ` +
      `<b class="a">${titulo(nomeA)}</b> domina a geração dos ${rotuloDecada(picoA.periodo)}, ` +
      `<b class="b">${titulo(nomeB)}</b> a dos ${rotuloDecada(picoB.periodo)}.`;
  } else {
    el.veredito.hidden = true;
  }

  // --- prepara o bloco "guardar para a próxima geração" ---
  resultadoAtual = {
    nome: nomeA,
    total: totalA,
    melhor_safra: rotuloDecada(encontrarPico(resA).periodo),
    sexo: sexoAtivo || null,
    localidade: el.uf.value ? el.uf.options[el.uf.selectedIndex].textContent : "Brasil",
  };
  el.guardarNome.textContent = titulo(nomeA);
  el.campoNota.value = "";
  el.guardarMsg.textContent = "";
  el.guardarMsg.className = "hint";

  // --- revela a seção com entrada orquestrada ---
  el.resultado.hidden = false;
  requestAnimationFrame(() => el.resultado.classList.add("entra"));
  el.cue.hidden = false;
  el.resultado.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
}

/* -------------------------------------------------------------
   Contador animado (respeita prefers-reduced-motion)
   ------------------------------------------------------------- */
function animarContador(total) {
  if (reducedMotion) { el.contador.textContent = fmt.format(total); return; }
  const duracao = 1300;
  const inicio = performance.now();
  function passo(agora) {
    const p = Math.min((agora - inicio) / duracao, 1);
    const ease = 1 - Math.pow(1 - p, 3); // ease-out cúbico
    el.contador.textContent = fmt.format(Math.round(total * ease));
    if (p < 1) requestAnimationFrame(passo);
  }
  requestAnimationFrame(passo);
}

/* -------------------------------------------------------------
   Frase de storytelling gerada a partir dos dados
   ------------------------------------------------------------- */
function criarHistoria(nome, res, total) {
  const pico = encontrarPico(res);
  const primeira = res.find(r => r.frequencia > 0);
  const ultima = res[res.length - 1];
  const penultima = res[res.length - 2];

  let tendencia = "";
  if (penultima && ultima) {
    const delta = ultima.frequencia - penultima.frequencia;
    const pct = Math.abs(variacaoPercentual(penultima.frequencia, ultima.frequencia));
    if (delta > 0) tendencia = ` A geração atual segue em alta: cresceu <em>${pct}%</em> na última safra.`;
    else if (delta < 0) tendencia = ` Na geração atual perdeu força: caiu <em>${pct}%</em> na última safra.`;
    else tendencia = ` E a geração atual se mantém estável.`;
  }

  return `A raiz de <em>${titulo(nome)}</em> está em ` +
    `<em>${rotuloDecada(primeira.periodo)}</em>, e a maior safra veio nos ` +
    `<em>${rotuloDecada(pico.periodo)}</em>, quando ${fmt.format(pico.frequencia)} ` +
    `crianças receberam o nome.${tendencia}`;
}

/* -------------------------------------------------------------
   Gráfico de barras por década (com modo comparação)
   ------------------------------------------------------------- */
function desenharGrafico(resA, resB) {
  el.grafico.innerHTML = "";

  // união de todos os períodos das duas séries
  const periodos = [...new Set([
    ...resA.map(r => r.periodo),
    ...(resB ? resB.map(r => r.periodo) : []),
  ])];
  const ordenados = ordenarPeriodos(periodos.map(p => ({ periodo: p, frequencia: 0 })))
    .map(o => o.periodo);

  const mapaA = Object.fromEntries(resA.map(r => [r.periodo, r.frequencia]));
  const mapaB = resB ? Object.fromEntries(resB.map(r => [r.periodo, r.frequencia])) : {};
  const maximo = Math.max(...ordenados.map(p => Math.max(mapaA[p] ?? 0, mapaB[p] ?? 0)));

  ordenados.forEach((periodo, i) => {
    const va = mapaA[periodo] ?? 0;
    const vb = mapaB[periodo] ?? 0;

    const col = document.createElement("div");
    col.className = "col";

    const val = document.createElement("span");
    val.className = "val";
    val.textContent = resB
      ? `${fmt.format(va)} · ${fmt.format(vb)}`
      : fmt.format(va);

    const bars = document.createElement("div");
    bars.className = "bars";

    const barA = document.createElement("div");
    barA.className = "bar bar--a";
    barA.style.height = maximo ? (va / maximo * 100) + "%" : "0%";
    barA.title = `${rotuloDecada(periodo)}: ${fmt.format(va)} registros`;
    bars.appendChild(barA);

    let barB = null;
    if (resB) {
      barB = document.createElement("div");
      barB.className = "bar bar--b";
      barB.style.height = maximo ? (vb / maximo * 100) + "%" : "0%";
      barB.title = `${rotuloDecada(periodo)}: ${fmt.format(vb)} registros`;
      bars.appendChild(barB);
    }

    const lab = document.createElement("span");
    lab.className = "lab";
    lab.textContent = rotuloDecada(periodo).replace("anos ", "'").replace("até ", "<");

    col.append(val, bars, lab);
    el.grafico.appendChild(col);

    // crescimento em cascata, barra a barra
    const atraso = reducedMotion ? 0 : 120 + i * 70;
    setTimeout(() => {
      barA.classList.add("grow");
      if (barB) barB.classList.add("grow");
      val.classList.add("show");
    }, atraso);
  });
}

/* -------------------------------------------------------------
   Cards de estatísticas
   ------------------------------------------------------------- */
function desenharStats(nomeA, resA, totalA, nomeB, resB, totalB) {
  const cards = [];

  const picoA = encontrarPico(resA);
  cards.push(stat("Melhor safra", rotuloDecada(picoA.periodo), "mint",
    `${fmt.format(picoA.frequencia)} registros na maior colheita`));

  const primeiraA = resA.find(r => r.frequencia > 0);
  cards.push(stat("Raiz", rotuloDecada(primeiraA.periodo), "",
    `primeira safra registrada pelo IBGE`));

  const ultimaA = resA[resA.length - 1];
  const penA = resA[resA.length - 2];
  if (penA) {
    const pct = variacaoPercentual(penA.frequencia, ultimaA.frequencia);
    cards.push(stat("Geração atual",
      (pct > 0 ? "+" : "") + pct + "%", pct >= 0 ? "mint" : "violet",
      "variação na última safra registrada"));
  }

  if (resB) {
    cards.push(stat(`Total de ${titulo(nomeB)}`, fmt.format(totalB), "violet",
      "registros no mesmo recorte"));
  }

  el.stats.innerHTML = cards.join("");
}

function stat(k, v, cor, d) {
  return `<div class="stat"><div class="k">${k}</div>` +
    `<div class="v ${cor}">${v}</div><div class="d">${d}</div></div>`;
}

/* =============================================================
   INTERAÇÕES
   ============================================================= */

// envio do formulário
el.form.addEventListener("submit", e => { e.preventDefault(); buscar(); });

// filtro de sexo (segmented control)
el.segBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    el.segBtns.forEach(b => b.classList.remove("is-on"));
    btn.classList.add("is-on");
    sexoAtivo = btn.dataset.sexo;
  });
});

// alterna modo comparação
el.btnComparar.addEventListener("click", () => {
  modoComparar = !modoComparar;
  el.linhaVs.hidden = !modoComparar;
  el.btnComparar.setAttribute("aria-pressed", String(modoComparar));
  el.btnComparar.textContent = modoComparar ? "× Comparação ativada" : "+ Comparar dois nomes";
  if (modoComparar) el.nome2.focus();
});

// nova pesquisa
el.btnNova.addEventListener("click", () => {
  el.nome.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center" });
  el.nome.focus();
  el.nome.select();
});

// remove o shake quando o usuário volta a digitar
[el.nome, el.nome2].forEach(campo =>
  campo.addEventListener("input", () => campo.classList.remove("shake"))
);

// barra de progresso de leitura
addEventListener("scroll", () => {
  const h = document.documentElement;
  const total = h.scrollHeight - h.clientHeight;
  el.progress.style.width = total ? (h.scrollTop / total * 100) + "%" : "0%";
});

/* =============================================================
   PERSISTÊNCIA · Supabase (CREATE · READ · DELETE)
   ============================================================= */

// CREATE: guarda o nome pesquisado na shortlist
async function guardarNome(evento) {
  evento.preventDefault();
  if (!resultadoAtual) return;

  if (jaGuardado(shortlist, resultadoAtual)) {
    el.guardarMsg.className = "hint erro";
    el.guardarMsg.textContent = `${titulo(resultadoAtual.nome)} já está na próxima geração com esse recorte.`;
    return;
  }

  el.btnGuardar.disabled = true;
  el.guardarMsg.className = "hint";
  el.guardarMsg.textContent = "Guardando…";

  const registro = {
    ...resultadoAtual,
    tag:  el.campoTag.value,
    nota: el.campoNota.value.trim() || null,
  };

  const { error } = await supabase.from(TABELA).insert(registro);

  el.btnGuardar.disabled = false;
  if (error) {
    el.guardarMsg.className = "hint erro";
    el.guardarMsg.textContent = "Não foi possível guardar agora. Confira a conexão e tente de novo.";
    console.error("Supabase insert:", error);
    return;
  }

  el.guardarMsg.className = "hint ok";
  el.guardarMsg.textContent = `${titulo(registro.nome)} guardado na próxima geração.`;
  el.campoNota.value = "";
  listarGeracao();
}

// READ: lista a shortlist ao abrir a página e após cada mudança
async function listarGeracao() {
  const { data, error } = await supabase
    .from(TABELA)
    .select("*")
    .order("criado_em", { ascending: false });

  if (error) {
    el.listaGeracao.innerHTML =
      `<div class="gen-vazio">A shortlist não carregou agora. Recarregue a página em instantes.</div>`;
    console.error("Supabase select:", error);
    return;
  }

   shortlist = data;

  if (!data.length) {
    el.listaGeracao.innerHTML =
      `<div class="gen-vazio">Ainda não há nomes aqui. Pesquise um nome e toque em "Guardar" para começar sua shortlist.</div>`;
    return;
  }

  el.listaGeracao.innerHTML = "";
  data.forEach((item, i) => {
    const card = document.createElement("div");
    card.className = "gen-card";
    card.style.animationDelay = (i * 50) + "ms";
    card.setAttribute("role", "button");
    card.tabIndex = 0;

    const recorte = [
      item.localidade && item.localidade !== "Brasil" ? item.localidade : "Brasil",
      item.sexo === "F" ? "feminino" : item.sexo === "M" ? "masculino" : null,
    ].filter(Boolean).join(" · ");

    const nomeSeguro = escapar(titulo(item.nome));
    card.innerHTML =
      `<div class="gen-nome">${nomeSeguro}</div>` +
      `<div class="gen-meta">${fmt.format(item.total)} registros · melhor safra ${escapar(item.melhor_safra)} · ${escapar(recorte)}</div>` +
      `<span class="gen-tag">${escapar(item.tag)}</span>` +
      (item.nota ? `<p class="gen-nota">"${escapar(item.nota)}"</p>` : "") +
      `<button type="button" class="gen-del" aria-label="Excluir ${nomeSeguro} da shortlist" title="Excluir">×</button>`;

    // reabrir a pesquisa com um toque
    const reabrir = () => {
      el.nome.value = item.nome.toLowerCase();
      el.nome.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "center" });
      buscar();
    };
    card.addEventListener("click", e => { if (!e.target.closest(".gen-del")) reabrir(); });
    card.addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); reabrir(); } });

    // DELETE
    card.querySelector(".gen-del").addEventListener("click", async e => {
      e.stopPropagation();
      card.classList.add("saindo");
      const { error: erroDel } = await supabase.from(TABELA).delete().eq("id", item.id);
      if (erroDel) {
        card.classList.remove("saindo");
        console.error("Supabase delete:", erroDel);
        let aviso = card.querySelector(".hint.erro");
        if (!aviso) {
          aviso = document.createElement("p");
          aviso.className = "hint erro";
          card.appendChild(aviso);
        }
        aviso.textContent = "Não foi possível excluir agora. Tente de novo.";
      }
      setTimeout(listarGeracao, 280);
    });

    el.listaGeracao.appendChild(card);
  });
}

el.formGuardar.addEventListener("submit", guardarNome);

/* =============================================================
   INICIALIZAÇÃO
   ============================================================= */
carregarUFs();
carregarTop10();
listarGeracao();
el.nome.focus();
