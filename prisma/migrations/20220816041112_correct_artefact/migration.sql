/*
  Warnings:

  - Added the required column `label` to the `Artefact` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Artefact" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "id_user" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    CONSTRAINT "Artefact_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Artefact" ("description", "id", "id_user", "name", "type") SELECT "description", "id", "id_user", "name", "type" FROM "Artefact";
DROP TABLE "Artefact";
ALTER TABLE "new_Artefact" RENAME TO "Artefact";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
