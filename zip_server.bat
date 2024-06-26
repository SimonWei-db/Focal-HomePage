@echo off
setlocal

:: Define the name of the zip file
set zipfile=server.zip

:: Check if the zip file already exists and delete it if it does
if exist %zipfile% del %zipfile%

:: Create the zip file and add the specified files and folders using 7-Zip
7z a -tzip %zipfile% .ebextensions server .env package.json package-lock.json

echo The files have been successfully zipped into %zipfile%
endlocal
