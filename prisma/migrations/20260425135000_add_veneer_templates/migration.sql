CREATE TABLE "VeneerTemplate" (
    "id" TEXT NOT NULL,
    "templateName" TEXT NOT NULL,
    "specKey" TEXT NOT NULL,
    "thickness" TEXT,
    "width" TEXT,
    "length" TEXT,
    "grade" TEXT,
    "unit" TEXT,
    "defaultPrice" DECIMAL(14,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "source" TEXT NOT NULL DEFAULT 'auto',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "VeneerTemplate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "VeneerTemplate_specKey_key" ON "VeneerTemplate"("specKey");
CREATE INDEX "VeneerTemplate_isActive_idx" ON "VeneerTemplate"("isActive");
