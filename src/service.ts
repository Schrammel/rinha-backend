import { PrismaClient, Tipo } from "@prisma/client";
import {
  CLIENTE_NAO_ENCONTRADO,
  DESCRICAO_INVALIDA,
  SALDO_INSUFICIENTE,
  TIPO_DE_TRANSACAO_INVALIDA,
  VALOR_INTERIO,
  VALOR_INVALIDO,
  VALOR_NEGATIVO,
} from "./exceptions";
export const prisma = new PrismaClient();

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
  const dados = await prisma.cliente.findFirst({
      select: {
        limite: true,
        saldo: true,
        transacoes: {
          select: {
            valor: true,
            tipo: true,
            descricao: true,
            realizada_em: true,
          },
          orderBy:  {
            realizada_em: "desc",
          },
          take: 10
        },
      },
      where: {
        id: conta,
      },
    })
  
  if (!dados) throw CLIENTE_NAO_ENCONTRADO;
  const date = new Date();
  const extrato = {
    saldo: {
      data_extrato: date.toString(),
      limite: dados.limite,
      total: dados.saldo,
    },
    ultimas_transacoes: dados.transacoes,
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
    });
    const { saldo, limite } = await tx.cliente.update({
      select: { saldo: true, limite: true },
      data: {
        saldo: {
          increment:
            transacao.tipo === "c" ? transacao.valor : transacao.valor * -1,
        },
      },
      where: {
        id: transacao.conta,
      },
    });
    if (saldo === null) throw CLIENTE_NAO_ENCONTRADO;
    if (saldo < limite * -1) throw SALDO_INSUFICIENTE;
    await promiseTX;
    return { saldo, limite };
  });
};
