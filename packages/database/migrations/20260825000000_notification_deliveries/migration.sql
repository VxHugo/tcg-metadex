-- CreateTable
CREATE TABLE "NotificationDelivery" (
    "id" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "deduplicationKey" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationDelivery_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NotificationDelivery_channel_deduplicationKey_key" ON "NotificationDelivery"("channel", "deduplicationKey");

-- CreateIndex
CREATE INDEX "NotificationDelivery_sentAt_idx" ON "NotificationDelivery"("sentAt");
