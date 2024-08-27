/*
  Warnings:

  - You are about to drop the column `custumerCode` on the `Measure` table. All the data in the column will be lost.
  - Added the required column `customerCode` to the `Measure` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Measure" DROP COLUMN "custumerCode",
ADD COLUMN     "customerCode" TEXT NOT NULL;
