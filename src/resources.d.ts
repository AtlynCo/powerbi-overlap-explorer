declare module "*.resjson" {
  const messages: Record<
    "Role_Entity" | "Role_Set" | "Role_Signal" | "Analysis" | "Appearance" |
    "InclusiveSetting" | "MaxSets" | "Top" | "Minimum" | "BarColor" | "FontSize" |
    "Title" | "Exact" | "Inclusive" | "ExactHelp" | "InclusiveHelp" | "Universe" |
    "Zero" | "Partial" | "Complete" | "Stats" | "Unloaded" | "Loaded" | "Reduction" |
    "Hidden" | "Binding" | "Shape" | "NoData" | "NoCombinations" | "Clear" | "Load" |
    "Loading" | "Rejected" | "RowBound" | "UnexpectedSegment" | "Retry" | "SetSizes" |
    "Combinations" | "None" | "Included" | "Excluded" | "Unrestricted" | "Count" |
    "Share" | "Highlighted" | "HighlightHelp" | "NoSignal" | "Details" |
    "DetailsCount" | "SelectEntity" | "MissingIdentity" | "SelectionLimit" |
    "SelectionFailed" | "Context" | "ContextEntity" | "RenderFailed" | "Keyboard" | "Close" | "InvalidColor" | "InteractionsDisabled" |
    "ShortTitle" | "Enlarge" | "EnlargeAdvice" | "ShortUniverse" | "ClearShort" | "ModeExact" | "ModeInclusive" |
    "PartialShort" | "ReductionShort" | "InclusiveShort" | "Diagnostics" | "RawValue" | "ChartHelp" | "BarMeaning" |
    "Inspect" | "SetsShort" | "NoneShort" | "DataStatus" | "OnboardingTitle" | "OnboardingEntity" | "OnboardingSet" |
    "OnboardingSignal" | "OnboardingBlank" | "SearchEntities" | "DetailRange" | "IdentityCount" | "Previous" | "Next" |
    "SelectionPending" | "ClearQueued" | "CompactUniverse" | "SelectSet" | "SetDetails",
    string
  >;
  export default messages;
}
