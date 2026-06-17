# WhatsApp Phone Number Pairing Code — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add phone-number + pairing-code as an alternative to QR scanning when connecting WhatsApp, surfaced as a "Phone Number | QR Code" tab toggle in both `SetupPage.tsx` Step 2 and `QRCodeModal.tsx`.

**Architecture:** A new `POST /api/whatsapp/pair-phone` backend endpoint calls whatsmeow's `PairPhone()` (client connects without QR channel, returns 8-char code). Frontend shows the code and opens the existing SSE stream to detect the `ready` event — no new SSE endpoint needed. An `isPairing` guard prevents the SSE timeout from calling `Reinitialize()` while pairing is in progress. A shared `PhoneTab` React component is imported by both `SetupPage` and `QRCodeModal`.

**Tech Stack:** Go 1.21, `go.mau.fi/whatsmeow v0.0.0-20260305215846-fc65416c22c4`, React 18, TypeScript, Tailwind CSS, lucide-react, Server-Sent Events

**Prerequisite:** Task 4 and 5 (frontend) depend on `src/pages/SetupPage.tsx` existing. Run the **Bot Activation Setup Flow** plan (`2026-06-16-bot-activation-setup-flow.md`) first, then return here for Tasks 4–6.

---

## File Map

| Action | File |
|--------|------|
| Modify | `whatsapp-bulk-server-go/internal/service/whatsapp.go` — `isPairing` field + `InitForPairing` + `IsPairing` + reset in `initWithQRCodeLocked` |
| Modify | `whatsapp-bulk-server-go/internal/handler/whatsapp.go` — SSE timeout guard for pairing mode |
| Create | `whatsapp-bulk-server-go/internal/handler/whatsapp_pair.go` — `PairPhone` HTTP handler |
| Modify | `whatsapp-bulk-server-go/cmd/server/main.go` — register `POST /api/whatsapp/pair-phone` |
| Modify | `whatsapp-bulk-ui/src/config/api.ts` — add `pairPhone` endpoint |
| Create | `whatsapp-bulk-ui/src/components/whatsapp/PhoneTab.tsx` — shared pairing-code UI component |
| Modify | `whatsapp-bulk-ui/src/pages/SetupPage.tsx` — tab toggle in Step 2 |
| Modify | `whatsapp-bulk-ui/src/components/QRCodeModal.tsx` — tab toggle |

---

## Task 1: Backend service — `isPairing` field + `InitForPairing` + `IsPairing`

**Files:**
- Modify: `whatsapp-bulk-server-go/internal/service/whatsapp.go`

Adds the pairing-mode flag, the new service method, and a reset in the QR-init path.

- [ ] **Step 1: Add `isPairing bool` to the `WhatsAppService` struct**

In `internal/service/whatsapp.go`, find the struct definition (around line 44):

```go
type WhatsAppService struct {
	client         *whatsmeow.Client
	container      *sqlstore.Container
	qrChan         chan string
	readyChan      chan bool
	disconnectChan chan string
	mu             sync.RWMutex
	isReady        bool
	lastQR         string

	// session persistence
	db                 *db.DB
	userID             string
	stopSync           chan struct{}
	hadRestoredSession bool // true when the user's JID was found in the shared container on startup

	// bot support
	botService interface {
		HandleIncomingMessage(ctx context.Context, userID, senderPhone, messageText string, waReply func(phone, text string) error)
		HandleSelfCommand(ctx context.Context, userID, text string, waReply func(phone, text string) error)
	}
}
```

Add `isPairing bool` after `hadRestoredSession`:

```go
type WhatsAppService struct {
	client         *whatsmeow.Client
	container      *sqlstore.Container
	qrChan         chan string
	readyChan      chan bool
	disconnectChan chan string
	mu             sync.RWMutex
	isReady        bool
	lastQR         string

	// session persistence
	db                 *db.DB
	userID             string
	stopSync           chan struct{}
	hadRestoredSession bool // true when the user's JID was found in the shared container on startup
	isPairing          bool // true while waiting for pairing-code login (no QR generated)

	// bot support
	botService interface {
		HandleIncomingMessage(ctx context.Context, userID, senderPhone, messageText string, waReply func(phone, text string) error)
		HandleSelfCommand(ctx context.Context, userID, text string, waReply func(phone, text string) error)
	}
}
```

