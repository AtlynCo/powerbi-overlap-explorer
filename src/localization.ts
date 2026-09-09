import powerbi from "powerbi-visuals-api";
import en from "json-loader!../stringResources/en-US/resources.resjson";
import fr from "json-loader!../stringResources/fr-FR/resources.resjson";

export type MessageKey = keyof typeof en;
export function localizer(host: powerbi.extensibility.visual.IVisualHost): (key: MessageKey, ...args: string[]) => string {
  const manager = host.createLocalizationManager();
  const fallback = host.locale.toLowerCase().startsWith("fr") ? fr : en;
  return (key, ...args) => {
    const localized = manager.getDisplayName(key);
    const text = localized && localized !== key ? localized : fallback[key];
    return text.replace(/\{(\d+)\}/g, (_, index: string) => args[Number(index)] ?? "");
  };
}
