import { useEffect, useState } from "react";
import { api } from "@/shared/api/httpClient";
import { useUiCopy } from "@/shared/i18n/useUiCopy";
import { ConfirmDialog } from "@/shared/ui";

const endpoint = "/v1/telegram/user";

export default function TelegramNotificationSettings() {
  const copy = useUiCopy();
  const [settings, setSettings] = useState(null);
  const [link, setLink] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const response = await api.get(endpoint + "/settings");
        if (active) {
          setSettings(response.data);
          if (response.data?.connected) setLink(null);
        }
      } catch {
        if (active) setError(true);
      }
    };
    refresh();
    window.addEventListener("focus", refresh);
    return () => {
      active = false;
      window.removeEventListener("focus", refresh);
    };
  }, []);

  const performDisconnect = async () => {
    setBusy(true);
    setError(false);
    try {
      await api.delete(endpoint + "/link");
      setSettings((current) => ({ ...(current || {}), connected: false }));
      setLink(null);
      setConfirmDisconnect(false);
    } catch {
      setError(true);
      setConfirmDisconnect(false);
    } finally {
      setBusy(false);
    }
  };

  const update = async () => {
    if (settings.connected) {
      setConfirmDisconnect(true);
      return;
    }
    setBusy(true);
    setError(false);
    try {
      const response = await api.post(endpoint + "/link", {});
      setLink(response.data?.url);
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  };

  if (!settings?.available) return null;
  return (
    <section className="dash-panel notif-telegram-panel" aria-labelledby="telegram-notifications">
      <h2 id="telegram-notifications">Telegram</h2>
      <p role="status">
        {settings.connected
          ? copy("បានភ្ជាប់ការជូនដំណឹង Telegram", "Telegram notifications connected")
          : copy("ភ្ជាប់ Telegram ដើម្បីទទួលការជូនដំណឹងអំពីព្រឹត្តិការណ៍ និងការទូទាត់។",
            "Connect Telegram for event and payment updates.")}
      </p>
      {error && <p role="alert" className="notif-error">{copy("មិនអាចកែការកំណត់ Telegram បានទេ។", "Could not update Telegram settings.")}</p>}
      {link && <p><a className="dash-btn dash-btn-primary" href={link} target="_blank" rel="noreferrer">
        {copy("បើក Telegram ហើយចុច Start", "Open Telegram and press Start")}
      </a> {copy("តំណផុតកំណត់ក្នុង ៥ នាទី។", "The link expires in five minutes.")}</p>}
      <button className="dash-btn" type="button" onClick={update} disabled={busy}>
        {settings.connected ? copy("ផ្ដាច់ Telegram", "Disconnect Telegram")
          : link ? copy("បង្កើតតំណថ្មី", "Create a new link") : copy("ភ្ជាប់ Telegram", "Connect Telegram")}
      </button>
      <ConfirmDialog
        isOpen={confirmDisconnect}
        onClose={() => setConfirmDisconnect(false)}
        onConfirm={performDisconnect}
        title={copy("បញ្ជាក់ការផ្ដាច់ Telegram", "Disconnect Telegram alerts")}
        message={copy("អ្នកនឹងឈប់ទទួលការជូនដំណឹងតាម Telegram រហូតដល់អ្នកភ្ជាប់ឡើងវិញ។", "You will stop receiving Telegram alerts for events and payments until you reconnect.")}
        confirmLabel={copy("ផ្ដាច់ Telegram", "Disconnect Telegram")}
        cancelLabel={copy("រក្សាទុកការភ្ជាប់", "Keep connected")}
        isDestructive={true}
        isLoading={busy}
      />
    </section>
  );
}
