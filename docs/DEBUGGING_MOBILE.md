# Mobile Testing & Secure Context Guide

Testing hardware features like the **Camera (QR Scanner)** on mobile browsers requires a **Secure Context** (HTTPS or Localhost). Since the prototype runs on a local IP (e.g., `http://192.168.x.x:3000`), browsers will block camera access.

Use one of the following methods to bypass this limitation.

---

## Option 1: Chrome Flags (Easiest for Android)
This is the fastest method if you are using Chrome on Android. It allows you to tell the browser to treat your local IP as a secure origin.

1.  On your mobile Chrome browser, navigate to: `chrome://flags/#unsafely-treat-insecure-origin-as-secure`
2.  Set the flag to **Enabled**.
3.  In the text box provided, enter your development URL (e.g., `http://192.168.1.10:3000`).
4.  Tap **Relaunch** at the bottom.
5.  Access the URL again, and the camera should now work.

---

## Option 2: Ngrok Tunneling (Best for iOS & External Testing)
This creates a temporary public HTTPS URL that tunnels to your local machine.

1.  On your development machine, run:
    ```bash
    npx ngrok http 3000
    ```
2.  Copy the **Forwarding URL** (it will look like `https://random-id.ngrok-free.app`).
3.  Open this HTTPS URL on your phone.
4.  **Note:** Since this is a public URL, anyone with the link can see your prototype.

---

## Option 3: USB Port Forwarding (Best for Chrome users)
If you have a USB cable, you can forward your phone's `localhost` to your PC's `localhost`.

1.  Connect your phone to your PC via USB.
2.  Enable **USB Debugging** in your phone's Developer Options.
3.  On your PC, open Chrome and go to: `chrome://inspect/#devices`
4.  Click **Port forwarding...**
5.  Add Port `3000` mapping to `localhost:3000`.
6.  On your phone's browser, navigate to `http://localhost:3000`. 
7.  Because it is `localhost`, the browser will automatically consider it a **Secure Context**.

---

## Option 4: Localtunnel (Lightweight Alternative)
Similar to Ngrok but completely free and open-source.

1.  On your development machine, run:
    ```bash
    npx localtunnel --port 3000
    ```
2.  Access the provided HTTPS URL on your phone.
## Option 5: Reset Data Tool (Universal)
Since mobile devices don't have easy access to Chrome DevTools to clear `localStorage`, the prototype includes a built-in reset tool.

1.  Open the **Navbar Menu** (Mobile: Options sub-menu | Desktop: Profile dropdown).
2.  Click/Tap **Reset Data**.
3.  Confirm the prompt.
4.  The application will call `localStorage.clear()`, wipe the Zustand store, and reload the page to the default guest state.
5.  Use this to test different **Roles** or to restart a **Cold Start Quiz** journey.
