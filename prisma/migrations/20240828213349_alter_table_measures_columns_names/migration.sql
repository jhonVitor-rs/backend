/*
  Warnings:

  - You are about to drop the column `customerCode` on the `Measure` table. All the data in the column will be lost.
  - You are about to drop the column `hasConfirmed` on the `Measure` table. All the data in the column will be lost.
  - You are about to drop the column `imageUrl` on the `Measure` table. All the data in the column will be lost.
  - You are about to drop the column `measureDatetime` on the `Measure` table. All the data in the column will be lost.
  - You are about to drop the column `measureType` on the `Measure` table. All the data in the column will be lost.
  - You are about to drop the column `measureValue` on the `Measure` table. All the data in the column will be lost.
  - Added the required column `customer_code` to the `Measure` table without a default value. This is not possible if the table is not empty.
  - Added the required column `measure_datetime` to the `Measure` table without a default value. This is not possible if the table is not empty.
  - Added the required column `measure_type` to the `Measure` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Measure" DROP COLUMN "customerCode",
DROP COLUMN "hasConfirmed",
DROP COLUMN "imageUrl",
DROP COLUMN "measureDatetime",
DROP COLUMN "measureType",
DROP COLUMN "measureValue",
ADD COLUMN     "customer_code" TEXT NOT NULL,
ADD COLUMN     "has_confirmed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "image_url" TEXT,
ADD COLUMN     "measure_datetime" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "measure_type" TEXT NOT NULL,
ADD COLUMN     "measure_value" INTEGER;
