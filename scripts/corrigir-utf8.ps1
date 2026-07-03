# Execute na raiz do projeto FlowDelivery.
# Este script regrava os arquivos de código em UTF-8 e ajuda a evitar caracteres quebrados no Windows.

$extensoes = @('*.js', '*.jsx', '*.css', '*.html', '*.json', '*.md', '*.txt')

foreach ($ext in $extensoes) {
  Get-ChildItem -Path . -Recurse -Include $ext -File |
    Where-Object { $_.FullName -notmatch '\\node_modules\\|\\dist\\|\\.git\\' } |
    ForEach-Object {
      $conteudo = Get-Content $_.FullName -Raw -Encoding UTF8
      Set-Content -Path $_.FullName -Value $conteudo -Encoding utf8
    }
}

Write-Host 'Arquivos regravados em UTF-8 com sucesso.' -ForegroundColor Green
Write-Host 'Para verificar textos do banco, rode: cd backend; npm run encoding:check' -ForegroundColor Cyan
