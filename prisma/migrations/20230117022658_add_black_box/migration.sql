-- CreateTable
CREATE TABLE "BlackBox" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "idvk" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "BlackBox_idvk_key" ON "BlackBox"("idvk");
