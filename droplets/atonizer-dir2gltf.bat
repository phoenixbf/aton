@echo off
SETLOCAL
REM ======================================
REM Batch atonizer tool (NodeJS required)
REM ======================================

set PROC_DIR=%~dp0
set PROC_DIR=%PROC_DIR:~,-1%

set OUTDIR=%PROC_DIR%\_prv
set ATONIZER=%PROC_DIR%\..\services\processors\Atonizer.js

mkdir %OUTDIR%

cd ..

FOR %%A IN (%*) DO (
	echo processing %%A
	node %ATONIZER% -i %%A -o %OUTDIR%
	echo %%A done.
)

PAUSE