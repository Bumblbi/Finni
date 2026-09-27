# Состояние release APK — 24.09.2026

Release-сборка завершена успешно. Универсальный APK создан для `armeabi-v7a`, `arm64-v8a`, `x86` и `x86_64`:

`mobile/android/app/build/outputs/apk/release/app-release.apk`

- Размер: 80 845 284 байта.
- SHA-256: `71C079E5F5C99B12BC7F422C439F52878C9D17384F1D6C3AE68D1AE528F64DB9`.
- Подпись: APK Signature Scheme v2, сертификат `CN=Finni Release`.
- SHA-256 сертификата: `9690d432bf21ecf6fed384c549cb0511cfeafe3310040d8f0950629b3c1452598`.
- Gradle: `BUILD SUCCESSFUL`, 377 задач, 46 выполнено и 331 взята из кэша.

Причиной воспроизводимого сбоя оказался слишком длинный путь к заголовкам React Native в локальном `GRADLE_USER_HOME` внутри репозитория. Ninja на Windows завершал задачу сообщением `Filename longer than 260 characters`. Сценарий сборки теперь использует короткий стандартный путь `%USERPROFILE%\.gradle`, автоматически находит JDK и Android SDK в `.artifacts/tooling`, задаёт `NODE_ENV=production` и выделяет Gradle 512 МБ Metaspace. Старые генерируемые `.cxx`-кэши были пересозданы с новыми абсолютными путями.

Предыдущий `Access violation` после перезагрузки не повторился: CMake и Ninja успешно собрали все четыре ABI. Предупреждения о deprecated API Expo/React Native и SDK XML не блокируют текущую сборку.

Повторный запуск из `mobile`:

```powershell
powershell.exe -ExecutionPolicy Bypass -File .\scripts\build-release.ps1
```

Следующая проверка — установить APK на реальное Android-устройство через ADB и пройти холодный запуск, пять периодов, родительский раздел и сброс.
