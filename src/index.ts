import { extrato, submeterTransacao, type TransacaoPayload } from "./service";

console.log('init app')
const server = Bun.serve({
  port: 9999,
  development: false,
  lowMemoryMode: true,
  fetch: async (req) => {
    const url = new URL(req.url);
    const [, path0, idClienteStr, path3 ]  = url.pathname.split('/')
    const conta = +idClienteStr

    if ( !Number.isInteger(conta) ) return new Response("invalid!");
    if ( path0 !== 'clientes') return new Response("invalid!");

    try {
      if ( req.method === 'GET' && path3 === 'extrato') {
        const resource = await extrato({ conta })
        return Response.json(resource)
      }
      if ( req.method === 'POST' && path3 === 'transacoes') {
        const data = await req.json() as TransacaoPayload
        return Response.json(await submeterTransacao({...data, conta})) 
      }
    } catch ( e: any ) {
      return new Response(e.message, { status: e.code || 500 });
    }
    return new Response("404!", { status: 404 });
  },
})

