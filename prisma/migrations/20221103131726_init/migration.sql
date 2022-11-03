-- DropIndex
DROP INDEX "Role_name_key";

-- CreateTable
CREATE TABLE "Trigger" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "value" BOOLEAN NOT NULL,
    "id_user" INTEGER NOT NULL,
    CONSTRAINT "Trigger_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
