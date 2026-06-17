# WhatsApp Phone Number Pairing Code — Design Spec

**Date:** 2026-06-17  
**Status:** Approved  
**Project:** nexBotix (renaming to botx)

---

## Overview

Currently the only way to connect a WhatsApp account is by scanning a QR code. This spec adds **phone number + pairing code** as an alternative login method. A user enters their phone number, receives an 8-character code, and enters it in WhatsApp → Linked Devices → Link with Phone Number.

The feature surfaces as a "Phone Number | QR Code" tab toggle inside:
1. **`SetupPage.tsx` Step 2** — the Connect WhatsApp step in the post-registration wizard
2. **`QRCodeModal.tsx`** — the existing WhatsApp connection modal in the main app

---

## Goals

- Let users connect WhatsApp without needing to scan a QR code (useful on desktop-only setups)
- Minimal backend changes — new endpoint + one new service method
- Consistent UX across both entry points (SetupPage and QRCodeModal)

## Non-Goals

- Replacing QR — both methods coexist as tabs
- Multi-device management
- Phone number validation beyond E.164 format check

---

## Dependencies

`SetupPage.tsx` is created by the **Bot Activation Setup Flow** plan (`2026-06-16-bot-activation-setup-flow.md`). That plan must be executed before the pairing code UI can be added to Step 2.

---

## Architecture

### New Files

| File | Purpose |
|------|---------|
| `whatsapp-bulk-server-go/internal/handler/whatsapp_pair.go` | `PairPhone` HTTP handler |

### Modified Files

| File | Change |
|------|--------|
| `whatsapp-bulk-server-go/internal/service/whatsapp.go` | Add `isPairing` field + `InitForPairing` method + `IsPairing` accessor |
| `whatsapp-bulk-server-go/internal/handler/whatsapp.go` | SSE timeout: skip `Reinitialize` when `isPairing` |
| `whatsapp-bulk-server-go/cmd/server/main.go` | Register `POST /api/whatsapp/pair-phone` |
| `whatsapp-bulk-ui/src/config/api.ts` | Add `whatsapp.pairPhone` endpoint |
| `whatsapp-bulk-ui/src/pages/SetupPage.tsx` | Tab toggle in Step 2 (QR ↔ Phone) |
| `whatsapp-bulk-ui/src/components/QRCodeModal.tsx` | Tab toggle (QR ↔ Phone) |

---

## Backend Design

### New Field on `WhatsAppService`

```go
type WhatsAppService struct {
    // ... existing fields ...
    isPairing bool  // true while waiting for pairing code entry (no QR mode)
}
```

### New Service Method: `InitForPairing`

```go
// InitForPairing initializes the WhatsApp client for phone-number pairing
// (no QR code generated). Returns the 8-character pairing code to show the user.
// Must NOT be called while the service holds s.mu.
func (s *WhatsAppService) InitForPairing(phone string) (string, error) {
    s.mu.Lock()
    // Disconnect any existing client first
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

    // Connect without QR channel
    if err := s.client.Connect(); err != nil {
        return "", fmt.Errorf("failed to connect: %w", err)
    }

    ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
    defer cancel()

    code, err := s.client.PairPhone(ctx, phone, true, whatsmeow.PairClientChrome, "Chrome (Linux)")
    if err != nil {
        return "", fmt.Errorf("failed to pair phone: %w", err)
    }

    s.mu.Lock()
    s.isPairing = true
    s.mu.Unlock()

    return code, nil
}

func (s *WhatsAppService) IsPairing() bool {
    s.mu.RLock()
    defer s.mu.RUnlock()
    return s.isPairing
}
```

When the user enters the code in WhatsApp, whatsmeow fires `*events.Connected` with `client.Store.ID != nil` → existing `handleEvents` sends `s.readyChan <- true` → SSE emits `ready`. No changes to `handleEvents` needed.

### Modified: SSE Timeout Handling

In `GetQRCode` handler, the `<-timeout` branch currently always calls `Reinitialize()`. When in pairing mode, this would kill the pairing session. Guard it:

```go
case <-timeout:
    if waService.IsPairing() {
        // Pairing code has expired. Let the frontend handle retry.
        data, _ := json.Marshal(types.ProgressUpdate{Type: "timeout", Data: "Pairing code expired"})
        fmt.Fprintf(w, "data: %s\n\n", data)
        flusher.Flush()
        return
    }
    // Existing QR timeout behavior
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

### New Handler: `PairPhone`

File: `whatsapp-bulk-server-go/internal/handler/whatsapp_pair.go`

```go
package handler

import (
    "encoding/json"
    "net/http"
    "regexp"
    "github.com/JASIM0021/bulk-whatsapp-send/backend/internal/middleware"
    "github.com/JASIM0021/bulk-whatsapp-send/backend/internal/types"
)

var e164Re = regexp.MustCompile(`^\+[1-9]\d{6,14}$`)

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
    if err := json.NewDecoder(r.Body).Decode(&req); err != nil || !e164Re.MatchString(req.Phone) {
        respondError(w, "Invalid phone number — must be E.164 format (e.g. +919876543210)", http.StatusBadRequest)
        return
    }

    waService, err := h.getOrCreateService(userID)
    if err != nil {
        respondError(w, fmt.Sprintf("Failed to get session: %v", err), http.StatusInternalServerError)
        return
    }

    code, err := waService.InitForPairing(req.Phone)
    if err != nil {
        respondError(w, fmt.Sprintf("Failed to generate pairing code: %v", err), http.StatusInternalServerError)
        return
    }

    respondJSON(w, types.APIResponse{
        Success: true,
        Data:    map[string]string{"code": code},
    })
}
```

### Route Registration

In `cmd/server/main.go`, alongside existing WhatsApp routes:

```go
mux.Handle("/api/whatsapp/pair-phone", wrapWhatsApp(whatsappHandler.PairPhone))
```

---

## Frontend Design

### API Config

In `src/config/api.ts`, add to the `whatsapp` group:

```ts
pairPhone: `${API_BASE_URL}/api/whatsapp/pair-phone`,
```

### Phone Tab State Machine

```
idle → loading → code_shown → connected
                     ↓
                  expired (60s) → idle (user clicks "Get new code")
                     ↓
                  error → idle (user retries)
