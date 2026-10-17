-- AlterTable
ALTER TABLE "Document" ADD COLUMN     "glossaryId" TEXT;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_glossaryId_fkey" FOREIGN KEY ("glossaryId") REFERENCES "Glossary"("id") ON DELETE SET NULL ON UPDATE CASCADE;
