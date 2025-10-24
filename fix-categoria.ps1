$filePath = "c:\Users\dalmo\OneDrive\Documents\semanadajuventude\semanadajuventude\src\pages\ModalidadeDetalhe.jsx"
$content = Get-Content $filePath -Raw

# Substituir a linha modalidadeId={data.id} seguida de onResultadosChange= adicionando categoria
$content = $content -replace '(modalidadeId=\{data\.id\})\s+(onResultadosChange=)', '$1' + "`n`t`t`t`tcategoria={data.categoria}`n`t`t`t`t`$2"

# Salvar o arquivo
$content | Set-Content $filePath -NoNewline

Write-Host "Arquivo atualizado com sucesso!"
