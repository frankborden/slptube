import {
  ArrowLeftIcon,
  ArrowRightIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CounterClockwiseClockIcon,
  PauseIcon,
  PinLeftIcon,
  PinRightIcon,
  PlayIcon,
} from "@radix-ui/react-icons";
import { SelectValue } from "@radix-ui/react-select";
import { useLoaderData, useSearchParams } from "@remix-run/react";
import { useEffect, useRef, useState } from "react";

import { shortCharactersExt } from "~/common/names";
import { ReplayStub } from "~/common/types";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Progress } from "~/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
} from "~/components/ui/select";
import { Sheet, SheetContent, SheetTrigger } from "~/components/ui/sheet";
import { Slider } from "~/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { cn } from "~/lib/utils";
import { useFileStore } from "~/stores/fileStore";
import { useReplayStore } from "~/stores/replayStore";
import { Replay } from "~/viewer/Replay";

export function loader() {
  return { stubs: [] as ReplayStub[] };
}

export default function Page() {
  return (
    <div className="flex h-screen gap-8 overflow-y-auto p-4">
      <div className="flex shrink grow flex-col">
        <div className="mb-2">
          <ReplaySelect />
        </div>
        <Replay />
        <Controls />
      </div>
      <div className="w-[200px]">
        <HighlightList />
      </div>
    </div>
  );
}

function Controls() {
  const { replay, frame, setFrame, paused, setPaused, speed, setSpeed } =
    useReplayStore();

  let current = "0:00";
  let total = "0:00";
  if (replay) {
    const currentMinutes = Math.floor(frame / 60 / 60);
    const currentSeconds = Math.floor((frame % 3600) / 60);
    current = `${currentMinutes}:${String(currentSeconds).padStart(2, "0")}`;
    const totalMinutes = Math.floor(replay.frames.length / 60 / 60);
    const totalSeconds = Math.floor((replay.frames.length % 3600) / 60);
    total = `${totalMinutes}:${String(totalSeconds).padStart(2, "0")}`;
  }

  function handleKeyPress(event: KeyboardEvent) {
    switch (event.key) {
      case "ArrowLeft":
      case "j":
        setFrame(Math.max(frame - 120, 0));
        break;
      case "ArrowRight":
      case "l":
        setFrame(Math.min(frame + 120, (replay?.frames.length ?? 1) - 1));
        break;
      case " ":
      case "k":
        setPaused(!paused);
        break;
      case ",":
        setPaused(true);
        setFrame(Math.max(0, frame - 1));
        break;
      case ".":
        setPaused(true);
        setFrame(Math.min((replay?.frames.length ?? 1) - 1, frame + 1));
        break;
      case "0":
      case "1":
      case "2":
      case "3":
      case "4":
      case "5":
      case "6":
      case "7":
      case "8":
      case "9":
        const num = parseInt(event.key);
        setFrame(Math.round((replay?.frames.length ?? 0) * (num / 10)));
        break;
    }
  }

  useEffect(() => {
    document.addEventListener("keydown", handleKeyPress);
    return () => {
      document.removeEventListener("keydown", handleKeyPress);
    };
  }, [handleKeyPress]);

  return (
    <>
      <Slider
        value={[frame]}
        min={0}
        max={replay?.frames.length ?? 10}
        onValueChange={(value) => setFrame(value[0])}
      />
      <div className="mt-2 flex items-center justify-between">
        <div className="text-sm font-medium leading-none">
          {current} / {total}
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            className="size-6"
            onClick={() => {
              setFrame(Math.max(frame - 120, 0));
              setPaused(true);
            }}
          >
            <CounterClockwiseClockIcon />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="size-6"
            onClick={() => {
              setFrame(Math.max(frame - 1, 0));
              setPaused(true);
            }}
          >
            <ChevronLeftIcon />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="size-6"
            onClick={() => setPaused(!paused)}
          >
            {paused ? <PlayIcon /> : <PauseIcon />}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="size-6"
            onClick={() => {
              setFrame(Math.min(frame + 1, (replay?.frames.length ?? 1) - 1));
              setPaused(true);
            }}
          >
            <ChevronRightIcon />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="size-6"
            onClick={() => {
              setFrame(Math.min(frame + 120, (replay?.frames.length ?? 1) - 1));
              setPaused(true);
            }}
          >
            <CounterClockwiseClockIcon className=" -scale-x-100" />
          </Button>
        </div>
      </div>
    </>
  );
}

