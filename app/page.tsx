import HealthQuestApp from "@/components/health-quest-app"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-gradient-to-b from-emerald-50 to-teal-100">
      <div className="w-full max-w-md mx-auto">
        <HealthQuestApp />
      </div>
    </main>
  )
}