- [ ] **Step 2: Reset `isPairing` inside `initWithQRCodeLocked`**

In `internal/service/whatsapp.go`, find `initWithQRCodeLocked` (around line 280):

```go
func (s *WhatsAppService) initWithQRCodeLocked() error {
	// NewDevice creates an empty in-memory device backed by the shared container.
```

Add `s.isPairing = false` as the first line of the function body:

```go
func (s *WhatsAppService) initWithQRCodeLocked() error {
	s.isPairing = false // pairing mode ends when switching to QR flow
	// NewDevice creates an empty in-memory device backed by the shared container.
```

- [ ] **Step 3: Add `InitForPairing` and `IsPairing` methods**

At the end of `internal/service/whatsapp.go` (after `IsReady()` around line 668), append:

```go
// IsPairing returns true while the service is waiting for a pairing-code login.
// Used by the SSE handler to skip QR reinitialisation on timeout.
func (s *WhatsAppService) IsPairing() bool {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.isPairing
}

// InitForPairing connects to WhatsApp without generating a QR code and returns
// an 8-character pairing code the user enters in WhatsApp → Linked Devices.
// The existing SSE stream (/api/whatsapp/qr) will emit "ready" once the user
// enters the code and the session is established.
func (s *WhatsAppService) InitForPairing(phone string) (string, error) {
	s.mu.Lock()
	// Tear down any existing session cleanly
	if s.client != nil {
		s.client.Disconnect()
		s.client = nil
	}
	s.isReady = false
	s.lastQR = ""
	s.isPairing = false

	deviceStore := s.container.NewDevice()
	clientLog := waLog.Stdout("WhatsApp", "ERROR", true)
	s.client = whatsmeow.NewClient(deviceStore, clientLog)
	s.client.AddEventHandler(s.handleEvents)
	s.mu.Unlock()

	// Connect without QR channel — must happen before PairPhone
	if err := s.client.Connect(); err != nil {
		return "", fmt.Errorf("failed to connect: %w", err)
	}

	// PairPhone sends the pairing request to WhatsApp and returns the code.
	// whatsmeow internally strips non-digit characters so "+91…" works fine.
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	code, err := s.client.PairPhone(ctx, phone, true, whatsmeow.PairClientChrome, "Chrome (Linux)")
	if err != nil {
		return "", fmt.Errorf("failed to generate pairing code: %w", err)
	}

	s.mu.Lock()
	s.isPairing = true
	s.mu.Unlock()

	return code, nil
}
```

- [ ] **Step 4: Verify Go builds**

```bash
cd /Users/skjasimuddin/.zhwork/nexBotix/whatsapp-bulk-server-go && go build ./... 2>&1
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
cd /Users/skjasimuddin/.zhwork/nexBotix/whatsapp-bulk-server-go
git add internal/service/whatsapp.go
git commit -m "feat(whatsapp): add isPairing field, InitForPairing method, IsPairing accessor"
```

---

## Task 2: Backend — SSE timeout guard + `PairPhone` handler + route

**Files:**
- Modify: `whatsapp-bulk-server-go/internal/handler/whatsapp.go` (SSE timeout case)
- Create: `whatsapp-bulk-server-go/internal/handler/whatsapp_pair.go`
- Modify: `whatsapp-bulk-server-go/cmd/server/main.go`

- [ ] **Step 1: Guard SSE timeout against pairing mode**

In `internal/handler/whatsapp.go`, find the `<-timeout` case (around line 281):

```go
		case <-timeout:
			logger.Warn("QR code request timed out for user %s — reinitializing", userID)
			// Auto-reinitialize to generate a fresh QR code instead of giving up
			go func() {
				if err := waService.Reinitialize(); err != nil {
					logger.Error("Auto-reinitialize on timeout failed for user %s: %v", userID, err)
				}
			}()
			data, _ := json.Marshal(types.ProgressUpdate{Type: "timeout", Data: "QR code expired, reconnecting..."})
			fmt.Fprintf(w, "data: %s\n\n", data)
			flusher.Flush()
			return
```

Replace it with:

