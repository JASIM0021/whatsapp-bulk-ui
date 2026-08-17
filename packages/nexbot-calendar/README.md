# @nexbotix/calendar

Official JavaScript & React SDK for [Nexbot Calendar](https://nexbotix.online) — Calendly-grade scheduling with 2-way Google Meet sync, embed widgets, and custom branding.

---

## 📦 Installation

```bash
npm install @nexbotix/calendar
# or
pnpm add @nexbotix/calendar
# or
yarn add @nexbotix/calendar
```

---

## 🚀 Quickstart

### 1. React & Next.js Hook

```tsx
import React from 'react';
import { useNexbotCalendar } from '@nexbotix/calendar';

export function ScheduleButton() {
  const { openBookingModal } = useNexbotCalendar();

  return (
    <button
      onClick={() =>
        openBookingModal({
          user: 'john-doe',
          event: '30min',
          onBookingComplete: (booking) => {
            console.log('Meeting scheduled!', booking);
          },
        })
      }
    >
      Book a Consultation
    </button>
  );
}
```

### 2. Drop-in React Components

#### Inline Calendar Widget
```tsx
import { NexbotCalendarInline } from '@nexbotix/calendar';

export function BookingSection() {
  return (
    <div className="max-w-4xl mx-auto p-4">
      <NexbotCalendarInline 
        user="john-doe" 
        event="30min" 
        height="750px" 
        borderRadius="20px"
      />
    </div>
  );
}
```

#### Popup Button
```tsx
import { NexbotCalendarButton } from '@nexbotix/calendar';

export function Header() {
  return (
    <NexbotCalendarButton
      user="john-doe"
      event="demo"
      text="Schedule a Demo"
      color="#10B981"
    />
  );
}
```

---

### 3. Vanilla JavaScript / HTML (No Framework)

```html
<!-- Include script -->
<script src="https://nexbotix.online/api/calendar/embed.js"></script>

<!-- Add floating button -->
<script>
  window.addEventListener('DOMContentLoaded', function() {
    NexbotCalendar.initButton({
      user: 'john-doe',
      event: '30min',
      text: 'Schedule Meeting',
      color: '#10B981'
    });
  });
</script>
```

---

## 🛠 Features

* 📹 **Automatic Google Meet Creation**: Generates Google Meet video call links directly upon booking.
* 🔄 **2-Way Calendar Sync**: Reads busy times from Google Calendar to prevent double bookings.
* 🎨 **Full UI Customization**: Colors, avatars, themes, and custom questions.
* 🪝 **Event Hooks**: Listen to `booking-completed`, `modal-opened`, and `modal-closed` events.
* ⚡ **Ultra-lightweight**: Zero runtime dependencies.

---

## 📄 License

MIT © [Nexbotix](https://nexbotix.online)
