-- CreateTable: SchemaFieldChange
CREATE TABLE "SchemaFieldChange" (
    "id" TEXT NOT NULL,
    "modelName" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "remark" TEXT,
    "editedName" TEXT,
    "editedType" TEXT,
    "fieldType" TEXT,
    "targetModel" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "isList" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SchemaFieldChange_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SchemaFieldChange_modelName_fieldName_kind_key" ON "SchemaFieldChange"("modelName", "fieldName", "kind");

-- CreateIndex
CREATE INDEX "SchemaFieldChange_modelName_idx" ON "SchemaFieldChange"("modelName");
