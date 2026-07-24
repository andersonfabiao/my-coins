"use client";

import { useRef, useState } from "react";
import { Download, Upload, Trash2, Sun, Moon, Monitor } from "lucide-react";
import { Header } from "@/components/ui/Header";
import { useCollection } from "@/context/CollectionContext";
import { makeBackup, parseBackup } from "@/lib/backup";
import type { Backup } from "@/types";

export default function Settings() {
  const { items, settings, setSettings, replace, merge, clear } = useCollection();
  const input = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Backup | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [message, setMessage] = useState("");

  function exportData() {
    const blob = new Blob([JSON.stringify(makeBackup([...items.values()], settings), null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `minha-colecao-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
  }

  function readFile(file: File): Promise<string> {
    if (typeof file.text === "function") return file.text();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(reader.error ?? new Error("Não foi possível ler o arquivo."));
      reader.readAsText(file);
    });
  }

  async function read(file: File) {
    try {
      if (file.size > 20 * 1024 * 1024) throw new Error("O backup excede o limite de 20 MB.");
      setPending(parseBackup(JSON.parse(await readFile(file))));
      setMessage("");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Não foi possível importar.");
    }
  }

  async function apply(mode: "replace" | "merge") {
    if (!pending) return;
    if (mode === "replace") await replace(pending.items);
    else await merge(pending.items);
    await setSettings(pending.settings);
    setPending(null);
    setMessage("Backup importado com sucesso.");
  }

  return (
    <>
      <Header title="Ajustes" subtitle="Aparência, backup e privacidade" />
      <section className="settingsCard">
        <h2>Aparência</h2>
        <p>Escolha como o aplicativo deve aparecer.</p>
        <div className="themeOptions">
          {([
            { value: "system", label: "Sistema", Icon: Monitor },
            { value: "light", label: "Claro", Icon: Sun },
            { value: "dark", label: "Escuro", Icon: Moon },
          ] as const).map(({ value, label, Icon }) => (
            <button key={value} className={settings.theme === value ? "active" : ""} onClick={() => void setSettings({ ...settings, theme: value })}>
              <Icon />{label}
            </button>
          ))}
        </div>
      </section>
      <section className="settingsCard">
        <h2>Backup da coleção</h2>
        <p>Seus dados ficam somente neste aparelho. Exporte uma cópia regularmente.</p>
        <div className="settingsActions">
          <button onClick={exportData}><Download /> Exportar JSON</button>
          <button onClick={() => input.current?.click()}><Upload /> Importar JSON</button>
        </div>
        <input className="srOnly" ref={input} type="file" accept="application/json" aria-label="Selecionar arquivo de backup JSON" onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void read(file);
        }} />
        {pending && (
          <div className="importBox">
            <p>Backup de {new Date(pending.exportedAt).toLocaleDateString("pt-BR")} com {pending.items.length} itens.</p>
            <button onClick={() => void apply("merge")}>Mesclar</button>
            <button className="primary" onClick={() => void apply("replace")}>Substituir atual</button>
          </div>
        )}
      </section>
      <section className="settingsCard danger">
        <h2>Limpar coleção</h2>
        <p>Remove todos os dados pessoais deste aparelho. Esta ação não poderá ser desfeita sem um backup.</p>
        {!confirmClear ? (
          <button onClick={() => setConfirmClear(true)}><Trash2 /> Limpar coleção</button>
        ) : (
          <div className="confirm">
            <p>Tem certeza? Toque novamente para confirmar.</p>
            <button onClick={() => setConfirmClear(false)}>Cancelar</button>
            <button className="dangerButton" onClick={() => void clear().then(() => {
              setConfirmClear(false);
              setMessage("Coleção limpa.");
            })}>Sim, apagar tudo</button>
          </div>
        )}
      </section>
      {message && <p className="notice" role="status">{message}</p>}
      <footer className="about">
        <b>Coleção de Fabião</b>
        <span>Versão 0.1 · Seus dados nunca saem do aparelho</span>
      </footer>
    </>
  );
}
