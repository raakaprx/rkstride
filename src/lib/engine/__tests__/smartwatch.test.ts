import { describe, it, expect } from 'vitest';
import {
  parseBleHeartRateMeasurement,
  parseUniversalSmartwatchFile,
} from '../smartwatch';

describe('Smartwatch & BLE GATT Parser', () => {
  it('parses 8-bit BLE Heart Rate Measurement (0x2A37, flags bit 0 = 0)', () => {
    const buf = new ArrayBuffer(2);
    const view = new DataView(buf);
    view.setUint8(0, 0x00);
    view.setUint8(1, 142);
    expect(parseBleHeartRateMeasurement(view)).toBe(142);
  });

  it('parses 16-bit LE BLE Heart Rate Measurement (0x2A37, flags bit 0 = 1)', () => {
    const buf = new ArrayBuffer(3);
    const view = new DataView(buf);
    view.setUint8(0, 0x01);
    view.setUint16(1, 188, true);
    expect(parseBleHeartRateMeasurement(view)).toBe(188);
  });

  it('rejects binary .fit files explicitly with parseError instead of fabricating data', () => {
    const res = parseUniversalSmartwatchFile('binary-fit-header', 'morning_run.fit');
    expect(res.parseError).toBeDefined();
    expect(res.parseError).toMatch(/\.fit/i);
  });

  it('parses valid JSON smartwatch export without parseError', () => {
    const json = JSON.stringify({
      date: '2026-11-17',
      brand: 'garmin',
      sleep_hours: 7.5,
      resting_heart_rate: 51,
      workout: {
        distance_km: 8.2,
        duration_minutes: 42,
        avg_heart_rate: 150,
      },
    });
    const res = parseUniversalSmartwatchFile(json, 'garmin_export.json');
    expect(res.parseError).toBeUndefined();
    expect(res.brandDetected).toBe('garmin');
    expect(res.sleepHours).toBe(7.5);
    expect(res.restingHeartRate).toBe(51);
    expect(res.workoutDetected?.durationMinutes).toBe(42);
  });

  it('parses TCX/GPX XML with TotalTimeSeconds and HR values', () => {
    const tcx = `<TrainingCenterDatabase><Activities><Activity><Lap>
      <TotalTimeSeconds>1800</TotalTimeSeconds>
      <DistanceMeters>5000</DistanceMeters>
      <Trackpoint><HeartRateBpm><Value>152</Value></HeartRateBpm></Trackpoint>
    </Lap></Activity></Activities></TrainingCenterDatabase>`;
    const res = parseUniversalSmartwatchFile(tcx, 'garmin_run.tcx');
    expect(res.parseError).toBeUndefined();
    expect(res.workoutDetected?.durationMinutes).toBe(30);
    expect(res.workoutDetected?.distanceKm).toBe(5);
    expect(res.workoutDetected?.avgHeartRate).toBe(152);
  });
});
