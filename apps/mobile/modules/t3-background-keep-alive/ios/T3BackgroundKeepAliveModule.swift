import CoreLocation
import ExpoModulesCore
import UIKit

public final class T3BackgroundKeepAliveModule: Module {
  private lazy var keepAlive = BackgroundKeepAlive()

  public func definition() -> ModuleDefinition {
    Name("T3BackgroundKeepAlive")

    AsyncFunction("authorizationStatus") { () -> String in
      self.keepAlive.authorizationStatus
    }.runOnQueue(.main)

    // Resolves with the status once the user answers the system prompt.
    AsyncFunction("requestAuthorization") { (promise: Promise) in
      self.keepAlive.requestAuthorization { promise.resolve($0) }
    }.runOnQueue(.main)

    AsyncFunction("setEnabled") { (enabled: Bool) in
      self.keepAlive.setEnabled(enabled)
    }.runOnQueue(.main)
  }
}

/// iOS suspends an app shortly after it leaves the foreground, which drops its
/// environment sockets. While enabled, a coarse standard location session keeps
/// the app running so those connections stay open. Locations are discarded.
///
/// When In Use authorization is enough: updates started in the foreground keep
/// running in the background, with the system location indicator showing.
private final class BackgroundKeepAlive: NSObject, CLLocationManagerDelegate {
  private let manager = CLLocationManager()
  private var enabled = false
  private var pendingAuthorization: [(String) -> Void] = []

  override init() {
    super.init()
    manager.delegate = self
    manager.desiredAccuracy = kCLLocationAccuracyThreeKilometers
    manager.distanceFilter = CLLocationDistanceMax
    manager.activityType = .other
    manager.pausesLocationUpdatesAutomatically = false
    manager.showsBackgroundLocationIndicator = true
    // When In Use updates cannot start in the background, so a session the app
    // could not start then (a background launch) starts on the next activation.
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(applicationDidBecomeActive),
      name: UIApplication.didBecomeActiveNotification,
      object: nil
    )
  }

  @objc private func applicationDidBecomeActive() {
    apply()
  }

  var authorizationStatus: String {
    switch manager.authorizationStatus {
    case .notDetermined:
      return "notDetermined"
    case .authorizedWhenInUse, .authorizedAlways:
      return "authorized"
    case .denied, .restricted:
      return "denied"
    @unknown default:
      return "denied"
    }
  }

  func requestAuthorization(_ completion: @escaping (String) -> Void) {
    guard manager.authorizationStatus == .notDetermined else {
      completion(authorizationStatus)
      return
    }
    pendingAuthorization.append(completion)
    manager.requestWhenInUseAuthorization()
  }

  func setEnabled(_ enabled: Bool) {
    self.enabled = enabled
    apply()
  }

  private func apply() {
    if enabled && authorizationStatus == "authorized" {
      manager.allowsBackgroundLocationUpdates = true
      manager.startUpdatingLocation()
    } else {
      manager.stopUpdatingLocation()
      manager.allowsBackgroundLocationUpdates = false
    }
  }

  func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
    apply()
    guard manager.authorizationStatus != .notDetermined else { return }
    let status = authorizationStatus
    let completions = pendingAuthorization
    pendingAuthorization.removeAll()
    completions.forEach { $0(status) }
  }

  func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {}

  func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {}
}
