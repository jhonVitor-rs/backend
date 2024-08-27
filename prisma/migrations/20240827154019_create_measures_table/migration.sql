-- CreateTable
CREATE TABLE "Measure" (
    "id" TEXT NOT NULL,
    "custumerCode" TEXT NOT NULL,
    "measureDatetime" TIMESTAMP(3) NOT NULL,
    "measureType" TEXT NOT NULL,
    "measureValue" DOUBLE PRECISION,
    "imageUrl" TEXT,
    "hasConfirmed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Measure_pkey" PRIMARY KEY ("id")
);
