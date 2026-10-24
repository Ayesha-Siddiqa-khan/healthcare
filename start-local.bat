@echo off
setlocal EnableExtensions DisableDelayedExpansion
set "PROJECT_DIR=%~dp0"

if /i "%~1"=="--backend" goto backend
if /i "%~1"=="--frontend" goto frontend
if not "%~1"=="" if /i not "%~1"=="--check" goto usage

if not exist "%PROJECT_DIR%backend\app\main.py" (
    echo [ERROR] Backend application is missing.
    goto failed
)
if not exist "%PROJECT_DIR%backend\.venv\Scripts\python.exe" (
    echo [ERROR] Backend Python environment is missing: backend\.venv
    goto failed
)
if not exist "%PROJECT_DIR%frontend\package.json" (
    echo [ERROR] Frontend package.json is missing.
    goto failed
)
if not exist "%PROJECT_DIR%frontend\node_modules\next\package.json" (
    echo [ERROR] Frontend dependencies are missing. Install them before launching.
    goto failed
)
where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js is not available on PATH.
    goto failed
)
where npm >nul 2>nul
if errorlevel 1 (
    echo [ERROR] npm is not available on PATH.
    goto failed
)
"%PROJECT_DIR%backend\.venv\Scripts\python.exe" -B -c "import importlib.util, sys; missing = [name for name in ('uvicorn', 'fastapi', 'pydantic_settings', 'psycopg') if importlib.util.find_spec(name) is None]; print('Missing backend dependencies: ' + ', '.join(missing)) if missing else print('Backend dependencies found.'); sys.exit(bool(missing))"
if errorlevel 1 goto failed

if /i "%~1"=="--check" (
    echo Launcher prerequisites passed. No services were started.
    exit /b 0
)

start "Healthcare Backend - 127.0.0.1:8000" /d "%PROJECT_DIR%backend" "%ComSpec%" /d /k ""%~f0" --backend"
if errorlevel 1 goto failed
start "Healthcare Frontend - 127.0.0.1:3000" /d "%PROJECT_DIR%frontend" "%ComSpec%" /d /k ""%~f0" --frontend"
if errorlevel 1 goto failed
echo Frontend: http://127.0.0.1:3000
echo Backend:  http://127.0.0.1:8000
echo Close each service window or press Ctrl+C in it to stop that service.
exit /b 0

:backend
cd /d "%PROJECT_DIR%backend"
if errorlevel 1 goto failed
echo Starting FastAPI at http://127.0.0.1:8000
".venv\Scripts\python.exe" -B -m uvicorn app.main:app --host 127.0.0.1 --port 8000
exit /b %errorlevel%

:frontend
cd /d "%PROJECT_DIR%frontend"
if errorlevel 1 goto failed
set "PORT=3000"
set "NEXT_TELEMETRY_DISABLED=1"
echo Starting Next.js at http://127.0.0.1:3000
call npm run dev
exit /b %errorlevel%

:usage
echo Usage: start-local.bat [--check]
exit /b 1

:failed
echo [ERROR] Startup could not complete. No dependencies were installed.
if /i "%~1"=="--check" exit /b 1
pause
exit /b 1
