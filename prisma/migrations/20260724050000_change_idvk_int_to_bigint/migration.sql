/*
  Warnings:

  - You are about to alter the column `idvk` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Int` to `BigInt`.
  - You are about to alter the column `idvk` on the `BlackBox` table. The data in that column could be lost. The data in that column will be cast from `Int` to `BigInt`.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;

CREATE TABLE "new_User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "idvk" BIGINT NOT NULL,
    "name" TEXT NOT NULL,
    "class" TEXT NOT NULL,
    "spec" TEXT NOT NULL,
    "lvl" INTEGER NOT NULL DEFAULT 0,
    "gold" INTEGER NOT NULL DEFAULT 60,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "private" BOOLEAN NOT NULL DEFAULT false,
    "crdate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_role" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "User_id_role_fkey" FOREIGN KEY ("id_role") REFERENCES "Role" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_User" ("class", "crdate", "gold", "id", "id_role", "idvk", "lvl", "name", "private", "spec", "xp") SELECT "class", "crdate", "gold", "id", "id_role", "idvk", "lvl", "name", "private", "spec", "xp" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";

CREATE TABLE "new_BlackBox" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "idvk" BIGINT NOT NULL
);
INSERT INTO "new_BlackBox" ("id", "idvk") SELECT "id", "idvk" FROM "BlackBox";
DROP TABLE "BlackBox";
ALTER TABLE "new_BlackBox" RENAME TO "BlackBox";
CREATE UNIQUE INDEX "BlackBox_idvk_key" ON "BlackBox"("idvk");

PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
