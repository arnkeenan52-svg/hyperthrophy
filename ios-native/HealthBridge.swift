// HealthBridge.swift
// Custom Capacitor plugin that reads Apple Health (HealthKit) metrics.
// Add this file (and HealthBridge.m) to ios/App/App/ in Xcode after
// `npx cap add ios`. See HEALTHKIT.md for full setup steps.

import Foundation
import Capacitor
import HealthKit

@objc(HealthBridge)
public class HealthBridge: CAPPlugin {
    private let store = HKHealthStore()

    @objc func isAvailable(_ call: CAPPluginCall) {
        call.resolve(["available": HKHealthStore.isHealthDataAvailable()])
    }

    private func readTypes() -> Set<HKObjectType> {
        var types = Set<HKObjectType>()
        if let t = HKObjectType.quantityType(forIdentifier: .stepCount) { types.insert(t) }
        if let t = HKObjectType.quantityType(forIdentifier: .bodyMass) { types.insert(t) }
        if let t = HKObjectType.quantityType(forIdentifier: .restingHeartRate) { types.insert(t) }
        if let t = HKObjectType.categoryType(forIdentifier: .sleepAnalysis) { types.insert(t) }
        return types
    }

    @objc func requestAuthorization(_ call: CAPPluginCall) {
        guard HKHealthStore.isHealthDataAvailable() else {
            call.reject("HealthKit is not available on this device")
            return
        }
        store.requestAuthorization(toShare: nil, read: readTypes()) { success, error in
            if let error = error { call.reject(error.localizedDescription); return }
            call.resolve(["granted": success])
        }
    }

    @objc func getMetrics(_ call: CAPPluginCall) {
        let group = DispatchGroup()
        var result: [String: Any] = [
            "steps": NSNull(), "sleepHours": NSNull(),
            "restingHr": NSNull(), "bodyWeightKg": NSNull(),
        ]
        let cal = Calendar.current
        let now = Date()
        let startOfDay = cal.startOfDay(for: now)

        // Steps — cumulative sum since midnight.
        if let stepType = HKObjectType.quantityType(forIdentifier: .stepCount) {
            group.enter()
            let pred = HKQuery.predicateForSamples(withStart: startOfDay, end: now, options: .strictStartDate)
            let q = HKStatisticsQuery(quantityType: stepType, quantitySamplePredicate: pred, options: .cumulativeSum) { _, stats, _ in
                if let sum = stats?.sumQuantity() {
                    result["steps"] = Int(sum.doubleValue(for: HKUnit.count()))
                }
                group.leave()
            }
            store.execute(q)
        }

        // Body mass — most recent sample, in kg.
        if let massType = HKObjectType.quantityType(forIdentifier: .bodyMass) {
            group.enter()
            let sort = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)
            let q = HKSampleQuery(sampleType: massType, predicate: nil, limit: 1, sortDescriptors: [sort]) { _, samples, _ in
                if let s = samples?.first as? HKQuantitySample {
                    let kg = s.quantity.doubleValue(for: HKUnit.gramUnit(with: .kilo))
                    result["bodyWeightKg"] = (kg * 10).rounded() / 10
                }
                group.leave()
            }
            store.execute(q)
        }

        // Resting heart rate — most recent sample, in bpm.
        if let hrType = HKObjectType.quantityType(forIdentifier: .restingHeartRate) {
            group.enter()
            let sort = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)
            let q = HKSampleQuery(sampleType: hrType, predicate: nil, limit: 1, sortDescriptors: [sort]) { _, samples, _ in
                if let s = samples?.first as? HKQuantitySample {
                    let bpm = s.quantity.doubleValue(for: HKUnit.count().unitDivided(by: .minute()))
                    result["restingHr"] = Int(bpm.rounded())
                }
                group.leave()
            }
            store.execute(q)
        }

        // Sleep — total asleep hours in the last 24h.
        if let sleepType = HKObjectType.categoryType(forIdentifier: .sleepAnalysis) {
            group.enter()
            let start = cal.date(byAdding: .hour, value: -24, to: now) ?? startOfDay
            let pred = HKQuery.predicateForSamples(withStart: start, end: now, options: [])
            let q = HKSampleQuery(sampleType: sleepType, predicate: pred, limit: HKObjectQueryNoLimit, sortDescriptors: nil) { _, samples, _ in
                var seconds = 0.0
                if let cats = samples as? [HKCategorySample] {
                    for s in cats where Self.isAsleep(s.value) {
                        seconds += s.endDate.timeIntervalSince(s.startDate)
                    }
                }
                if seconds > 0 { result["sleepHours"] = (seconds / 3600 * 10).rounded() / 10 }
                group.leave()
            }
            store.execute(q)
        }

        group.notify(queue: .main) { call.resolve(result) }
    }

    private static func isAsleep(_ value: Int) -> Bool {
        if #available(iOS 16.0, *) {
            return value == HKCategoryValueSleepAnalysis.asleepCore.rawValue
                || value == HKCategoryValueSleepAnalysis.asleepDeep.rawValue
                || value == HKCategoryValueSleepAnalysis.asleepREM.rawValue
                || value == HKCategoryValueSleepAnalysis.asleepUnspecified.rawValue
        }
        return value == HKCategoryValueSleepAnalysis.asleep.rawValue
    }
}