function HighlightList() {
  const { highlights } = useReplayStore();
  const [selectedQuery, setSelectedQuery] = useState<string>(
    Object.keys(highlights)[0],
  );

  return (
    <>
      <Select value={selectedQuery} onValueChange={setSelectedQuery}>
        <SelectTrigger className="gap-2">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Category</SelectLabel>
            {Object.keys(highlights).map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      <div className="mt-2 grid grid-cols-[repeat(2,auto)] justify-center gap-x-4">
        {highlights[selectedQuery].map((highlight, i) => (
          <button
            key={i}
            className="col-span-full grid grid-cols-subgrid items-center rounded px-4 py-1 hover:bg-foreground/10"
          >
            <Badge
              variant="outline"
              className={cn(
                [
                  "bg-red-400/10 text-red-400",
                  "bg-blue-400/10 text-blue-400",
                  "bg-yellow-400/10 text-yellow-400",
                  "bg-green-400/10 text-green-400",
                ][highlight.playerIndex],
              )}
            >
              Player {highlight.playerIndex + 1}
            </Badge>
            <div>
              {Math.floor(highlight.startFrame / 60 / 60)}:
              {String(
                Math.floor(Math.floor(highlight.startFrame % 3600) / 60),
              ).padStart(2, "0")}
            </div>
          </button>
        ))}
        <div className="col-span-full hidden text-center text-sm only:block">
          No highlights
        </div>
      </div>
    </>
  );
}

function ReplaySelect() {
  const [searchParams] = useSearchParams();
  const slug = searchParams.get("slug")?.replace("local-", "");

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="secondary" className="gap-2">
          <div>Now playing:</div>
          <div>{slug ?? "None"}</div>
          <ChevronDownIcon className="size-4" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="flex w-[500px] flex-col sm:max-w-none"
      >
        <div className="flex grow flex-col">
          <ReplaySelectContent />
        </div>
      </SheetContent>
    </Sheet>
  );
}

function ReplaySelectContent() {
  const [searchParams] = useSearchParams();
  const slug = searchParams.get("slug");
  const { stubs: localStubs, loadFiles, loadProgress } = useFileStore();
  const cloudStubs = useLoaderData<typeof loader>().stubs;
  const [tab, setTab] = useState(
    slug && !slug.startsWith("local-") ? "cloud" : "local",
  );

  const fileInput = useRef<HTMLInputElement>(null);
  const folderInput = useRef<HTMLInputElement>(null);

  return (
    <>
      <Tabs
        value={tab}
        onValueChange={setTab}
        className="mt-4 flex items-center justify-between"
      >
        <TabsList>
          <TabsTrigger value="local">Local</TabsTrigger>
          <TabsTrigger value="cloud">Cloud</TabsTrigger>
        </TabsList>
        <TabsContent value="local" className="mt-0">
          <input
            type="file"
            ref={fileInput}
            className="hidden"
            onInput={(event) =>
              loadFiles([...((event.target as HTMLInputElement).files ?? [])])
            }
          />
          <input
            type="file"
            ref={folderInput}
            // @ts-ignore webkit
            webkitdirectory=""
            className="hidden"
            onInput={(event) =>
              loadFiles([...((event.target as HTMLInputElement).files ?? [])])
            }
          />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Open files</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onSelect={() => folderInput.current?.click()}>
                Open folder
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => fileInput.current?.click()}>
                Open file
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TabsContent>
      </Tabs>
      {loadProgress !== undefined && (
        <Progress className="mt-2" value={loadProgress} />
      )}
      <ReplayList
        stubs={tab === "local" ? localStubs.map(([stub]) => stub) : cloudStubs}
      />
    </>
  );
}

