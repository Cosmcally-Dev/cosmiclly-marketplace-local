import { Header } from '@/components/layout/Header';
import { useAuth } from '@/hooks/useAuth';

const TestGuide = () => {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 pt-16 md:pt-20 p-4 max-w-3xl mx-auto w-full">
        <h1 className="text-3xl font-bold text-foreground mb-2">MVP Test Guide</h1>
        <p className="text-muted-foreground mb-8">
          Step-by-step instructions for testing audio calls, video calls, and chat.
        </p>

        {/* Current auth status */}
        <div className="bg-card border border-border rounded-xl p-4 mb-8">
          <h3 className="font-semibold text-foreground mb-2">Current Session</h3>
          {isAuthenticated ? (
            <div className="text-sm space-y-1">
              <p><span className="text-muted-foreground">Email:</span> {user?.email}</p>
              <p><span className="text-muted-foreground">User ID:</span> <code className="text-xs bg-secondary px-1 py-0.5 rounded">{user?.id}</code></p>
              <p><span className="text-muted-foreground">Role:</span> {user?.isAdvisor ? <span className="text-green-500 font-medium">Advisor</span> : <span className="text-blue-500 font-medium">Client</span>}</p>
            </div>
          ) : (
            <p className="text-sm text-amber-500">Not logged in. Sign up or sign in first.</p>
          )}
        </div>

        {/* Setup */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-foreground mb-4">1. Setup: Create Two Accounts</h2>
          <div className="bg-card border border-border rounded-xl p-5 space-y-3 text-sm">
            <p>You need <strong>two separate browser windows</strong> (or one regular + one incognito):</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <h4 className="font-semibold text-blue-400 mb-2">Browser A: Client</h4>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Sign up with any email</li>
                  <li>Leave "isAdvisor" unchecked</li>
                  <li>Note: you need credits to test billing (set in DB)</li>
                </ol>
              </div>
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <h4 className="font-semibold text-green-400 mb-2">Browser B: Advisor</h4>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Sign up with a different email</li>
                  <li>Check the "Register as Advisor" checkbox during signup</li>
                  <li>Copy the advisor's user ID from this page after login</li>
                </ol>
              </div>
            </div>
          </div>
        </section>

        {/* Important: dbId mapping */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-foreground mb-4">2. Important: Advisor ID Mapping</h2>
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-5 text-sm space-y-3">
            <p>
              Only <strong>Psychic Luna</strong> (static advisor id <code className="bg-secondary px-1 py-0.5 rounded">1</code>) has a database profile mapping.
              Her <code className="bg-secondary px-1 py-0.5 rounded">dbId</code> is <code className="bg-secondary px-1 py-0.5 rounded text-xs">45dd82c1-c457-480b-af66-4c07bd0a9d01</code>.
            </p>
            <p>
              To test with your own advisor account, you need to update <code className="bg-secondary px-1 py-0.5 rounded">src/data/advisors.ts</code>:
            </p>
            <div className="bg-background rounded-lg p-3 font-mono text-xs">
              <p className="text-muted-foreground">// Find Psychic Luna (id: '1') and change her dbId to your advisor's user ID:</p>
              <p className="mt-1">dbId: '<span className="text-green-400">YOUR_ADVISOR_USER_ID_HERE</span>'</p>
            </div>
            <p>
              After changing the dbId, the client can call/chat/video Psychic Luna and it will route to your advisor account.
            </p>
          </div>
        </section>

        {/* Test flows */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-foreground mb-4">3. Test Flows</h2>

          <div className="space-y-4">
            {/* Audio Call */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-semibold text-foreground mb-3">Audio Call Test</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-blue-400 mb-2">Client (Browser A):</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>Navigate to <a href="/call/1" target="_blank" className="text-primary underline hover:text-primary/80">/call/1</a></li>
                    <li>Should see "Ringing... Waiting for Psychic Luna"</li>
                    <li>Wait for advisor to accept</li>
                    <li>Once connected: timer starts, audio flows</li>
                    <li>Click "End Call" to finish</li>
                  </ol>
                </div>
                <div>
                  <p className="font-medium text-green-400 mb-2">Advisor (Browser B):</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>Navigate to <a href="/advisor-call" target="_blank" className="text-primary underline hover:text-primary/80">/advisor-call</a></li>
                    <li>Incoming session card appears (real-time)</li>
                    <li>Click "Accept" to connect</li>
                    <li>Audio session begins</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Video Call */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-semibold text-foreground mb-3">Video Call Test</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-blue-400 mb-2">Client (Browser A):</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>Navigate to <a href="/video/1" target="_blank" className="text-primary underline hover:text-primary/80">/video/1</a></li>
                    <li>Should see "Video call ringing..."</li>
                    <li>Once accepted: full-screen video UI</li>
                    <li>Test camera toggle and mute buttons</li>
                  </ol>
                </div>
                <div>
                  <p className="font-medium text-green-400 mb-2">Advisor (Browser B):</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>Navigate to <a href="/advisor-call" target="_blank" className="text-primary underline hover:text-primary/80">/advisor-call</a></li>
                    <li>Video session card appears</li>
                    <li>Click "Accept"</li>
                    <li>Video feeds should display</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Chat */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-semibold text-foreground mb-3">Chat Test</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="font-medium text-blue-400 mb-2">Client (Browser A):</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>Navigate to <a href="/chat/1" target="_blank" className="text-primary underline hover:text-primary/80">/chat/1</a></li>
                    <li>Should see "Waiting for advisor to accept..."</li>
                    <li>Once accepted: type and send messages</li>
                    <li>Messages appear in real-time</li>
                  </ol>
                </div>
                <div>
                  <p className="font-medium text-green-400 mb-2">Advisor (Browser B):</p>
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>Navigate to <a href="/advisor-call" target="_blank" className="text-primary underline hover:text-primary/80">/advisor-call</a></li>
                    <li>Chat session card appears</li>
                    <li>Click "Accept"</li>
                    <li>Chat interface opens, send messages back</li>
                  </ol>
                </div>
              </div>
            </div>

            {/* Decline Flow */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-semibold text-foreground mb-3">Decline Flow Test</h3>
              <p className="text-sm text-muted-foreground">
                Client starts any session type. Advisor clicks "Decline" on the incoming card.
                Client should see a "declined" toast and redirect back to the advisor profile.
              </p>
            </div>

            {/* Timeout Flow */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-semibold text-foreground mb-3">Timeout Flow Test (60 seconds)</h3>
              <p className="text-sm text-muted-foreground">
                Client starts any session type. Advisor does nothing.
                After 60 seconds, client should see "No Answer" toast and redirect back.
              </p>
            </div>
          </div>
        </section>

        {/* Quick Links */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-foreground mb-4">4. Quick Links</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <a href="/call/1" target="_blank" className="bg-card border border-border rounded-xl p-4 text-center hover:border-primary/50 transition-colors">
              <p className="font-semibold text-foreground">Audio Call</p>
              <p className="text-xs text-muted-foreground mt-1">/call/1</p>
            </a>
            <a href="/video/1" target="_blank" className="bg-card border border-border rounded-xl p-4 text-center hover:border-primary/50 transition-colors">
              <p className="font-semibold text-foreground">Video Call</p>
              <p className="text-xs text-muted-foreground mt-1">/video/1</p>
            </a>
            <a href="/chat/1" target="_blank" className="bg-card border border-border rounded-xl p-4 text-center hover:border-primary/50 transition-colors">
              <p className="font-semibold text-foreground">Chat</p>
              <p className="text-xs text-muted-foreground mt-1">/chat/1</p>
            </a>
            <a href="/advisor-call" target="_blank" className="bg-card border border-green-500/30 rounded-xl p-4 text-center hover:border-green-500/50 transition-colors">
              <p className="font-semibold text-green-400">Advisor Dashboard</p>
              <p className="text-xs text-muted-foreground mt-1">/advisor-call</p>
            </a>
          </div>
        </section>

        {/* LiveKit Notes */}
        <section className="mb-8">
          <h2 className="text-xl font-bold text-foreground mb-4">5. LiveKit Configuration</h2>
          <div className="bg-card border border-border rounded-xl p-5 text-sm space-y-2">
            <p>For audio/video calls to actually connect, you need LiveKit credentials configured as Supabase Edge Function secrets:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1">
              <li><code className="bg-secondary px-1 py-0.5 rounded">LIVEKIT_API_KEY</code></li>
              <li><code className="bg-secondary px-1 py-0.5 rounded">LIVEKIT_API_SECRET</code></li>
              <li><code className="bg-secondary px-1 py-0.5 rounded">LIVEKIT_URL</code></li>
            </ul>
            <p className="text-muted-foreground mt-2">
              Without these, the ringing/accept flow will work, but the WebRTC audio/video connection will fail after acceptance.
              Chat does NOT require LiveKit — it uses Supabase Realtime only.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
};

export default TestGuide;
