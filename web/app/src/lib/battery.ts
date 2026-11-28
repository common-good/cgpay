// A low battery, for the home screen's warning: a phone left as a cash register should stay plugged in, or payments stop.
import { Device } from '@capacitor/device'

/** The battery is below 20% and not charging. False when the phone cannot say (iPhone web views, for one). */
export async function batteryLow() {
  try { const b = await Device.getBatteryInfo(); return (b.batteryLevel ?? 1) < 0.2 && !b.isCharging } catch { return false }
}
