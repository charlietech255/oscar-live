import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { ChannelScreen } from "./index";
import { MyTvLiveStreaming } from "@/components/MyTvLiveStreaming";
import { Radio, Tv } from "lucide-react";

export const Route = createFileRoute("/live")({
  head: () => ({
    meta: [
      { title: "Live TV & myTV Streaming — Kasigara TV" },
      {
        name: "description",
        content: "Tazama chaneli za moja kwa moja kupitia myTV Streaming API na kicheza video cha Shaka Player na Hls.js.",
      },
      { property: "og:title", content: "Live TV & myTV Streaming" },
      { property: "og:description", content: "Live MPEG-DASH & HLS TV Streaming" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LivePage,
});

function LivePage() {
  const [source, setSource] = useState<"mytv" | "local">("mytv");

  return (
    <div>
      {/* Source Toggle: myTV Streaming API vs Ndani */}
      <div className="mx-auto max-w-6xl px-4 pt-4">
        <div className="inline-flex rounded-lg border border-border bg-card p-1 text-xs">
          <button
            type="button"
            onClick={() => setSource("mytv")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-all ${source === "mytv"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
              }`}
          >
            <Tv className="h-3.5 w-3.5" /> myTV Streaming API
          </button>
          <button
            type="button"
            onClick={() => setSource("local")}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-medium transition-all ${source === "local"
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
              }`}
          >
            <Radio className="h-3.5 w-3.5" /> Chaneli za Ndani
          </button>
        </div>
      </div>

      {source === "mytv" ? <MyTvLiveStreaming /> : <ChannelScreen liveOnly />}
    </div>
  );
}