```go
		case <-timeout:
			if waService.IsPairing() {
				// Pairing codes expire after ~160s — let the frontend handle retry.
				// Do NOT reinitialize (that would switch back to QR mode mid-pairing).
				logger.Info("Pairing code timed out for user %s", userID)
				data, _ := json.Marshal(types.ProgressUpdate{Type: "timeout", Data: "Pairing code expired"})
				fmt.Fprintf(w, "data: %s\n\n", data)
				flusher.Flush()
				return
			}
			logger.Warn("QR code request timed out for user %s — reinitializing", userID)
			// Auto-reinitialize to generate a fresh QR code instead of giving up
			go func() {
				if err := waService.Reinitialize(); err != nil {
					logger.Error("Auto-reinitialize on timeout failed for user %s: %v", userID, err)
				}
			}()
			data, _ := json.Marshal(types.ProgressUpdate{Type: "timeout", Data: "QR code expired, reconnecting..."})
			fmt.Fprintf(w, "data: %s\n\n", data)
			flusher.Flush()
			return
```

- [ ] **Step 2: Create `whatsapp_pair.go` handler**

Create file `whatsapp-bulk-server-go/internal/handler/whatsapp_pair.go`:

```go
package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"regexp"

	"github.com/JASIM0021/bulk-whatsapp-send/backend/internal/logger"
	"github.com/JASIM0021/bulk-whatsapp-send/backend/internal/middleware"
	"github.com/JASIM0021/bulk-whatsapp-send/backend/internal/types"
)

var e164Regexp = regexp.MustCompile(`^\+[1-9]\d{6,14}$`)

// PairPhone accepts a phone number in E.164 format and returns an 8-character
// pairing code the user enters in WhatsApp → Linked Devices → Link with Phone Number.
// The caller should then open GET /api/whatsapp/qr (SSE) to detect the ready event.
func (h *WhatsAppHandler) PairPhone(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		respondError(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	userID, ok := middleware.GetUserID(r)
	if !ok {
		respondError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req struct {
		Phone string `json:"phone"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		respondError(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	if !e164Regexp.MatchString(req.Phone) {
		respondError(w, "phone must be E.164 format (e.g. +919876543210)", http.StatusBadRequest)
		return
	}

	waService, err := h.getOrCreateService(userID)
	if err != nil {
		respondError(w, fmt.Sprintf("Failed to get session: %v", err), http.StatusInternalServerError)
		return
	}

	logger.Info("Generating pairing code for user %s, phone %s", userID, req.Phone)

	code, err := waService.InitForPairing(req.Phone)
	if err != nil {
		logger.Error("Failed to generate pairing code for user %s: %v", userID, err)
		respondError(w, fmt.Sprintf("Failed to generate pairing code: %v", err), http.StatusInternalServerError)
		return
	}

	logger.Success("Pairing code generated for user %s", userID)
	respondJSON(w, types.APIResponse{
		Success: true,
		Data:    map[string]string{"code": code},
	})
}
```

- [ ] **Step 3: Register the route in `main.go`**

In `cmd/server/main.go`, find the WhatsApp routes block (around line 214):

```go
	mux.Handle("/api/whatsapp/init", wrapWhatsApp(whatsappHandler.Initialize))
	mux.Handle("/api/whatsapp/qr", wrapWhatsApp(whatsappHandler.GetQRCode))
```

Add the new route immediately after `/api/whatsapp/qr`:

```go
	mux.Handle("/api/whatsapp/init", wrapWhatsApp(whatsappHandler.Initialize))
	mux.Handle("/api/whatsapp/qr", wrapWhatsApp(whatsappHandler.GetQRCode))
	mux.Handle("/api/whatsapp/pair-phone", wrapWhatsApp(whatsappHandler.PairPhone))