```

### `PhoneTabState` Type

```ts
type PhoneTabState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'code_shown'; code: string; secondsLeft: number }
  | { status: 'expired' }
  | { status: 'error'; message: string }
  | { status: 'connected' }
```

### Phone Tab UI

```
┌──────────────────────────────────────┐
│  [Phone Number]    [QR Code]          │  ← tab toggle (pill)
├──────────────────────────────────────┤
│  idle state:                          │
│  ┌────────────────────────────────┐  │
│  │ +91 9876543210  (tel input)    │  │
│  └────────────────────────────────┘  │
│  [Get Pairing Code]  (green button)  │
│                                       │
│  code_shown state:                    │
│  ┌────────────────────────────────┐  │
│  │       A B C D - 1 2 3 4       │  │  ← 8-char monospace, large font
│  └────────────────────────────────┘  │
│  Expires in 00:45  (countdown)       │
│  Instructions:                        │
│  Open WhatsApp → Linked Devices →    │
│  Link with Phone Number → enter code │
│  [Waiting for connection…] (spinner) │
│                                       │
│  expired state:                       │
│  Code expired. [Get new code]         │
│                                       │
│  connected state → auto-advance       │
└──────────────────────────────────────┘
```

### Shared SSE Listener

Both tabs share the same SSE connection (`GET /api/whatsapp/qr` via `SSE_BASE_URL`) to detect the `ready` event. The SSE is opened:
- **QR tab**: immediately on first connect click (existing behavior)
- **Phone tab**: right after receiving the pairing code (before showing it)

When `ready` fires on either tab → call `onConnected()` which advances to Step 3 (SetupPage) or closes the modal (QRCodeModal).

### `ConnectWhatsAppStep` Component (SetupPage Step 2)

Replace the plain QR card with a tab-aware version:

```tsx
type ConnectTab = 'phone' | 'qr'

function ConnectWhatsAppStep({ onConnected }: { onConnected: () => void }) {
  const [activeTab, setActiveTab] = useState<ConnectTab>('phone')
  // ... phone tab state, QR tab state ...

  return (
    <div>
      {/* Tab toggle */}
      <div className="flex rounded-lg border border-gray-200 p-1 mb-6">
        <button onClick={() => setActiveTab('phone')}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors
            ${activeTab === 'phone' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
          Phone Number
        </button>
        <button onClick={() => setActiveTab('qr')}
          className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors
            ${activeTab === 'qr' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}>
          QR Code
        </button>
      </div>

      {activeTab === 'phone' ? (
        <PhoneTab onConnected={onConnected} />
      ) : (
        <QRTab onConnected={onConnected} />   {/* existing QR inline flow */}
      )}
    </div>
  )
}
```

### `PhoneTab` Component

Self-contained. Manages its own state. Calls `onConnected()` when SSE fires `ready`.

Key behaviors:
- Phone input: `type="tel"`, placeholder `+919876543210`
- "Get Pairing Code" button: calls `POST /api/whatsapp/pair-phone` → opens SSE → shows code
- Code displayed as formatted 8-char string: split into two groups of 4 with dash (e.g. `ABCD-1234`)
- 60-second countdown using `setInterval`; on expiry shows "Code expired" + "Get new code" button
- "Get new code" resets to `idle` state (user can re-enter phone + request new code)
- SSE `timeout` event also resets to `expired` state
- SSE `ready` event → calls `onConnected()`

### `QRCodeModal.tsx` Changes

Add the same tab toggle at the top of the modal body. Phone tab uses the same `PhoneTab` component. QR tab shows the existing QR content (no changes). `onConnected` → existing modal close + parent callback.

---

## Data Flow

```
User enters phone → POST /api/whatsapp/pair-phone
                         ↓
             InitForPairing(phone)
                  │
                  ├─ client.Connect()
                  ├─ client.PairPhone(phone) → "ABCD-1234"
                  └─ isPairing = true
                         ↓
             { success: true, data: { code: "ABCD-1234" } }
                         ↓
Frontend shows code + opens GET /api/whatsapp/qr SSE

User opens WhatsApp → Linked Devices → Link with Phone Number → enters code
                         ↓
             whatsmeow fires *events.Connected
                         ↓
             handleEvents → readyChan <- true
                         ↓
             SSE emits  data: {"type":"ready","data":"authenticated"}
                         ↓
             Frontend calls onConnected() → advances to Step 3
```

---

## Error Handling

| Scenario | Backend | Frontend |
|----------|---------|---------|
| Invalid phone format | 400 + message | Show inline error below input |
| `client.PairPhone` fails | 500 + message | Show error state with retry |
| SSE `timeout` event | Server sends timeout | Show "Code expired" + "Get new code" |
| Network error on SSE | — | Show "Connection lost — retry" |
| User switches tabs mid-flow | — | Switching tab cancels active SSE; new tab starts fresh |

---

## Out of Scope

- Pairing code resend without re-entering phone (user must re-enter to get a new code)
- Showing connected phone number on Phone tab before ready (shown in Step 3 summary)
- Phone number storage (WhatsApp JID is already persisted by existing `saveJIDToMongo`)
