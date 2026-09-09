import { formattingSettings, FormattingSettingsService } from "powerbi-visuals-utils-formattingmodel";
import powerbi from "powerbi-visuals-api";

class AnalysisCard extends formattingSettings.SimpleCard {
  inclusive = new formattingSettings.ToggleSwitch({ name: "inclusive", displayNameKey: "InclusiveSetting", value: false });
  maxSets = new formattingSettings.NumUpDown({
    name: "maxSets", displayNameKey: "MaxSets", value: 6,
    options: { minValue: { type: powerbi.visuals.ValidatorType.Min, value: 1 }, maxValue: { type: powerbi.visuals.ValidatorType.Max, value: 10 } }
  });
  top = new formattingSettings.NumUpDown({
    name: "top", displayNameKey: "Top", value: 20,
    options: { minValue: { type: powerbi.visuals.ValidatorType.Min, value: 1 }, maxValue: { type: powerbi.visuals.ValidatorType.Max, value: 50 } }
  });
  minimum = new formattingSettings.NumUpDown({
    name: "minimum", displayNameKey: "Minimum", value: 1,
    options: { minValue: { type: powerbi.visuals.ValidatorType.Min, value: 1 }, maxValue: { type: powerbi.visuals.ValidatorType.Max, value: 30000 } }
  });
  override name = "analysis";
  override displayNameKey = "Analysis";
  override slices = [this.inclusive, this.maxSets, this.top, this.minimum];
}

class AppearanceCard extends formattingSettings.SimpleCard {
  barColor = new formattingSettings.ColorPicker({ name: "barColor", displayNameKey: "BarColor", value: { value: "#176B87" } });
  fontSize = new formattingSettings.NumUpDown({
    name: "fontSize", displayNameKey: "FontSize", value: 12,
    options: { minValue: { type: powerbi.visuals.ValidatorType.Min, value: 10 }, maxValue: { type: powerbi.visuals.ValidatorType.Max, value: 20 } }
  });
  override name = "appearance";
  override displayNameKey = "Appearance";
  override slices = [this.barColor, this.fontSize];
}

export class Settings extends formattingSettings.Model {
  analysis = new AnalysisCard();
  appearance = new AppearanceCard();
  override cards = [this.analysis, this.appearance];
}

export { FormattingSettingsService };
