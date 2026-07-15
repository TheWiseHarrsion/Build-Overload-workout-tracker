import { Card } from '@/components/ui/card'

export function InstallInstructions() {
  return (
    <Card className="p-4">
      <h2 className="mb-2 text-sm font-semibold text-white">Install on iPhone</h2>
      <ol className="space-y-1 text-sm text-[#a0a0a0]">
        <li>1. Open the deployed app in Safari.</li>
        <li>2. Tap Share.</li>
        <li>3. Tap Add to Home Screen.</li>
        <li>4. Confirm Add.</li>
      </ol>
    </Card>
  )
}
