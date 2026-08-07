@echo off
echo ========================================================
echo               OnePrint Setup Script
echo ========================================================
echo.

echo [*] Installing dependencies for Root, Server, and Client...
call npm run setup

echo.
echo [*] Syncing database schema with local MySQL...
call npm run db:push

echo.
echo ========================================================
echo Setup Complete!
echo You can now double-click 'start.bat' or run 'npm run dev'!
echo ========================================================
pause
