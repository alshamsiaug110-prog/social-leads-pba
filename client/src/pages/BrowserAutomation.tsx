import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import {
  Bot,
  CircleAlert,
  ExternalLink,
  Loader2,
  Play,
  RefreshCw,
  ShieldCheck,
  Square,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

const statusClass = {
  queued: "bg-[#8b806f]",
  dispatching: "bg-[#8b806f]",
  running: "bg-[#4d7a89]",
  completed: "bg-[#5f8b77]",
  failed: "bg-[#a95861]",
  cancelled: "bg-[#8b806f]",
} as const;

function BrowserAutomationView() {
  const [task, setTask] = useState("");
  const [model, setModel] = useState("gpt-6-luna");
  const readiness = trpc.browserAutomation.readiness.useQuery();
  const runs = trpc.browserAutomation.list.useQuery(undefined, {
    refetchInterval: 15_000,
  });
  const create = trpc.browserAutomation.create.useMutation({
    onSuccess: () => {
      toast.success("Browser Use task submitted.");
      setTask("");
      runs.refetch();
    },
    onError: error => toast.error(error.message),
  });
  const refresh = trpc.browserAutomation.refresh.useMutation({
    onSuccess: () => runs.refetch(),
    onError: error => toast.error(error.message),
  });
  const cancel = trpc.browserAutomation.cancel.useMutation({
    onSuccess: () => {
      toast.success("Browser Use task cancelled.");
      runs.refetch();
    },
    onError: error => toast.error(error.message),
  });
  const configured = Boolean(readiness.data?.configured);

  return (
    <>
      <section>
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-[#857667]">
          Staff automation
        </p>
        <h1 className="mt-2 font-display text-5xl italic text-[#102a37]">
          Browser Use
        </h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-[#756b60]">
          Run carefully scoped browser tasks to help with research, QA, and
          staff workflows. This tool is separate from the customer-service bot
          and cannot send Meta replies automatically.
        </p>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-[#dacdb9] bg-[#fffcf7] shadow-none">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#e9dfd1] text-[#4d7a89]">
                <Bot className="h-5 w-5" />
              </span>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#7d7164]">
                  New task
                </p>
                <h2 className="font-display text-3xl italic text-[#102a37]">
                  Tell the browser what to do
                </h2>
              </div>
            </div>
            <div className="mt-6 grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="browser-task">Task instructions</Label>
                <Textarea
                  id="browser-task"
                  value={task}
                  onChange={event => setTask(event.target.value)}
                  placeholder="Example: Open the Premier Ballet Academy Instagram profile and summarize the latest hiring post. Do not send or publish anything."
                  className="min-h-36"
                />
                <p className="text-xs leading-5 text-[#8b806f]">
                  Be explicit about the website, the information to collect, and
                  whether any external action is allowed.
                </p>
              </div>
              <div className="grid gap-2">
                <Label>Model</Label>
                <Select value={model} onValueChange={setModel}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-6-luna">
                      GPT-6 Luna — high reasoning
                    </SelectItem>
                    <SelectItem value="gpt-6-astra">GPT-6 Astra</SelectItem>
                    <SelectItem value="gpt-5.6">GPT-5.6</SelectItem>
                    <SelectItem value="claude-sonnet-5">
                      Claude Sonnet 5
                    </SelectItem>
                    <SelectItem value="gemini-3.6-flash">
                      Gemini 3.6 Flash
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                disabled={
                  !configured || task.trim().length < 5 || create.isPending
                }
                onClick={() =>
                  create.mutate({
                    task: task.trim(),
                    model: model as
                      | "gpt-6-luna"
                      | "gpt-6-astra"
                      | "gpt-5.6"
                      | "claude-sonnet-5"
                      | "gemini-3.6-flash",
                  })
                }
                className="bg-[#102a37] text-white"
              >
                <Play className="mr-2 h-4 w-4" />
                {create.isPending
                  ? "Submitting…"
                  : configured
                    ? "Run task"
                    : "API key required"}
              </Button>
            </div>
          </CardContent>
        </Card>
        <Card className="border-[#dacdb9] bg-[#102a37] text-[#fbf7ef] shadow-none">
          <CardContent className="p-6">
            <ShieldCheck className="h-6 w-6 text-[#d4b07a]" />
            <h2 className="mt-4 font-display text-3xl italic">
              Safety boundary
            </h2>
            <p className="mt-3 text-sm leading-6 text-[#c6d4d6]">
              Only signed-in staff can submit tasks. The Browser Use API key
              stays on the server, and every run is recorded for review.
            </p>
            <div className="mt-6 space-y-3 text-sm">
              <div className="flex items-center justify-between border-b border-[#365360] pb-3">
                <span>Provider</span>
                <span className="text-[#d4b07a]">Browser Use Cloud V4</span>
              </div>
              <div className="flex items-center justify-between border-b border-[#365360] pb-3">
                <span>Connection</span>
                <Badge className={configured ? "bg-[#5f8b77]" : "bg-[#8b806f]"}>
                  {configured ? "Configured" : "Not configured"}
                </Badge>
              </div>
              <div className="flex items-start gap-2 pt-1 text-xs leading-5 text-[#c6d4d6]">
                <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-[#d4b07a]" />
                Do not use this runner for purchases, account-security changes,
                irreversible deletion, or public publishing without reviewing
                the exact task and result.
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="mt-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-[#7d7164]">
              Run history
            </p>
            <h2 className="mt-1 font-display text-3xl italic text-[#102a37]">
              Recent automation tasks
            </h2>
          </div>
          <Button
            variant="outline"
            onClick={() => runs.refetch()}
            disabled={runs.isFetching}
            className="border-[#cdbda9] bg-[#fffcf7]"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${runs.isFetching ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
        <div className="mt-4 grid gap-3">
          {runs.isLoading ? (
            <p className="rounded-2xl border border-dashed border-[#cdbda9] p-8 text-center text-sm text-[#7d7164]">
              Loading run history…
            </p>
          ) : (
            runs.data?.map(run => (
              <Card
                key={run.id}
                className="border-[#dacdb9] bg-[#fffcf7] shadow-none"
              >
                <CardContent className="p-5">
                  <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge className={statusClass[run.status]}>
                          {run.status}
                        </Badge>
                        <span className="font-mono text-[11px] text-[#9a8b7a]">
                          Run #{run.id} · {run.model ?? "default model"}
                        </span>
                        <span className="text-[11px] text-[#9a8b7a]">
                          {new Date(run.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#514a41]">
                        {run.task}
                      </p>
                      {run.result ? (
                        <div className="mt-4 rounded-xl border border-[#e4d8c7] bg-[#faf4e9] p-4">
                          <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#7d7164]">
                            Result
                          </p>
                          <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-[#514a41]">
                            {run.result}
                          </p>
                        </div>
                      ) : null}
                      {run.error ? (
                        <p className="mt-3 rounded-xl border border-[#efd0d0] bg-[#fff1f1] p-3 text-sm leading-5 text-[#a95861]">
                          {run.error}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 gap-2">
                      {!(
                        ["completed", "failed", "cancelled"] as string[]
                      ).includes(run.status) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => cancel.mutate({ id: run.id })}
                          disabled={cancel.isPending}
                          className="border-[#d8b7b7] text-[#a95861]"
                        >
                          <Square className="mr-2 h-3.5 w-3.5" />
                          Cancel
                        </Button>
                      )}
                      {!(
                        ["completed", "failed", "cancelled"] as string[]
                      ).includes(run.status) && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => refresh.mutate({ id: run.id })}
                          disabled={refresh.isPending}
                          className="border-[#cdbda9]"
                        >
                          <Loader2
                            className={`mr-2 h-3.5 w-3.5 ${refresh.isPending ? "animate-spin" : ""}`}
                          />
                          Check status
                        </Button>
                      )}
                      {run.status === "completed" && (
                        <span className="flex items-center gap-1 text-xs text-[#5f8b77]">
                          <ExternalLink className="h-3.5 w-3.5" />
                          Completed
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
          {!runs.isLoading && !runs.data?.length ? (
            <p className="rounded-2xl border border-dashed border-[#cdbda9] p-8 text-center text-sm text-[#7d7164]">
              No Browser Use tasks have been submitted yet.
            </p>
          ) : null}
        </div>
      </section>
    </>
  );
}

export default function BrowserAutomation() {
  return (
    <DashboardLayout>
      <BrowserAutomationView />
    </DashboardLayout>
  );
}
