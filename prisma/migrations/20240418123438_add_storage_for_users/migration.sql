-- CreateTable
CREATE TABLE "Storage" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "id_user" INTEGER NOT NULL,
    CONSTRAINT "Storage_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
