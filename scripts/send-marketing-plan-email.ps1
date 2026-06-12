$pdfPath = "C:\Users\Sidharth Srivastav\Documents\Compliance App\marketing\ClaimGuard-18-Day-Marketing-Plan.pdf"
$to = "yatharthlegend252@gmail.com"

if (-not (Test-Path $pdfPath)) {
    Write-Error "PDF not found: $pdfPath"
    exit 1
}

$subject = "ClaimGuard - 18-Day User Acquisition Marketing Plan"
$body = @"
Hi,

Attached is your detailed 18-day marketing plan for getting users onto the ClaimGuard website.

It covers:
- Day-by-day execution (Days 1-18)
- Channel strategy (LinkedIn, Reddit, Product Hunt, cold outreach)
- Content calendar and email sequences
- Budget scenarios ($0, $250, $500)
- Metrics and conversion targets

Start with Day 1 today: deploy live, record a 90-second demo, and post your founder story on LinkedIn.

Best,
ClaimGuard Team
"@

try {
    $outlook = New-Object -ComObject Outlook.Application
    $mail = $outlook.CreateItem(0)
    $mail.To = $to
    $mail.Subject = $subject
    $mail.Body = $body
    [void]$mail.Attachments.Add($pdfPath)
    $mail.Send()
    Write-Output "Email sent to $to via Outlook."
    exit 0
} catch {
    Write-Warning "Outlook send failed: $($_.Exception.Message)"
}

# Fallback: open default mail client with mailto (user sends manually)
$mailto = "mailto:$to?subject=$([uri]::EscapeDataString($subject))&body=$([uri]::EscapeDataString($body))"
Start-Process $mailto
Write-Output "Opened default mail client. Attach the PDF manually from: $pdfPath"
exit 2