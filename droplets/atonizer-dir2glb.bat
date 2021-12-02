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
	echo === PROCESSING FOLDER %%A ===
	node %ATONIZER% -i %%A -o %OUTDIR% --outformat glb --merge
	echo === FOLDER %%A DONE ===
)

PAUSE