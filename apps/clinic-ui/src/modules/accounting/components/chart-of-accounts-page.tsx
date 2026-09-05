import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, BookOpen, Layers } from "lucide-react";
import { fetchAccountGroupsTree, type AccountGroup, type Ledger } from "@/lib/api";

interface AccountNatureWithGroups {
  id: string;
  code: string;
  name: string;
  normalBalance: string;
  accountGroups: AccountGroup[];
}
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function currency(value: number) {
  return `₹${(value / 100).toFixed(2)}`;
}

function LedgerRow({ ledger }: { ledger: Ledger }) {
  return (
    <div className="flex items-center justify-between rounded border px-3 py-1.5 text-xs">
      <div className="flex items-center gap-2">
        <BookOpen className="size-3 text-muted-foreground" />
        <span className="font-medium">{ledger.name}</span>
        {ledger.isCashAccount && <Badge variant="outline" className="text-[9px]">Cash</Badge>}
        {ledger.isBankAccount && <Badge variant="outline" className="text-[9px]">Bank</Badge>}
        {ledger.patientId && <Badge variant="outline" className="text-[9px]">Patient</Badge>}
      </div>
      <span className={cn("font-mono font-medium", ledger.currentBalance >= 0 ? "text-green-600" : "text-red-600")}>
        {currency(ledger.currentBalance)}
      </span>
    </div>
  );
}

function GroupNode({ group, depth = 0 }: { group: AccountGroup; depth?: number }) {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = group.childGroups && group.childGroups.length > 0;
  const hasLedgers = group.ledgers && group.ledgers.length > 0;

  return (
    <div>
      <button
        type="button"
        className="flex w-full items-center gap-1 py-1 text-left text-sm hover:bg-muted/50 rounded px-1"
        onClick={() => setExpanded(!expanded)}
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
      >
        {hasChildren || hasLedgers ? (
          expanded ? <ChevronDown className="size-3 shrink-0" /> : <ChevronRight className="size-3 shrink-0" />
        ) : (
          <span className="size-3" />
        )}
        <span className="font-medium">{group.name}</span>
        {hasLedgers && (
          <span className="ml-1 text-xs text-muted-foreground">({group.ledgers!.length})</span>
        )}
        {group.isReserved && <Badge variant="outline" className="ml-1 text-[9px]">Reserved</Badge>}
      </button>
      {expanded && (
        <div>
          {hasLedgers && group.ledgers!.map((ledger) => (
            <div key={ledger.id} style={{ paddingLeft: `${(depth + 1) * 16 + 4}px` }}>
              <LedgerRow ledger={ledger} />
            </div>
          ))}
          {hasChildren && group.childGroups!.map((child) => (
            <GroupNode key={child.id} group={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function ChartOfAccountsPage() {
  const { data: natures, isLoading } = useQuery({
    queryKey: ["account-groups-tree"],
    queryFn: fetchAccountGroupsTree,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Chart of Accounts</h1>
        <p className="mt-1 text-sm text-muted-foreground">Hierarchical view of account groups and ledgers</p>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {natures?.map((nature) => (
            <Card key={nature.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{nature.name}</CardTitle>
                  <Badge variant="outline" className="text-[10px]">
                    Normal: {nature.normalBalance}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">Code: {nature.code}</p>
              </CardHeader>
              <CardContent className="max-h-[60vh] overflow-y-auto">
                {(nature as AccountNatureWithGroups).accountGroups?.filter((g: AccountGroup) => !g.parentGroupId).map((group: AccountGroup) => (
                  <GroupNode key={group.id} group={group} />
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
