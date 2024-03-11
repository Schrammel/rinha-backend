import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

await prisma.transacao.deleteMany();
await prisma.cliente.deleteMany();
await prisma.cliente.createMany({
  skipDuplicates: true,
  data: [
    { id: 1, limite: 1000 * 100, saldo: 0 },
    { id: 2, limite: 800 * 100,saldo: 0 },
    { id: 3, limite:10000 * 100,saldo: 0},
    { id: 4, limite:100000 * 100,saldo: 0},
    { id: 5, limite:5000 * 100,saldo: 0},
  ],
});

const clients =await prisma.cliente.findMany()
console.log('all done', clients)