import { createFileRoute } from "@tanstack/react-router";
import { ChannelScreen } from "./index";

export const Route = createFileRoute("/live")({
  head: () => ({
    meta: [
      { title: "Live TV — Kasigara TV" },
      {
        name: "description",
        content: "Chagua chaneli ya moja kwa moja na utazame michezo, habari na burudani.",
      },
      { property: "og:title", content: "Live TV — Kasigara TV" },
      { property: "og:description", content: "Chaneli za moja kwa moja kwenye Kasigara TV." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <ChannelScreen liveOnly />,
});
