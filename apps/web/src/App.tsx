import type { Idea } from "@content-creation-ia/types";

export default function App() {
  const idea: Idea = {
    id: "1",
    userId: "1",
    title: "Test",
    content: "Test",
    mode: "draft",
    selectedFormats: ["blog"],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return <div>web ok — {idea.title}</div>;
}
