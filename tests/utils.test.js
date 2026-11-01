/* =============================================================
   RAIZ DO NOME · testes das funções puras (Vitest)
   Rodar: npm test
   ============================================================= */

import { describe, test, expect } from "vitest";
import {
  limparNome, titulo, rotuloDecada, ordenarPeriodos,
  somarFrequencias, encontrarPico, variacaoPercentual, escapar,
  jaGuardado,
} from "../utils.js";
/* ========== Dados de exemplo no formato da API do IBGE ========== */
const serie = [
  { periodo: "[1990,2000[", frequencia: 500 },
  { periodo: "1930[",       frequencia: 20 },
  { periodo: "[2000,2010[", frequencia: 300 },
  { periodo: "[1980,1990[", frequencia: 150 },
];

/* ========== limparNome (validação e normalização) ========== */
describe("limparNome", () => {
  test("rejeita entrada vazia (retorna string vazia)", () => {
    expect(limparNome("")).toBe("");
  });

  test("rejeita entrada só com espaços", () => {
    expect(limparNome("   ")).toBe("");
  });

  test("rejeita entrada só com números e símbolos", () => {
    expect(limparNome("123!@#")).toBe("");
  });

  test("remove acento e coloca em maiúsculas", () => {
    expect(limparNome("  joão ")).toBe("JOAO");
  });

  test("considera só a primeira palavra", () => {
    expect(limparNome("Maria Clara")).toBe("MARIA");
  });
});

/* ========== titulo ========== */
describe("titulo", () => {
  test("formata nome com inicial maiúscula", () => {
    expect(titulo("GLAUBER")).toBe("Glauber");
  });
});

/* ========== rotuloDecada (safras) ========== */
describe("rotuloDecada", () => {
  test("converte década do IBGE em safra", () => {
    expect(rotuloDecada("[1990,2000[")).toBe("anos 90");
  });

  test("trata os anos 2000 por extenso", () => {
    expect(rotuloDecada("[2000,2010[")).toBe("anos 2000");
  });

  test("trata o primeiro período do IBGE", () => {
    expect(rotuloDecada("1930[")).toBe("até 1930");
  });
});

/* ========== ordenarPeriodos ========== */
describe("ordenarPeriodos", () => {
  test("ordena as safras da mais antiga para a mais recente", () => {
    const ordem = ordenarPeriodos(serie).map(r => r.periodo);
    expect(ordem).toEqual(["1930[", "[1980,1990[", "[1990,2000[", "[2000,2010["]);
  });

  test("não altera o array original", () => {
    const copia = [...serie];
    ordenarPeriodos(serie);
    expect(serie).toEqual(copia);
  });
});

/* ========== Cálculos da série ========== */
describe("cálculos da série", () => {
  test("soma o total de registros", () => {
    expect(somarFrequencias(serie)).toBe(970);
  });

  test("encontra a melhor safra", () => {
    expect(encontrarPico(serie).periodo).toBe("[1990,2000[");
  });

  test("calcula variação positiva", () => {
    expect(variacaoPercentual(100, 150)).toBe(50);
  });

  test("calcula variação negativa", () => {
    expect(variacaoPercentual(500, 300)).toBe(-40);
  });

  test("não divide por zero quando a safra anterior é 0", () => {
    expect(variacaoPercentual(0, 30)).toBe(3000);
  });
});

/* ========== escapar ========== */
describe("escapar", () => {
  test("neutraliza HTML digitado na nota", () => {
    expect(escapar('<b>"oi"</b>')).toBe("&lt;b&gt;&quot;oi&quot;&lt;/b&gt;");
  });
});

/*Persistência*/

describe("escapar com dados do banco", () => {
  test("aceita campo vazio sem quebrar", () => {
    expect(escapar(null)).toBe("");
  });
});

describe("jaGuardado", () => {
  const lista = [
    { nome: "MARIA", sexo: "F", localidade: "Brasil" },
    { nome: "JOAO",  sexo: null, localidade: "Bahia (BA)" },
  ];

  test("encontra o mesmo nome com o mesmo recorte", () => {
    expect(jaGuardado(lista, { nome: "MARIA", sexo: "F", localidade: "Brasil" })).toBe(true);
  });

  test("aceita o mesmo nome com outro recorte", () => {
    expect(jaGuardado(lista, { nome: "MARIA", sexo: null, localidade: "Brasil" })).toBe(false);
  });

  test("aceita qualquer nome quando a shortlist está vazia", () => {
    expect(jaGuardado([], { nome: "MARIA", sexo: "F", localidade: "Brasil" })).toBe(false);
  });
});