```

- [ ] **Step 4: Verify Go builds**

```bash
cd /Users/skjasimuddin/.zhwork/nexBotix/whatsapp-bulk-server-go && go build ./... 2>&1
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
cd /Users/skjasimuddin/.zhwork/nexBotix/whatsapp-bulk-server-go
git add internal/handler/whatsapp.go internal/handler/whatsapp_pair.go cmd/server/main.go
git commit -m "feat(whatsapp): add POST /api/whatsapp/pair-phone endpoint with isPairing SSE guard"
```

---

## Task 3: Frontend — add `pairPhone` API endpoint

**Files:**
- Modify: `whatsapp-bulk-ui/src/config/api.ts`

- [ ] **Step 1: Add `pairPhone` to the `whatsapp` endpoint group**

In `src/config/api.ts`, find the `whatsapp` group (around line 29):

```ts
  whatsapp: {
    init: `${API_BASE_URL}/api/whatsapp/init`,
    qr: `${SSE_BASE_URL}/api/whatsapp/qr`,           // SSE — direct to backend
    status: `${API_BASE_URL}/api/whatsapp/status`,
```

Add `pairPhone` after `init`:

```ts
  whatsapp: {
    init: `${API_BASE_URL}/api/whatsapp/init`,
    pairPhone: `${API_BASE_URL}/api/whatsapp/pair-phone`,
    qr: `${SSE_BASE_URL}/api/whatsapp/qr`,           // SSE — direct to backend
    status: `${API_BASE_URL}/api/whatsapp/status`,
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/skjasimuddin/.zhwork/nexBotix/whatsapp-bulk-ui && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/skjasimuddin/.zhwork/nexBotix/whatsapp-bulk-ui
git add src/config/api.ts
git commit -m "feat: add pairPhone API endpoint to api.ts"
```

---

## Task 4: Shared `PhoneTab` component

**Files:**
- Create: `whatsapp-bulk-ui/src/components/whatsapp/PhoneTab.tsx`

A self-contained component that handles all phone-pairing UI states. Imported by both `SetupPage.tsx` and `QRCodeModal.tsx`. Calls `POST /api/whatsapp/pair-phone`, displays the code with a countdown, and opens the SSE stream to detect `ready`.

- [ ] **Step 1: Create the directory and file**

Create `src/components/whatsapp/PhoneTab.tsx`:

```tsx
import { useState, useRef, useCallback, useEffect } from 'react';
import { Loader, CheckCircle } from 'lucide-react';
import { apiFetch, API_ENDPOINTS, SSE_BASE_URL } from '@/config/api';

interface PhoneTabProps {
  onConnected: () => void;
  token?: string | null;
}

type PhoneTabPhase = 'idle' | 'loading' | 'code_shown' | 'expired' | 'error' | 'connected';

export function PhoneTab({ onConnected, token }: PhoneTabProps) {
  const [phone, setPhone] = useState('');
  const [phase, setPhase] = useState<PhoneTabPhase>('idle');
  const [code, setCode] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(120);
  const [errorMsg, setErrorMsg] = useState('');
  const eventSourceRef = useRef<EventSource | null>(null);
  const advanceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanup = useCallback(() => {
    eventSourceRef.current?.close();
    eventSourceRef.current = null;
    if (advanceTimerRef.current) { clearTimeout(advanceTimerRef.current); advanceTimerRef.current = null; }
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const openSSE = useCallback(() => {
    if (eventSourceRef.current) return;
    const qrUrl = token
      ? `${SSE_BASE_URL}/api/whatsapp/qr?token=${token}`
      : `${SSE_BASE_URL}/api/whatsapp/qr`;
    const es = new EventSource(qrUrl);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'ready') {
          setPhase('connected');
          cleanup();
          advanceTimerRef.current = setTimeout(onConnected, 800);
        } else if (data.type === 'timeout') {
          setPhase('expired');
          cleanup();
        }
      } catch {
        // ignore malformed SSE frames
      }
    };

    es.onerror = () => {
      cleanup();
      setPhase('error');
      setErrorMsg('Connection lost. Try again.');
    };
  }, [token, onConnected, cleanup]);

  const handleGetCode = async () => {
    if (!phone.trim()) { setErrorMsg('Enter your phone number'); return; }
    setErrorMsg('');
    setPhase('loading');

    try {
      const res = await apiFetch(API_ENDPOINTS.whatsapp.pairPhone, {
        method: 'POST',
        body: JSON.stringify({ phone: phone.trim() }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to get code');

      setCode(data.data.code as string);
      setSecondsLeft(120);
      setPhase('code_shown');

      // Countdown timer — expire at 0
      countdownRef.current = setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
            setPhase('expired');
            cleanup();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      openSSE();
    } catch (err) {
      setPhase('error');
      setErrorMsg(err instanceof Error ? err.message : 'Failed to get pairing code');
    }
  };

  const handleReset = () => {
    cleanup();
    setPhase('idle');
    setCode('');
    setErrorMsg('');
  };

  const formatCode = (c: string) =>
    c.length === 8 ? `${c.slice(0, 4)}-${c.slice(4)}` : c;

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  if (phase === 'idle' || phase === 'error') {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Your WhatsApp number
          </label>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleGetCode(); }}
            placeholder="+919876543210"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"
          />
          <p className="text-xs text-gray-400 mt-1">Include country code (e.g. +91 for India)</p>
        </div>
        {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}
        <button
          onClick={handleGetCode}
          className="flex items-center justify-center gap-2 w-full py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-500 hover:to-emerald-500 transition-all"
        >
          Get Pairing Code
        </button>
      </div>
    );
  }

  if (phase === 'loading') {
    return (
      <div className="flex flex-col items-center py-8 gap-3">
        <Loader size={28} className="animate-spin text-green-600" />
        <p className="text-gray-500 text-sm">Generating pairing code…</p>
      </div>
    );
  }

  if (phase === 'code_shown') {
    return (
      <div className="space-y-4 text-center">
        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl py-6 px-4">
          <p className="text-4xl font-mono font-bold tracking-widest text-gray-900 select-all">
            {formatCode(code)}
          </p>
        </div>
        <p className="text-sm text-gray-500">
          Expires in{' '}
          <span className="font-semibold text-gray-700">{formatTime(secondsLeft)}</span>
        </p>
        <ol className="text-sm text-gray-600 text-left space-y-1.5 bg-blue-50 rounded-xl p-4">
          <li>1. Open WhatsApp on your phone</li>
          <li>2. Tap <strong>Linked Devices</strong> → <strong>Link with Phone Number</strong></li>
          <li>3. Enter this code when prompted</li>
        </ol>
        <div className="flex items-center gap-2 justify-center text-xs text-gray-400">
          <Loader size={12} className="animate-spin" />
          Waiting for connection…
        </div>
      </div>
    );
  }

  if (phase === 'expired') {
    return (
      <div className="text-center space-y-4 py-4">
        <p className="text-amber-600 text-sm font-medium">Code expired</p>
        <button
          onClick={handleReset}
          className="flex items-center justify-center gap-2 w-full py-3 border-2 border-green-500 text-green-600 font-semibold rounded-xl hover:bg-green-50 transition-colors"
        >
          Get new code
        </button>
      </div>
    );
  }

  // connected
  return (
    <div className="py-8 text-center">
      <CheckCircle size={56} className="text-green-500 mx-auto mb-3" />
      <p className="text-green-700 font-semibold text-lg">Connected ✓</p>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/skjasimuddin/.zhwork/nexBotix/whatsapp-bulk-ui && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/skjasimuddin/.zhwork/nexBotix/whatsapp-bulk-ui
git add src/components/whatsapp/PhoneTab.tsx
git commit -m "feat: add PhoneTab component for pairing-code WhatsApp login"
```

---

## Task 5: Tab toggle in `SetupPage.tsx` Step 2

**Files:**
- Modify: `whatsapp-bulk-ui/src/pages/SetupPage.tsx`

**Prerequisite:** `SetupPage.tsx` must exist (created by the Bot Activation Setup Flow plan). This task replaces the `Step2ConnectWhatsApp` function with a tabbed version that adds the Phone Number option.

- [ ] **Step 1: Add `PhoneTab` import to `SetupPage.tsx`**

In `src/pages/SetupPage.tsx`, add this import after the existing imports:

```tsx
import { PhoneTab } from '@/components/whatsapp/PhoneTab';
```

- [ ] **Step 2: Replace `Step2ConnectWhatsApp` with the tabbed version**

Find the entire `Step2ConnectWhatsApp` function in `src/pages/SetupPage.tsx`. It starts with:

```tsx
// ── Step 2: Connect WhatsApp (inline QR) ──────────────────────────────────────

type QRPhase = 'idle' | 'loading' | 'qr' | 'authenticated' | 'ready' | 'error';

function Step2ConnectWhatsApp({ onContinue }: { onContinue: () => void }) {
```

Replace the entire `Step2ConnectWhatsApp` function (including the `type QRPhase` line above it) with:

```tsx
// ── Step 2: Connect WhatsApp (QR or Phone pairing) ────────────────────────────

type ConnectTab = 'phone' | 'qr';
type QRPhase = 'idle' | 'loading' | 'qr' | 'authenticated' | 'ready' | 'error';

function QRTab({ onConnected, token }: { onConnected: () => void; token?: string | null }) {
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [phase, setPhase] = useState<QRPhase>('idle');
  const eventSourceRef = useRef<EventSource | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cleanup = useCallback(() => {
    eventSourceRef.current?.close();
    eventSourceRef.current = null;
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const startSSE = useCallback(() => {
    cleanup();
    const qrUrl = token
      ? `${SSE_BASE_URL}/api/whatsapp/qr?token=${token}`
      : `${SSE_BASE_URL}/api/whatsapp/qr`;
    const es = new EventSource(qrUrl);
    eventSourceRef.current = es;

    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'qr') {
          setQrCode(data.data);
          setPhase('qr');
        } else if (data.type === 'authenticated') {
          setPhase('authenticated');
        } else if (data.type === 'ready') {
          setPhase('ready');
          cleanup();
          retryTimerRef.current = setTimeout(onConnected, 800);
        } else if (data.type === 'timeout') {
          setQrCode(null);
          setPhase('loading');
          cleanup();
          retryTimerRef.current = setTimeout(startSSE, 2000);
        }
      } catch {
        // ignore parse errors
      }
    };

    es.onerror = () => {
      cleanup();
      setPhase('error');
    };
  }, [token, onConnected, cleanup]);

  const handleConnect = async () => {
    setPhase('loading');
    try {
      await apiFetch(API_ENDPOINTS.whatsapp.init, { method: 'POST' });
      startSSE();
    } catch {
      setPhase('error');
    }
  };

  return (
    <div className="space-y-5 text-center">
      <div>
        <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <Smartphone size={24} className="text-green-600" />
        </div>
        <p className="text-gray-500 text-sm leading-relaxed">
          Open WhatsApp → Linked Devices → Link a Device → scan this code
        </p>
      </div>

      {phase === 'idle' && (
        <button
          onClick={handleConnect}
          className="flex items-center justify-center gap-2 w-full py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl hover:from-green-500 hover:to-emerald-500 transition-all"
        >
          Connect WhatsApp
        </button>
      )}

      {phase === 'loading' && (
        <div className="w-64 h-64 mx-auto border-4 border-gray-200 rounded-xl flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <Loader size={32} className="animate-spin text-green-600 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Generating QR code…</p>
          </div>
        </div>
      )}

      {(phase === 'qr' || phase === 'authenticated') && qrCode && (
        <div className="relative w-64 h-64 mx-auto">
          <img
            src={qrCode}
            alt="WhatsApp QR Code"
            className="w-64 h-64 border-4 border-gray-200 rounded-xl"
          />
          {phase === 'authenticated' && (
            <div className="absolute inset-0 bg-white/90 rounded-xl flex items-center justify-center">
              <div className="text-center">
                <CheckCircle size={48} className="text-green-500 mx-auto mb-2" />
                <p className="text-green-700 font-semibold">Authenticated!</p>
                <p className="text-gray-500 text-sm">Connecting…</p>
              </div>
            </div>
          )}
        </div>
      )}

      {phase === 'qr' && (
        <p className="text-xs text-gray-400 animate-pulse">Waiting for scan…</p>
      )}

      {phase === 'ready' && (
        <div className="py-6">
          <CheckCircle size={56} className="text-green-500 mx-auto mb-3" />
          <p className="text-green-700 font-semibold text-lg">Connected ✓</p>
        </div>
      )}

      {phase === 'error' && (
        <div className="space-y-3">
          <p className="text-red-600 text-sm">Connection failed. Please try again.</p>
          <button
            onClick={() => { setPhase('idle'); setQrCode(null); }}
            className="flex items-center justify-center gap-2 w-full py-3 border border-gray-200 text-gray-600 font-medium rounded-xl hover:bg-gray-50 transition-colors"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  );
}

function Step2ConnectWhatsApp({ onContinue }: { onContinue: () => void }) {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<ConnectTab>('phone');

  return (
    <div>
      {/* Tab toggle */}
      <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-1 mb-6">
        <button
          onClick={() => setActiveTab('phone')}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'phone'
              ? 'bg-white shadow-sm text-gray-900'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Phone Number
        </button>
        <button
          onClick={() => setActiveTab('qr')}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'qr'
              ? 'bg-white shadow-sm text-gray-900'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          QR Code
        </button>
      </div>

      {activeTab === 'phone' ? (
        <PhoneTab onConnected={onContinue} token={token} />
      ) : (
        <QRTab onConnected={onContinue} token={token} />
      )}
    </div>
  );
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd /Users/skjasimuddin/.zhwork/nexBotix/whatsapp-bulk-ui && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
cd /Users/skjasimuddin/.zhwork/nexBotix/whatsapp-bulk-ui
git add src/pages/SetupPage.tsx
git commit -m "feat: add Phone Number | QR Code tab toggle to SetupPage Step 2"
```

---

## Task 6: Tab toggle in `QRCodeModal.tsx`

**Files:**
- Modify: `whatsapp-bulk-ui/src/components/QRCodeModal.tsx`

Adds the same tab toggle to the existing WhatsApp connection modal (used in the main app after setup is complete). The QR tab is the existing content — no logic changes. The Phone tab is the shared `PhoneTab` component.

- [ ] **Step 1: Replace `QRCodeModal.tsx` content**

Overwrite the entire file `src/components/QRCodeModal.tsx` with:

```tsx
import { useEffect, useState, useRef, useCallback } from 'react';
import { CheckCircle } from 'lucide-react';
import { Modal } from './ui/Modal';
import { PhoneTab } from '@/components/whatsapp/PhoneTab';
import { SSE_BASE_URL } from '@/config/api';

type ConnectTab = 'phone' | 'qr';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected?: () => void;
  token?: string | null;
}

export function QRCodeModal({ isOpen, onClose, onConnected, token }: QRCodeModalProps) {
  const [activeTab, setActiveTab] = useState<ConnectTab>('phone');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const eventSourceRef = useRef<EventSource | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connectSSE = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    const qrUrl = token
      ? `${SSE_BASE_URL}/api/whatsapp/qr?token=${token}`
      : `${SSE_BASE_URL}/api/whatsapp/qr`;
    const eventSource = new EventSource(qrUrl);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'qr') {
          setQrCode(data.data);
          setIsAuthenticated(false);
          setIsReady(false);
          setRetryCount(0);
        } else if (data.type === 'authenticated') {
          setIsAuthenticated(true);
        } else if (data.type === 'ready') {
          setIsReady(true);
          if (onConnected) onConnected();
          setTimeout(() => {
            eventSource.close();
            onClose();
          }, 2000);
        } else if (data.type === 'timeout') {
          eventSource.close();
          setQrCode(null);
          retryTimerRef.current = setTimeout(() => {
            setRetryCount(prev => prev + 1);
          }, 2000);
        }
      } catch {
        // ignore parse errors
      }
    };

    eventSource.onerror = () => {
      eventSource.close();
      setRetryCount(prev => {
        if (prev < 5) {
          retryTimerRef.current = setTimeout(() => {
            setRetryCount(prev + 1);
          }, 3000);
        }
        return prev;
      });
    };
  }, [token, onConnected, onClose]);

  // QR tab: auto-connect SSE when isOpen changes
  useEffect(() => {
    if (!isOpen || activeTab !== 'qr') {
      setQrCode(null);
      setIsAuthenticated(false);
      setIsReady(false);
      setRetryCount(0);
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
      return;
    }
    connectSSE();
    return () => {
      eventSourceRef.current?.close();
      eventSourceRef.current = null;
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
        retryTimerRef.current = null;
      }
    };
  }, [isOpen, activeTab, connectSSE, retryCount]);

  // Reset tabs when modal closes
  useEffect(() => {
    if (!isOpen) {
      setActiveTab('phone');
    }
  }, [isOpen]);

  const handleConnected = () => {
    if (onConnected) onConnected();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Connect WhatsApp" maxWidth="md">
      <div className="space-y-5">
        {/* Tab toggle */}
        <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-1">
          <button
            onClick={() => setActiveTab('phone')}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'phone'
                ? 'bg-white shadow-sm text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Phone Number
          </button>
          <button
            onClick={() => setActiveTab('qr')}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'qr'
                ? 'bg-white shadow-sm text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            QR Code
          </button>
        </div>

        {/* Phone tab */}
        {activeTab === 'phone' && (
          <PhoneTab onConnected={handleConnected} token={token} />
        )}

        {/* QR tab */}
        {activeTab === 'qr' && (
          <>
            {!isReady ? (
              <>
                <div className="text-center">
                  <p className="text-gray-700 mb-4">
                    Scan the QR code with your WhatsApp mobile app
                  </p>
                  <ol className="text-sm text-gray-600 text-left space-y-2 mb-6">
                    <li>1. Open WhatsApp on your phone</li>
                    <li>2. Tap Menu or Settings and select Linked Devices</li>
                    <li>3. Tap Link a Device</li>
                    <li>4. Point your phone at this screen to scan the QR code</li>
                  </ol>
                </div>

                <div className="flex justify-center">
                  {qrCode ? (
                    <div className="relative">
                      <img
                        src={qrCode}
                        alt="QR Code"
                        className="w-64 h-64 border-4 border-gray-200 rounded-lg"
                      />
                      {isAuthenticated && (
                        <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center rounded-lg">
                          <div className="text-center">
                            <CheckCircle className="text-green-500 mx-auto mb-2" size={48} />
                            <p className="text-green-700 font-medium">Authenticated!</p>
                            <p className="text-sm text-gray-600">Connecting...</p>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="w-64 h-64 border-4 border-gray-200 rounded-lg flex items-center justify-center bg-gray-50">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4" />
                        <p className="text-gray-600">Generating QR code...</p>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="text-green-500 mx-auto mb-4" size={64} />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Connected Successfully!
                </h3>
                <p className="text-gray-600">
                  Your WhatsApp is now connected and ready to send messages.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/skjasimuddin/.zhwork/nexBotix/whatsapp-bulk-ui && npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/skjasimuddin/.zhwork/nexBotix/whatsapp-bulk-ui
git add src/components/QRCodeModal.tsx
git commit -m "feat: add Phone Number | QR Code tab toggle to QRCodeModal"
```

---

## Spec Coverage Checklist

| Requirement | Task |
|-------------|------|
| `POST /api/whatsapp/pair-phone` endpoint | Task 2 |
| Validates E.164 phone format | Task 2 (`e164Regexp`) |
| Calls `waService.InitForPairing(phone)` | Task 1 + 2 |
| `client.Connect()` without QR channel | Task 1 (`InitForPairing`) |
| `client.PairPhone(ctx, phone, true, PairClientChrome, "Chrome (Linux)")` | Task 1 |
| Returns `{ success: true, data: { code: "ABCD-1234" } }` | Task 2 |
| `isPairing` flag prevents SSE timeout reinitialize | Task 1 + 2 |
| `isPairing` reset when switching to QR mode | Task 1 (`initWithQRCodeLocked`) |
| Route registered with `wrapWhatsApp` middleware | Task 2 |
| `API_ENDPOINTS.whatsapp.pairPhone` frontend constant | Task 3 |
| `PhoneTab` shared component with full state machine | Task 4 |
| `idle → loading → code_shown → connected` states | Task 4 |
| `expired` state with "Get new code" button | Task 4 |
| `error` state with retry | Task 4 |
| 120-second countdown timer | Task 4 |
| Code displayed as `ABCD-1234` (monospace, dashed) | Task 4 |
| SSE opened after receiving code to detect `ready` | Task 4 (`openSSE` after `handleGetCode`) |
| Tab toggle in SetupPage Step 2 | Task 5 |
| Tab toggle in QRCodeModal | Task 6 |
| Switching tab closes active SSE | Task 6 (QR SSE off when `activeTab !== 'qr'`) |
| QR tab in QRCodeModal unchanged in behavior | Task 6 (same logic, moved inside conditional) |
