import { Database } from "bun:sqlite";

import { PrismaClient, Tipo } from "@prisma/client";
export const prisma = new PrismaClient();

export const CLIENTE_NAO_ENCONTRADO = {
  message: "cliente não encontrado.",
  code: "404",
} as const;
export const SALDO_INSUFICIENTE = {
  message: "Saldo insuficiente.",
  code: "422",
} as const;
export const VALOR_INVALIDO = {
  message: "Valor inválido.",
  code: "422",
} as const;
export const DESCRICAO_INVALIDA = {
  message: "Decrição inválida.",
  code: "422",
} as const;
export const TIPO_DE_TRANSACAO_INVALIDA = {
  message: "Transacao inválida.",
  code: "422",
} as const;
export const VALOR_NEGATIVO = {
  message: "O valor precisa ser positivo.",
  code: "422",
} as const;
export const VALOR_INTERIO = {
  message: "O valor precisa ser um interio.",
  code: "422",
} as const;

export type TransacaoPayload = {
  valor: number;
  tipo: Tipo;
  descricao: string;
  conta: number;
};

type Transacao = TransacaoPayload & {
  realizada_em?: Date;
};

export interface Extrato {
  saldo: Saldo;
  ultimas_transacoes: Transacao[];
}

export interface Saldo {
  total: number;
  data_extrato: string;
  limite: number;
}

export const cadastraClientes = async (
  clientes: { nome: string; limite: number }[]
) => {
  return prisma.cliente.createMany({
    skipDuplicates: true,
    data: clientes.map((cliente, id) => ({
      id,
      nome: cliente.nome,
      limite: cliente.limite,
      saldo: 0,
    })),
  });
};

export const extrato = async ({ conta }: { conta: number }) => {
  const [ultimas_transacoes, result] = await prisma.$transaction([
    prisma.transacao.findMany({
      where: { conta },
      take: 10,
      select: { valor: true, tipo: true, descricao: true, realizada_em: true },
      orderBy: {
        realizada_em: "desc",
      },
    }),
    prisma.cliente.findFirst({
      select: {
        limite: true,
        saldo: true,
      },
      where: {
        id: conta,
      },
    }),
  ] as const);
  if (!result) throw CLIENTE_NAO_ENCONTRADO;
  const date = new Date();
  const extrato = {
    saldo: {
      data_extrato: date.toString(),
      limite: result.limite,
      total: result.saldo,
    },
    ultimas_transacoes,
  };

  return extrato;
};

export const submeterTransacao = (transacao: Transacao) => {
  validacaoSintetica(transacao);
  return armazenar(transacao);
};

export const validacaoSintetica = (transacao: Transacao) => {
  if (!transacao.descricao || transacao.descricao?.length > 10)
    throw DESCRICAO_INVALIDA;
  if (transacao.tipo !== "c" && transacao.tipo !== "d")
    throw TIPO_DE_TRANSACAO_INVALIDA;
  if (!transacao.valor) throw VALOR_INVALIDO;
  if (transacao.valor < 0.1) throw VALOR_NEGATIVO;
  if (transacao.valor !== Math.round(transacao.valor)) throw VALOR_INTERIO;
};

export const armazenar = async (transacao: Transacao) => {
  return prisma.$transaction(async (tx) => {
    const promiseTX = tx.transacao.create({
      data: {
        tipo: transacao.tipo,
        descricao: transacao.descricao,
        valor: transacao.valor,
        conta: transacao.conta,
      },
    })
    const { saldo, limite } = await tx.cliente.update({
      select: { saldo: true, limite: true },
      data: {
        saldo: {
          increment: transacao.tipo === 'c' ? transacao.valor : transacao.valor * -1,
        },
      },
      where: {
        id: transacao.conta,
      },
    });
    if (saldo === null) throw CLIENTE_NAO_ENCONTRADO;
    if (saldo < (limite * -1)) throw SALDO_INSUFICIENTE;
    await promiseTX;
    return { saldo, limite }
  });
 
};
