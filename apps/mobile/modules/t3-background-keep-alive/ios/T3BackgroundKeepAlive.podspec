Pod::Spec.new do |s|
  s.name           = 'T3BackgroundKeepAlive'
  s.version        = '1.0.0'
  s.summary        = 'Opt-in background keep-alive for T3 Code mobile.'
  s.description    = 'Holds a coarse location session so environment connections stay open in the background.'
  s.author         = 'T3 Tools'
  s.homepage       = 'https://t3tools.com'
  s.platforms      = {
    :ios => '18.0',
  }
  s.source         = { :path => '.' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'
  s.frameworks = 'CoreLocation'
  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }
  s.source_files = '**/*.{h,m,mm,swift,hpp,cpp}'
end
