import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { HubSettings } from "../src/components/HubSettings";
import type { HubConfig } from "../src/lib/types";

const mockConfig: HubConfig = {
  llmAvailable: true,
  llmApiKey: "••••abcd",
  llmBaseUrl: "https://openrouter.ai/api/v1",
  llmModel: "anthropic/claude-sonnet-4",
};

describe("HubSettings", () => {
  it("shows loading when config is null", () => {
    render(<HubSettings config={null} onSet={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText("Loading config...")).toBeInTheDocument();
  });

  it("renders heading and close button", () => {
    render(<HubSettings config={mockConfig} onSet={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText("Hub Settings")).toBeInTheDocument();
    expect(screen.getByText(/Close/)).toBeInTheDocument();
  });

  it("shows LLM available status when configured", () => {
    render(<HubSettings config={mockConfig} onSet={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText("LLM summary available")).toBeInTheDocument();
  });

  it("shows LLM not configured status", () => {
    const noLlm: HubConfig = { ...mockConfig, llmAvailable: false };
    render(<HubSettings config={noLlm} onSet={vi.fn()} onClose={vi.fn()} />);
    expect(screen.getByText("LLM summary not configured")).toBeInTheDocument();
  });

  it("populates base URL and model from config", () => {
    render(<HubSettings config={mockConfig} onSet={vi.fn()} onClose={vi.fn()} />);
    const baseUrlInput = screen.getByDisplayValue("https://openrouter.ai/api/v1");
    const modelInput = screen.getByDisplayValue("anthropic/claude-sonnet-4");
    expect(baseUrlInput).toBeInTheDocument();
    expect(modelInput).toBeInTheDocument();
  });

  it("does not show Save button initially", () => {
    render(<HubSettings config={mockConfig} onSet={vi.fn()} onClose={vi.fn()} />);
    expect(screen.queryByText("Save Changes")).not.toBeInTheDocument();
  });

  it("shows Save button after editing a field", async () => {
    const user = userEvent.setup();
    render(<HubSettings config={mockConfig} onSet={vi.fn()} onClose={vi.fn()} />);

    const modelInput = screen.getByDisplayValue("anthropic/claude-sonnet-4");
    await user.clear(modelInput);
    await user.type(modelInput, "gpt-4o");

    expect(screen.getByText("Save Changes")).toBeInTheDocument();
  });

  it("calls onSet for changed fields when saving", async () => {
    const onSet = vi.fn();
    const user = userEvent.setup();
    render(<HubSettings config={mockConfig} onSet={onSet} onClose={vi.fn()} />);

    const modelInput = screen.getByDisplayValue("anthropic/claude-sonnet-4");
    await user.clear(modelInput);
    await user.type(modelInput, "gpt-4o");

    await user.click(screen.getByText("Save Changes"));

    // Should call onSet for baseUrl (populated from config) and model (changed)
    expect(onSet).toHaveBeenCalledWith("llmBaseUrl", "https://openrouter.ai/api/v1");
    expect(onSet).toHaveBeenCalledWith("llmModel", "gpt-4o");
    // API key was empty, so should not be called for it
    expect(onSet).not.toHaveBeenCalledWith("llmApiKey", expect.anything());
  });

  it("calls onSet for API key when provided", async () => {
    const onSet = vi.fn();
    const user = userEvent.setup();
    render(<HubSettings config={mockConfig} onSet={onSet} onClose={vi.fn()} />);

    const apiKeyInput = screen.getByPlaceholderText(/Current: ••••abcd/);
    await user.type(apiKeyInput, "sk-newkey123");

    await user.click(screen.getByText("Save Changes"));

    expect(onSet).toHaveBeenCalledWith("llmApiKey", "sk-newkey123");
  });

  it("calls onClose when close button clicked", async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<HubSettings config={mockConfig} onSet={vi.fn()} onClose={onClose} />);

    await user.click(screen.getByText(/Close/));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("hides Save button after saving", async () => {
    const user = userEvent.setup();
    render(<HubSettings config={mockConfig} onSet={vi.fn()} onClose={vi.fn()} />);

    const modelInput = screen.getByDisplayValue("anthropic/claude-sonnet-4");
    await user.clear(modelInput);
    await user.type(modelInput, "gpt-4o");
    await user.click(screen.getByText("Save Changes"));

    expect(screen.queryByText("Save Changes")).not.toBeInTheDocument();
  });
});
