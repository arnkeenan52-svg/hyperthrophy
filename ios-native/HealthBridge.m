// HealthBridge.m
// Registers the HealthBridge plugin and its methods with Capacitor.
// Add alongside HealthBridge.swift in ios/App/App/.

#import <Foundation/Foundation.h>
#import <Capacitor/Capacitor.h>

CAP_PLUGIN(HealthBridge, "HealthBridge",
  CAP_PLUGIN_METHOD(isAvailable, CAPPluginReturnPromise);
  CAP_PLUGIN_METHOD(requestAuthorization, CAPPluginReturnPromise);
  CAP_PLUGIN_METHOD(getMetrics, CAPPluginReturnPromise);
)
