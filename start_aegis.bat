@echo off
title AEGIS - AI-Driven DevSecOps Framework
echo ======================================================================
echo           AEGIS - AI-Driven DevSecOps Telecom Security Platform
echo ======================================================================
echo.
echo [1/2] Starting Python FastAPI Backend on http://127.0.0.1:8088 ...
start "AEGIS Backend (FastAPI)" cmd /k "cd /d "%~dp0backend" && python -m uvicorn app.main:app --host 127.0.0.1 --port 8088"

echo [2/2] Starting React Vite Frontend on http://127.0.0.1:5173 ...
start "AEGIS Frontend (Vite)" cmd /k "cd /d "%~dp0frontend" && npm run dev"

echo.
echo Both services are starting...
timeout /t 3 /nobreak >nul
start http://localhost:5173
echo.
echo AEGIS is now running and connected!
echo Frontend: http://localhost:5173
echo Backend:  http://127.0.0.1:8088
echo Swagger:  http://127.0.0.1:8088/docs
echo ======================================================================
pause
