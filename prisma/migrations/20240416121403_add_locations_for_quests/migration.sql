-- CreateTable
CREATE TABLE "Location" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "Sublocation" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "id_location" INTEGER NOT NULL,
    CONSTRAINT "Sublocation_id_location_fkey" FOREIGN KEY ("id_location") REFERENCES "Location" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Quest" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "id_sublocation" INTEGER NOT NULL,
    CONSTRAINT "Quest_id_sublocation_fkey" FOREIGN KEY ("id_sublocation") REFERENCES "Sublocation" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
