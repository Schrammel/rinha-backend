import { expect, test } from "bun:test";
import { cadastraClientes, extrato, prisma, submeterTransacao, validacaoSintetica } from "./service";
import { DESCRICAO_INVALIDA, TIPO_DE_TRANSACAO_INVALIDA, VALOR_NEGATIVO, VALOR_INTERIO, SALDO_INSUFICIENTE } from "./exceptions";


const David = { id: 1, nome: 'David Schrammel', limite: 1000 * 100 }
const Cassio = { id: 2, nome: 'Cassio Fiuza', limite: 10000 }// R$ 100,00

test('prepare', async () => {
  await prisma.$transaction([
    prisma.transacao.deleteMany({ where: { valor: { gt: 0 }}}),
    prisma.cliente.deleteMany({ where: { id: { gt: 0 }}})
  ]) 
  console.log('success')
})

test('criar usuario', async () => {
  const usuarios = [
    David,
    Cassio,
    { nome:'les cruders', limite:10000 * 100},
    { nome:'padaria joia de cocaia', limite:100000 * 100},
    { nome:'kid mais', limite:5000 * 100}
  ]
  await cadastraClientes(usuarios)
})

test('testa descricao', () => {
  expect( () => {
    validacaoSintetica({ descricao: 'crunchyroll', conta: Cassio.id, tipo: 'd', valor: Cassio.limite +1 })
  }).toThrow(DESCRICAO_INVALIDA)
  expect( () => {
    validacaoSintetica({ descricao: '', conta: Cassio.id, tipo: 'd', valor: Cassio.limite +1 })
  }).toThrow(DESCRICAO_INVALIDA)
})

test('testa tipo de transacao', () => {
  expect( () => {
    //@ts-ignore
    validacaoSintetica({ descricao: 'decricao', conta: Cassio.id, tipo: 'a', valor: Cassio.limite +1 })
  }).toThrow(TIPO_DE_TRANSACAO_INVALIDA)

  expect( () => {
    //@ts-ignore
    validacaoSintetica({ descricao: 'decricao', conta: Cassio.id, tipo: '', valor: Cassio.limite +1 })
  }).toThrow(TIPO_DE_TRANSACAO_INVALIDA)

  validacaoSintetica({ descricao: 'decricao', conta: Cassio.id, tipo: 'c', valor: Cassio.limite +1 })
  validacaoSintetica({ descricao: 'decricao', conta: Cassio.id, tipo: 'd', valor: Cassio.limite +1 })
})

test('Valida regras de valor', () => {
  expect( () => {
    validacaoSintetica({ descricao: 'decricao', conta: Cassio.id, tipo: 'd', valor: -12 })
  }).toThrow(VALOR_NEGATIVO)
  expect( () => {
    validacaoSintetica({ descricao: 'decricao', conta: Cassio.id, tipo: 'd', valor: 1.2 })
  }).toThrow(VALOR_INTERIO)
})


test('validar deposito ', async () => {
  const valorDeposito = 100
  const extratoInicial = await extrato({ conta: Cassio.id })
  const payload = { descricao: 'asd', valor: valorDeposito , conta: Cassio.id, tipo: 'c' } as const
  const {saldo} = await submeterTransacao(payload)
  expect(saldo).toBe(extratoInicial.saldo.total + valorDeposito )
})

test('validar extrato ', async () => {
  const extratoInicial = await extrato({ conta: David.id })
  const payload = { descricao: 'asd', valor: 100, conta: David.id, tipo: 'd' } as const
  await submeterTransacao(payload)
  await submeterTransacao(payload)
  await submeterTransacao(payload)
  await submeterTransacao(payload)
  await submeterTransacao(payload)
  await submeterTransacao(payload)
  await submeterTransacao(payload)
  await submeterTransacao(payload)
  await submeterTransacao(payload)
  await submeterTransacao(payload)
  const extratoFinal = await extrato({ conta: David.id })
  expect(extratoInicial.ultimas_transacoes.length).toBe(0)
  expect(extratoFinal.ultimas_transacoes.length).toBe(10)
  expect(extratoFinal.ultimas_transacoes[0].realizada_em).toBeDate()
})

test('Saldo insuficiente ', async () => {
  const payload = { descricao: 'asd', valor: David.limite, conta: David.id, tipo: 'd' } as const
  expect(async () => {
    await submeterTransacao(payload)
  }).toThrow(SALDO_INSUFICIENTE)
})
