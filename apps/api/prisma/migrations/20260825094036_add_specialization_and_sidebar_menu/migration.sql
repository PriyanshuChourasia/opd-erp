-- CreateTable
CREATE TABLE "Specialization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "updatedById" TEXT,

    CONSTRAINT "Specialization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SidebarMenu" (
    "id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "icon" TEXT,
    "group" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SidebarMenu_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoleSidebarMenu" (
    "roleId" TEXT NOT NULL,
    "sidebarMenuId" TEXT NOT NULL,

    CONSTRAINT "RoleSidebarMenu_pkey" PRIMARY KEY ("roleId","sidebarMenuId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Specialization_name_key" ON "Specialization"("name");

-- CreateIndex
CREATE INDEX "Specialization_createdById_idx" ON "Specialization"("createdById");

-- CreateIndex
CREATE INDEX "Specialization_updatedById_idx" ON "Specialization"("updatedById");

-- CreateIndex
CREATE UNIQUE INDEX "SidebarMenu_path_key" ON "SidebarMenu"("path");

-- AddForeignKey
ALTER TABLE "Specialization" ADD CONSTRAINT "Specialization_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Specialization" ADD CONSTRAINT "Specialization_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleSidebarMenu" ADD CONSTRAINT "RoleSidebarMenu_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoleSidebarMenu" ADD CONSTRAINT "RoleSidebarMenu_sidebarMenuId_fkey" FOREIGN KEY ("sidebarMenuId") REFERENCES "SidebarMenu"("id") ON DELETE CASCADE ON UPDATE CASCADE;
