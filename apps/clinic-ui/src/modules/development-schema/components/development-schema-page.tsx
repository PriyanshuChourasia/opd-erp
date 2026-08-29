import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Braces,
  ChevronDown,
  ChevronRight,
  Database,
  Download,
  Eye,
  Hash,
  Link2,
  Search,
  Table2,
} from "lucide-react";
import { fetchSchema } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function DevelopmentSchemaPage() {
  const { data: response, isLoading } = useQuery({
    queryKey: ["schema"],
    queryFn: fetchSchema,
  });

  const schema = response?.data;
  const [search, setSearch] = useState("");
  const [showEnums, setShowEnums] = useState(false);

  const models = useMemo(() => schema?.models ?? [], [schema]);

  const filtered = useMemo(
    () =>
      models.filter((m) =>
        m.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [models, search],
  );

  const totalFields = useMemo(
    () => models.reduce((sum, m) => sum + m.fields.length, 0),
    [models],
  );

  const totalRelations = useMemo(
    () => models.reduce((sum, m) => sum + m.relations.length, 0),
    [models],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Database Schema</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Prisma data model — introspected live from the API
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Models", value: isLoading ? "..." : String(models.length), icon: Table2 },
          { label: "Fields", value: isLoading ? "..." : String(totalFields), icon: Hash },
          { label: "Relations", value: isLoading ? "..." : String(totalRelations), icon: Link2 },
          {
            label: "Enums",
            value: isLoading ? "..." : String(schema?.enums.length ?? 0),
            icon: Braces,
          },
        ].map(({ label, value, icon: Icon }) => (
          <Card key={label}>
            <CardContent className="flex items-center gap-4 p-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-none bg-primary/10">
                <Icon className="size-5 text-primary" />
              </span>
              <div className="min-w-0">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="text-xl font-semibold">{value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-base">Models ({filtered.length})</CardTitle>
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search models..."
                className="pl-9"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
              Loading schema...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <Database className="size-8 text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No models found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-6">Model</TableHead>
                  <TableHead className="w-20">Fields</TableHead>
                  <TableHead className="w-24">Relations</TableHead>
                  <TableHead className="hidden md:table-cell">Relation targets</TableHead>
                  <TableHead className="w-24 pr-6 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((model) => (
                  <TableRow key={model.name}>
                    <TableCell className="py-3 pl-6">
                      <div className="flex items-center gap-3">
                        <span className="flex size-8 shrink-0 items-center justify-center rounded-none bg-primary/10">
                          <Table2 className="size-4 text-primary" />
                        </span>
                        <span className="min-w-0 truncate font-mono font-medium">
                          {model.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono tabular-nums text-muted-foreground">
                      {model.fields.length}
                    </TableCell>
                    <TableCell className="font-mono tabular-nums text-muted-foreground">
                      {model.relations.length}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="flex max-w-md flex-wrap gap-1">
                        {model.relations.slice(0, 5).map((relation) => (
                          <Badge
                            key={relation}
                            variant="outline"
                            className="font-mono text-[10px]"
                          >
                            {relation}
                          </Badge>
                        ))}
                        {model.relations.length > 5 && (
                          <Badge variant="outline" className="font-mono text-[10px]">
                            +{model.relations.length - 5}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="pr-6">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          aria-label={`Download ${model.name} schema JSON`}
                          title="Download JSON"
                          onClick={() =>
                            downloadJson(`${model.name.toLowerCase()}.schema.json`, {
                              model: model.name,
                              exportedAt: new Date().toISOString(),
                              fields: model.fields,
                              relations: model.relations,
                              uniqueFields: model.uniqueFields,
                            })
                          }
                        >
                          <Download className="size-4 text-muted-foreground transition-colors hover:text-primary" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8"
                          asChild
                        >
                          <Link
                            to="/developer/schema/$model"
                            params={{ model: model.name }}
                            aria-label={`View ${model.name} schema`}
                          >
                            <Eye className="size-4 text-muted-foreground transition-colors hover:text-primary" />
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {!isLoading && (schema?.enums.length ?? 0) > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <button
              type="button"
              onClick={() => setShowEnums(!showEnums)}
              className="flex w-full items-center gap-2 text-left"
            >
              {showEnums ? (
                <ChevronDown className="size-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="size-4 text-muted-foreground" />
              )}
              <Braces className="size-4 text-muted-foreground" />
              <span className="text-base font-semibold">Enums ({schema!.enums.length})</span>
            </button>
          </CardHeader>
          {showEnums && (
            <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {schema!.enums.map((enumeration) => (
                <div key={enumeration.name} className="border p-3">
                  <p className="font-mono text-sm font-medium">{enumeration.name}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {enumeration.values.map((value) => (
                      <Badge key={value} variant="secondary" className="font-mono text-[10px]">
                        {value}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          )}
        </Card>
      )}
    </div>
  );
}
