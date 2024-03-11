-- CreateEnum
CREATE TYPE "Tipo" AS ENUM ('d', 'c');

-- CreateTable
CREATE TABLE "Cliente" (
    "id" SERIAL NOT NULL,
    "limite" INTEGER NOT NULL,
    "saldo" INTEGER NOT NULL,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Transacao" (
    "id" SERIAL NOT NULL,
    "valor" INTEGER NOT NULL,
    "conta" INTEGER NOT NULL,
    "tipo" "Tipo" NOT NULL,
    "descricao" TEXT NOT NULL,
    "realizada_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Transacao_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Transacao" ADD CONSTRAINT "Transacao_conta_fkey" FOREIGN KEY ("conta") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Criar a função e a trigger para atualizar o saldo do cliente
-- CREATE OR REPLACE FUNCTION atualizar_saldo()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   IF NEW.tipo = 'c' THEN
--           UPDATE "Cliente"
--           SET saldo = (SELECT saldo + NEW.valor FROM "Cliente" WHERE id = NEW."conta")
--           WHERE id =  NEW."conta";
--   ELSE 
--       IF (SELECT (saldo - NEW.valor) > (limite * -1) limite FROM "Cliente" WHERE id =  NEW."conta") THEN
-- 			UPDATE "Cliente" set saldo = saldo - NEW.valor WHERE id =  NEW."conta";
--       ELSE
--           RAISE EXCEPTION 'Saldo não pode ser negativo.';
--       END IF;
--   END IF;
--   RETURN NEW; 
-- END;
-- $$ LANGUAGE plpgsql;

-- CREATE TRIGGER atualizar_saldo_trigger
-- AFTER INSERT ON "Transacao"
-- FOR EACH ROW
-- EXECUTE FUNCTION atualizar_saldo();
