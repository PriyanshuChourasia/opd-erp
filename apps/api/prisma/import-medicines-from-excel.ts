import { PrismaClient } from '@prisma/client';
import * as XLSX from 'xlsx';
import * as path from 'path';

const prisma = new PrismaClient();

const EXCEL_PATH = path.resolve(__dirname, '../../../List_of_Items.xlsx');

interface ParsedItem {
  name: string;
  alias: string | null;
  groupName: string;
  openingStock: number;
  unitName: string;
  isActive: boolean;
}

function parseSheet(): ParsedItem[] {
  const wb = XLSX.readFile(EXCEL_PATH);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });

  const items: ParsedItem[] = [];
  for (const row of rows) {
    const [rawName, rawAlias, rawGroup, rawStock, rawUnit] = row ?? [];
    // Real item rows are the only ones with a numeric stock and a unit string —
    // this skips the letterhead rows, the header row, the blank separator, and
    // the trailing "Totals" row in one check.
    if (typeof rawName !== 'string' || !rawName.trim()) continue;
    if (typeof rawStock !== 'number') continue;
    if (typeof rawUnit !== 'string' || !rawUnit.trim()) continue;

    const trimmedName = rawName.trim();
    // A leading '*' is this Tally export's marker for a suspended/inactive item.
    const isActive = !trimmedName.startsWith('*');
    const name = (isActive ? trimmedName : trimmedName.slice(1)).trim();
    const alias = typeof rawAlias === 'string' && rawAlias.trim() ? rawAlias.trim() : null;
    const groupName = typeof rawGroup === 'string' && rawGroup.trim() ? rawGroup.trim() : 'General';

    items.push({ name, alias, groupName, openingStock: rawStock, unitName: rawUnit.trim(), isActive });
  }
  return items;
}

async function main() {
  const items = parseSheet();
  console.log(`Parsed ${items.length} items from ${EXCEL_PATH}`);

  const deleted = await prisma.medicine.deleteMany();
  console.log(`Deleted ${deleted.count} existing medicines.`);

  const groupIdByName = new Map<string, string>();
  for (const name of new Set(items.map((i) => i.groupName))) {
    const group = await prisma.medicineGroup.upsert({ where: { name }, update: {}, create: { name } });
    groupIdByName.set(name, group.id);
  }

  const unitIdByName = new Map<string, string>();
  for (const name of new Set(items.map((i) => i.unitName))) {
    const unit = await prisma.unit.upsert({ where: { name }, update: {}, create: { name } });
    unitIdByName.set(name, unit.id);
  }

  for (const item of items) {
    await prisma.medicine.create({
      data: {
        name: item.name,
        alias: item.alias,
        unit: item.unitName,
        unitId: unitIdByName.get(item.unitName),
        groupId: groupIdByName.get(item.groupName),
        price: 0,
        openingStock: item.openingStock,
        currentStock: item.openingStock,
        isActive: item.isActive,
      },
    });
  }
  console.log(`Created ${items.length} medicines from List_of_Items.xlsx.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