function ReplayList({ stubs }: { stubs: ReplayStub[] }) {
  const [searchParams, setSearchParams] = useSearchParams();

  const { page, setPage, filters, setFilters } = useFileStore();
  const pageSize = 10;

  const filteredStubs = stubs.filter((stub) => {
    const allowedStages = filters
      .filter((filter) => filter.type === "stage")
      .map(Number);
    if (allowedStages.length > 0 && !allowedStages.includes(stub.stageId)) {
      return false;
    }
    const neededCharacterCounts: Record<number, number> = {};
    for (const filter of filters
      .filter((filter) => filter.type === "character")
      .map(Number)) {
      neededCharacterCounts[filter] = (neededCharacterCounts[filter] ?? 0) + 1;
    }
    for (const player of stub.players) {
      if (neededCharacterCounts[player.externalCharacterId] > 0) {
        neededCharacterCounts[player.externalCharacterId]--;
      }
    }
    if (Object.values(neededCharacterCounts).some((count) => count > 0)) {
      return false;
    }
    return true;
  });

  return (
    <>
      <div className="mt-2 grid grow auto-rows-max grid-cols-[repeat(5,auto)] gap-x-4 text-sm">
        {filteredStubs
          .slice(page * pageSize, page * pageSize + pageSize)
          .map((stub) => (
            <button
              key={stub.slug}
              className={cn(
                "col-span-full grid grid-cols-subgrid items-center rounded border-2 px-4 py-1",
                stub.slug === searchParams.get("slug")
                  ? "border-primary bg-primary/10"
                  : "border-transparent hover:border-border hover:bg-foreground/10",
              )}
              onClick={() => {
                searchParams.set("slug", stub.slug);
                setSearchParams(searchParams);
              }}
            >
              <div className="capitalize">{stub.type}</div>
              <div>
                <div>
                  {new Date(stub.startTimestamp).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </div>
                <div>
                  {new Date(stub.startTimestamp).toLocaleTimeString(undefined, {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </div>
              </div>

              <img
                src={`/stages/${stub.stageId}.png`}
                className="h-12 rounded border"
              />
              {stub.players.map((player) => (
                <div
                  key={player.playerIndex}
                  className="flex items-center gap-2"
                >
                  <img
                    src={`/stockicons/${player.externalCharacterId}/${player.costumeIndex}.png`}
                    className="h-6"
                  />
                  <div>
                    <div className="max-w-[8ch] overflow-hidden text-ellipsis whitespace-nowrap text-start">
                      {player.displayName ??
                        shortCharactersExt[player.externalCharacterId]}
                    </div>
                    <div className="text-start text-xs text-foreground/70">
                      {player.connectCode ?? `Port ${player.playerIndex + 1}`}
                    </div>
                  </div>
                </div>
              ))}
            </button>
          ))}
      </div>
      <div className="mt-auto flex items-center gap-4">
        <Button size="icon" variant="outline" onClick={() => setPage(0)}>
          <PinLeftIcon />
        </Button>
        <Button size="icon" variant="outline" onClick={() => setPage(page - 1)}>
          <ArrowLeftIcon />
        </Button>
        <div className="mx-auto text-sm">
          Page {page + 1} of {Math.ceil(filteredStubs.length / pageSize)}
        </div>
        <Button size="icon" variant="outline" onClick={() => setPage(page + 1)}>
          <ArrowRightIcon />
        </Button>
        <Button
          size="icon"
          variant="outline"
          onClick={() =>
            setPage(Math.ceil(filteredStubs.length / pageSize) - 1)
          }
        >
          <PinRightIcon />
        </Button>
      </div>
    </>
  );
}
