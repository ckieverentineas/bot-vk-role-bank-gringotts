-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Trigger" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "value" BOOLEAN NOT NULL,
    "id_user" INTEGER NOT NULL,
    "crdate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Trigger_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Trigger" ("id", "id_user", "name", "value") SELECT "id", "id_user", "name", "value" FROM "Trigger";
DROP TABLE "Trigger";
ALTER TABLE "new_Trigger" RENAME TO "Trigger";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
