[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [string]$AssemblyPath,
    [string]$DefinitionPath = (Join-Path $PSScriptRoot '..\samples\offline-pbip\OverlapSample.SemanticModel\definition')
)

$ErrorActionPreference = 'Stop'
Set-StrictMode -Version Latest
$assemblyFile = Get-Item -LiteralPath $AssemblyPath
$definition = (Resolve-Path -LiteralPath $DefinitionPath).Path
Add-Type -Path $assemblyFile.FullName
$database = [Microsoft.AnalysisServices.Tabular.TmdlSerializer]::DeserializeDatabaseFromFolder($definition)

$expected = @{
    Memberships = @{ Attribute = 'Segment'; Measures = @('Highlight signal', 'Distinct entities') }
    FeatureAdoption = @{ Attribute = 'Cohort'; Measures = @('Feature highlight signal', 'Feature distinct entities') }
}
if ($database.Model.Tables.Count -ne $expected.Count) { throw 'Expected exactly two sample tables.' }
$tables = foreach ($table in $database.Model.Tables) {
    if (-not $expected.ContainsKey($table.Name)) { throw "Unexpected table: $($table.Name)" }
    $specification = $expected[$table.Name]
    $columns = @('Entity ID', 'Set Name', $specification.Attribute)
    if ($table.Columns.Count -ne $columns.Count) { throw "Unexpected column count: $($table.Name)" }
    foreach ($column in $table.Columns) {
        if ($column.Name -cnotin $columns -or $column.SourceColumn -cne $column.Name -or $column.DataType.ToString() -ne 'String') {
            throw "Unexpected column/source mapping: $($table.Name).$($column.Name)"
        }
    }
    if ($table.Measures.Count -ne $specification.Measures.Count) { throw "Unexpected measure count: $($table.Name)" }
    foreach ($measure in $table.Measures) {
        if ($measure.Name -cnotin $specification.Measures) { throw "Unexpected measure definition: $($measure.Name)" }
    }
    if ($table.Partitions.Count -ne 1 -or $table.Partitions[0].Mode.ToString() -ne 'Import' -or
        $table.Partitions[0].Source.GetType().Name -ne 'MPartitionSource') {
        throw "Expected one import M partition: $($table.Name)"
    }
    [ordered]@{
        name = $table.Name
        columns = @($table.Columns | ForEach-Object { [ordered]@{ name = $_.Name; sourceColumn = $_.SourceColumn } })
        measureDefinitions = @($table.Measures | ForEach-Object { $_.Name })
        partition = $table.Partitions[0].Source.GetType().Name
    }
}

[ordered]@{
    validatedAt = [DateTime]::UtcNow.ToString('o')
    result = 'PASS'
    scope = 'Official TOM TMDL deserialization and object structure only; NOT M/DAX execution, refresh, native opening or rendering.'
    assembly = [Microsoft.AnalysisServices.Tabular.TmdlSerializer].Assembly.FullName
    assemblyFileVersion = $assemblyFile.VersionInfo.FileVersion
    assemblySha256 = (Get-FileHash -Algorithm SHA256 -LiteralPath $assemblyFile.FullName).Hash.ToLowerInvariant()
    powershell = $PSVersionTable.PSVersion.ToString()
    dotnet = [System.Runtime.InteropServices.RuntimeInformation]::FrameworkDescription
    compatibilityLevel = $database.CompatibilityLevel
    tables = @($tables)
} | ConvertTo-Json -Depth 8
