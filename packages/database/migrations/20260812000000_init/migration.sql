-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "ProductType" AS ENUM ('CARD', 'BOOSTER', 'BOOSTER_BOX', 'BOOSTER_BUNDLE', 'ETB', 'BLISTER', 'COLLECTION_BOX', 'PREMIUM_COLLECTION', 'TIN', 'DECK', 'DISPLAY', 'OTHER');

-- CreateEnum
CREATE TYPE "CardCondition" AS ENUM ('NM', 'LP', 'MP', 'HP', 'DAMAGED');

-- CreateEnum
CREATE TYPE "ScanStatus" AS ENUM ('PENDING', 'PROCESSING', 'NEEDS_CONFIRMATION', 'CONFIRMED', 'FAILED');

-- CreateEnum
CREATE TYPE "AlertType" AS ENUM ('PRICE_BELOW', 'DISCOUNT_ABOVE', 'VALUE_INCREASE', 'VALUE_DROP', 'OPPORTUNITY');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "displayName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Set" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "seriesName" TEXT,
    "logoUrl" TEXT,
    "symbolUrl" TEXT,
    "releaseDate" TIMESTAMP(3),
    "totalCards" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Set_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "externalId" TEXT,
    "name" TEXT NOT NULL,
    "type" "ProductType" NOT NULL,
    "setId" TEXT,
    "localNumber" TEXT,
    "rarity" TEXT,
    "illustrator" TEXT,
    "imageUrl" TEXT,
    "category" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CollectionItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "purchasePrice" DECIMAL(12,2),
    "purchaseDate" TIMESTAMP(3),
    "condition" "CardCondition",
    "language" TEXT,
    "variant" TEXT,
    "gradeCompany" TEXT,
    "gradeValue" DECIMAL(4,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "CollectionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WishlistItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 2,
    "targetPrice" DECIMAL(12,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WishlistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceSnapshot" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "seller" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "price" DECIMAL(12,2) NOT NULL,
    "shipping" DECIMAL(12,2),
    "condition" "CardCondition",
    "language" TEXT,
    "variant" TEXT,
    "gradeCompany" TEXT,
    "gradeValue" DECIMAL(4,2),
    "matchConfidence" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "sourceReliability" DOUBLE PRECISION,
    "sourceUrl" TEXT,
    "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PriceSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketAggregate" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "condition" "CardCondition",
    "language" TEXT,
    "variant" TEXT,
    "gradeCompany" TEXT,
    "gradeValue" DECIMAL(4,2),
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "marketPrice" DECIMAL(12,2) NOT NULL,
    "lowestPrice" DECIMAL(12,2) NOT NULL,
    "medianPrice" DECIMAL(12,2) NOT NULL,
    "averagePrice" DECIMAL(12,2) NOT NULL,
    "listingCount" INTEGER NOT NULL,
    "sourceCount" INTEGER NOT NULL,
    "confidence" TEXT NOT NULL,
    "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MarketAggregate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PortfolioSnapshot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "invested" DECIMAL(12,2) NOT NULL,
    "currentValue" DECIMAL(12,2) NOT NULL,
    "profitLoss" DECIMAL(12,2) NOT NULL,
    "roiPercent" DECIMAL(8,4),
    "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PortfolioSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Offer" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "seller" TEXT,
    "originalUrl" TEXT,
    "affiliateUrl" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'BRL',
    "price" DECIMAL(12,2) NOT NULL,
    "shipping" DECIMAL(12,2),
    "referencePrice" DECIMAL(12,2),
    "opportunityScore" INTEGER,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    CONSTRAINT "Offer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "AlertType" NOT NULL,
    "productId" TEXT,
    "threshold" DECIMAL(12,2),
    "active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScanSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "imageUrl" TEXT,
    "engine" TEXT,
    "extractedName" TEXT,
    "extractedNumber" TEXT,
    "status" "ScanStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    CONSTRAINT "ScanSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScanMatch" (
    "id" TEXT NOT NULL,
    "scanId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "rank" INTEGER NOT NULL,
    "accepted" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "ScanMatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Product_externalId_key" ON "Product"("externalId");
CREATE INDEX "Product_name_idx" ON "Product"("name");
CREATE INDEX "Product_setId_localNumber_idx" ON "Product"("setId", "localNumber");
CREATE INDEX "CollectionItem_userId_createdAt_idx" ON "CollectionItem"("userId", "createdAt");
CREATE INDEX "CollectionItem_productId_idx" ON "CollectionItem"("productId");
CREATE UNIQUE INDEX "WishlistItem_userId_productId_key" ON "WishlistItem"("userId", "productId");
CREATE INDEX "PriceSnapshot_productId_observedAt_idx" ON "PriceSnapshot"("productId", "observedAt");
CREATE INDEX "PriceSnapshot_source_observedAt_idx" ON "PriceSnapshot"("source", "observedAt");
CREATE INDEX "MarketAggregate_productId_observedAt_idx" ON "MarketAggregate"("productId", "observedAt");
CREATE INDEX "PortfolioSnapshot_userId_observedAt_idx" ON "PortfolioSnapshot"("userId", "observedAt");
CREATE INDEX "Offer_productId_detectedAt_idx" ON "Offer"("productId", "detectedAt");
CREATE INDEX "Offer_opportunityScore_detectedAt_idx" ON "Offer"("opportunityScore", "detectedAt");
CREATE INDEX "Alert_userId_active_idx" ON "Alert"("userId", "active");
CREATE UNIQUE INDEX "ScanMatch_scanId_rank_key" ON "ScanMatch"("scanId", "rank");

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_setId_fkey" FOREIGN KEY ("setId") REFERENCES "Set"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "CollectionItem" ADD CONSTRAINT "CollectionItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CollectionItem" ADD CONSTRAINT "CollectionItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WishlistItem" ADD CONSTRAINT "WishlistItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WishlistItem" ADD CONSTRAINT "WishlistItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PriceSnapshot" ADD CONSTRAINT "PriceSnapshot_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MarketAggregate" ADD CONSTRAINT "MarketAggregate_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PortfolioSnapshot" ADD CONSTRAINT "PortfolioSnapshot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Offer" ADD CONSTRAINT "Offer_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ScanSession" ADD CONSTRAINT "ScanSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ScanMatch" ADD CONSTRAINT "ScanMatch_scanId_fkey" FOREIGN KEY ("scanId") REFERENCES "ScanSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ScanMatch" ADD CONSTRAINT "ScanMatch_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
