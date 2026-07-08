import { apiFetch } from "./api";

export const chatWithAssistant = async ({ data }: { data: { message: string; history: any[] } }) => {
  return await apiFetch("/chatbot/chat", {
    method: "POST",
    body: JSON.stringify(data),
  });
};
